import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { once } from 'events';
import auth, { authorizeRoles } from '../middlewares/auth.middileware';
import { Task } from '../../domain/entities/Task';
import { TaskDescriptionRevision } from '../../domain/entities/TaskDescriptionRevision';

export function descriptionText(value: string): string {
  return String(value || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(div|p|li|tr)>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
}
const router = Router({ mergeParams: true });
router.use(auth, authorizeRoles('sysadmin', 'admin', 'boss', 'designer', 'production', 'packaging', 'awapparel'));
router.use((req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id || '')) { res.status(400).json({ message: 'Invalid task ID' }); return; }
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});

async function taskContext(id: string) {
  const task: any = await Task.findById(id).select('title description isDeleted activities').read('primary').lean();
  const last: any = !task ? await TaskDescriptionRevision.findOne({ taskId: id }).sort({ _id: -1 }).lean() : null;
  if (!task && !last) return null;
  return { taskId: id, taskTitle: task?.title || last.taskTitle, taskDeleted: !task || !!task.isDeleted,
    currentHtml: task ? (task.description || '') : null, currentText: task ? descriptionText(task.description || '') : null,
    legacy: (task?.activities || []).filter((a: any) => a.action === 'changed description' && String(a.details || '').startsWith('from "')).map((a: any) => ({ actorName: a.userName, capturedAt: a.createdAt, details: a.details, truncated: true })),
    historicalLimit: 'Older activity entries saved only 80 characters per version. Their missing text cannot be reconstructed. Full revisions below are stored separately and survive task deletion.' };
}
const readable = (revision: any) => ({ ...revision, beforeText: descriptionText(revision.beforeHtml), afterText: descriptionText(revision.afterHtml) });

router.get('/export', asyncHandler(async (req, res) => {
  const context = await taskContext(req.params.id);
  if (!context) { res.status(404).json({ message: 'Task history not found' }); return; }
  const filename = `task-${req.params.id}-description-history`;
  const cursor = TaskDescriptionRevision.find({ taskId: req.params.id }).sort({ capturedAt: 1, _id: 1 }).lean().cursor();
  const write = async (text: string) => { if (res.destroyed) throw new Error('Download disconnected'); if (!res.write(text)) await once(res, 'drain'); };
  try {
    if (req.query.format === 'text') {
      res.attachment(filename + '.txt').type('text/plain; charset=utf-8');
      await write([context.taskTitle, `Task ID: ${context.taskId}`, context.historicalLimit, '', 'CURRENT DESCRIPTION', context.currentText ?? '(Task permanently deleted; see saved revisions.)', '', 'FULL SAVED REVISIONS', 'Times below are Malaysia time.', ''].join('\n'));
      const date = (value: any) => new Date(value).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'medium' });
      for await (const entry of cursor) { const r = readable(entry); await write(['', `${date(r.capturedAt)} MYT | ${r.actorName} | ${r.kind}`, 'BEFORE:', r.beforeText, 'AFTER:', r.afterText, ''].join('\n')); }
      await write(['', 'OLDER PARTIAL ACTIVITY RECORDS', ...context.legacy.flatMap((r: any) => ['', `${date(r.capturedAt)} MYT | ${r.actorName} | TRUNCATED AT SOURCE`, r.details])].join('\n'));
      res.end();
    } else {
      res.attachment(filename + '.json').type('application/json');
      const header = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), ...context });
      await write(header.slice(0, -1) + ',"revisions":[');
      let first = true;
      for await (const entry of cursor) { await write((first ? '' : ',') + JSON.stringify(readable(entry))); first = false; }
      res.end(']}');
    }
  } finally { await cursor.close(); }
}));
router.get('/', asyncHandler(async (req, res) => {
  if (req.query.before && !/^[a-f\d]{24}$/i.test(String(req.query.before))) { res.status(400).json({ message: 'Invalid history cursor' }); return; }
  const context = await taskContext(req.params.id);
  if (!context) { res.status(404).json({ message: 'Task history not found' }); return; }
  const anchor: any = req.query.before ? await TaskDescriptionRevision.findOne({ taskId: req.params.id, _id: req.query.before }).select('capturedAt').lean() : null;
  if (req.query.before && !anchor) { res.status(400).json({ message: 'History cursor no longer exists' }); return; }
  const query = { taskId: req.params.id, ...(anchor ? { $or: [{ capturedAt: { $lt: anchor.capturedAt } }, { capturedAt: anchor.capturedAt, _id: { $lt: anchor._id } }] } : {}) };
  const rows: any[] = await TaskDescriptionRevision.find(query).sort({ capturedAt: -1, _id: -1 }).limit(21).lean();
  const hasMore = rows.length > 20;
  if (hasMore) rows.pop();
  res.json({ ...context, revisions: rows.map(readable), nextCursor: hasMore ? String(rows[rows.length - 1]._id) : null });
}));
export default router;
