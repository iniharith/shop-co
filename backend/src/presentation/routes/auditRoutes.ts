import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuditLog } from '../../domain/entities/AuditLog';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';

const router = Router();
router.use(authMiddilware, authorizeRoles('sysadmin', 'admin', 'boss'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter: Record<string, any> = {};
  if (typeof req.query.action === 'string' && req.query.action) filter.action = req.query.action;
  if (typeof req.query.entityType === 'string' && req.query.entityType) filter.entityType = req.query.entityType;
  if (typeof req.query.actorRole === 'string' && req.query.actorRole) filter.actorRole = req.query.actorRole;
  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    const q = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
    filter.$or = [{ summary: { $regex: q, $options: 'i' } }, { actorName: { $regex: q, $options: 'i' } }];
  }
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

export default router;
