import mongoose from 'mongoose';
import { AuditLog } from '../../domain/entities/AuditLog';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import User from '../db/models/user.model';
import { DesignerReport, DesignerReportError, designerReportWindow, designerTaskName } from '../../shared/utils/designerReport';

export async function getDesignerReport(actorId: string, from: unknown, to: unknown): Promise<DesignerReport> {
  const window = designerReportWindow(from, to);
  if (!/^[a-f\d]{24}$/i.test(actorId)) throw new DesignerReportError('Select a valid staff member.');
  const staff = await User.findById(actorId).select('name role').lean();
  if (!staff || staff.role === 'client') throw new DesignerReportError('Staff member not found.', 404);
  const records = await AuditLog.aggregate<{ _id: { date: string; taskId: string } }>([
    { $match: { actorId, action: 'file_add', createdAt: { $gte: window.start, $lt: window.endExclusive }, route: /^\/api\/tasks\/[a-f\d]{24}(?:\/|$)/i } },
    { $project: { date: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: window.timezone } }, taskId: { $arrayElemAt: [{ $split: ['$route', '/'] }, 3] } } },
    { $group: { _id: { date: '$date', taskId: { $toLower: '$taskId' } } } },
  ]).option({ maxTimeMS: 15000 });
  const ids = [...new Set(records.map(record => record._id.taskId))];
  const [tasks, drafts] = await Promise.all([
    Task.find({ _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } }).select('title category customerUsername').lean(),
    FileUpload.find({ taskId: { $in: ids }, tag: 'draft' }).select('taskId originalName').sort({ createdAt: 1, _id: 1 }).lean(),
  ]);
  const taskMap = new Map(tasks.map(task => [String(task._id), task]));
  const draftMap = new Map<string, string>();
  for (const draft of drafts) if (draft.taskId && !draftMap.has(draft.taskId)) draftMap.set(draft.taskId, draft.originalName);
  const days = window.dates.map(date => ({ date, tasks: records.filter(record => record._id.date === date).map(record => {
    const id = record._id.taskId;
    const task = taskMap.get(id);
    return { id, title: task?.title || `Task ${id}`, category: task?.category || 'Lain-lain', name: task ? designerTaskName(task.title, draftMap.get(id), task.customerUsername) : `Task ${id}` };
  }).sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)) }));
  return { staff: { id: actorId, name: staff.name }, from: window.from, to: window.to, timezone: window.timezone, generatedAt: new Date().toISOString(), uniqueTasks: ids.length, taskEntries: records.length, days };
}
