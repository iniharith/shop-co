import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuditLog } from '../../domain/entities/AuditLog';
import { Task } from '../../domain/entities/Task';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';

const router = Router();
router.use(authMiddilware, authorizeRoles('sysadmin', 'admin', 'boss'));

router.get('/filters', asyncHandler(async (_req: Request, res: Response) => {
  const [actorRows, actions] = await Promise.all([
    AuditLog.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $ne: [{ $ifNull: ['$actorId', ''] }, ''] },
              { $concat: ['id:', '$actorId'] },
              { $concat: ['name:', { $ifNull: ['$actorName', 'Unknown user'] }] },
            ],
          },
          actorName: { $first: { $ifNull: ['$actorName', 'Unknown user'] } },
          actorRole: { $first: '$actorRole' },
        },
      },
      { $set: { actorSortName: { $toLower: '$actorName' } } },
      { $sort: { actorSortName: 1 } },
    ]),
    AuditLog.distinct('action'),
  ]);
  const actors = actorRows.map(row => ({
    value: row._id,
    name: row.actorName,
    role: row.actorRole || 'unknown',
  }));
  res.json({ success: true, data: { actors, actions: actions.sort() } });
}));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter: Record<string, any> = {};
  if (typeof req.query.action === 'string' && req.query.action) filter.action = req.query.action;
  if (typeof req.query.entityType === 'string' && req.query.entityType) {
    if (req.query.entityType === 'tasks') filter.$and = [{ $or: [
      { entityType: 'tasks' }, { route: { $regex: '^/api/tasks(?:/|$)', $options: 'i' } },
    ] }];
    else filter.entityType = req.query.entityType;
  }
  if (typeof req.query.actorRole === 'string' && req.query.actorRole) filter.actorRole = req.query.actorRole;
  if (typeof req.query.actor === 'string') {
    if (req.query.actor.startsWith('id:')) filter.actorId = req.query.actor.slice(3, 203);
    if (req.query.actor.startsWith('name:')) filter.actorName = req.query.actor.slice(5, 205);
  }
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : null;
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : null;
  if (from && !Number.isNaN(from.getTime())) filter.createdAt = { ...filter.createdAt, $gte: from };
  if (to && !Number.isNaN(to.getTime())) filter.createdAt = { ...filter.createdAt, $lte: to };
  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    const q = req.query.q.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingTasks = await Task.find({ title: { $regex: q, $options: 'i' } }).select('_id').read('primary').lean();
    const ids = matchingTasks.map(task => String(task._id));
    filter.$or = [
      { summary: { $regex: q, $options: 'i' } },
      { actorName: { $regex: q, $options: 'i' } },
      { entityId: { $regex: q, $options: 'i' } },
      { action: 'status_change', entityType: 'tasks', entityId: { $in: ids },
        $expr: { $eq: ['$summary', { $concat: ['status change: ', '$entityId'] }] } },
      // Old logs accidentally recorded the task ID as entityType. Restrict
      // this fallback to task routes and ID-only summaries.
      { action: 'status_change', entityType: { $in: ids }, route: { $regex: '^/api/tasks/', $options: 'i' },
        $expr: { $eq: ['$summary', { $concat: ['status change: ', '$entityType'] }] } },
    ];
  }
  const sortFields: Record<string, string> = { date: 'createdAt', user: 'actorName', action: 'action' };
  const sortField = sortFields[typeof req.query.sortBy === 'string' ? req.query.sortBy : 'date'] || 'createdAt';
  const sortDirection: 1 | -1 = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = sortField === 'createdAt'
    ? { createdAt: sortDirection, _id: sortDirection }
    : { [sortField]: sortDirection, createdAt: -1, _id: -1 };
  const logsQuery = AuditLog.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean();
  const countQuery = AuditLog.countDocuments(filter);
  if (sortField === 'actorName' || filter.actorName) {
    logsQuery.collation({ locale: 'en', strength: 2 });
    countQuery.collation({ locale: 'en', strength: 2 });
  }
  const [logs, total] = await Promise.all([
    logsQuery,
    countQuery,
  ]);
  const taskIdForLegacySummary = (log: any): string | null => {
    if (log.action !== 'status_change') return null;
    const routeId = typeof log.route === 'string' ? /^\/api\/tasks\/([a-f\d]{24})(?:\/|$)/i.exec(log.route)?.[1] : undefined;
    const taskId = routeId || (log.entityType === 'tasks' ? log.entityId : undefined);
    return typeof taskId === 'string' && /^[a-f\d]{24}$/i.test(taskId) && log.summary === `status change: ${taskId}` ? taskId : null;
  };
  const ids = [...new Set<string>(logs.map(taskIdForLegacySummary).filter((id: string | null): id is string => id !== null))];
  const tasks = ids.length ? await Task.find({ _id: { $in: ids } }).select('title').read('primary').lean() : [];
  const titles = new Map(tasks.map((task: any) => [String(task._id).toLowerCase(), task.title]));
  const displayLogs = logs.map((log: any) => {
    const id = taskIdForLegacySummary(log);
    const title = id && titles.get(id.toLowerCase());
    return title ? { ...log, summary: `status change: ${title}` } : log;
  });
  res.json({ success: true, data: displayLogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

export default router;
