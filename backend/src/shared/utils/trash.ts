import mongoose from 'mongoose';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import { TrashItem } from '../../domain/entities/TrashItem';
import { deleteFromS3, S3_BUCKET_NAME } from '../../infrastructure/config/s3';
import { notifyFileClients } from '../../infrastructure/repositories/FileUploadRepository';
import { emitTaskUpdated } from './taskBroadcast';

export class TrashError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const TRASH_RECOVERY_MS = 15 * 60000;
export const trashDeadline = (now = new Date()) => new Date(now.getTime() + TRASH_RECOVERY_MS);
export function storedPaths(file: any): string[] {
  return [...new Set<string>([file?.path, file?.sourcePath, file?.draftQrPath, file?.thumbnailPath].filter(value => typeof value === 'string' && value.length))];
}
export const isTrashRecoverable = (entry: any, now = new Date()) => entry?.state === 'deleted' && (!entry.purgeAt || new Date(entry.purgeAt).getTime() > now.getTime());
async function transaction<T>(work: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => work(session), { readPreference: 'primary' }) as T; }
  finally { await session.endSession(); }
}
const refresh = () => { notifyFileClients(); };

export async function trashFile(file: any, actorId: string) {
  const fileId = String(file._id), now = new Date();
  const result = await transaction(async session => {
    const current: any = await FileUpload.findById(fileId).session(session).lean();
    if (!current) throw new TrashError(404, 'File not found');
    if (current.userId !== file.userId || current.taskId !== file.taskId) throw new TrashError(409, 'File changed. Refresh before deleting.');
    const paths = storedPaths(current);
    const tasks: any[] = await Task.find({ 'files.url': { $in: paths } }).select('_id files').session(session).lean();
    const links = tasks.flatMap(task => task.files.filter((f: any) => paths.includes(f.url)).map((attachment: any) => ({ taskId: String(task._id), attachment })));
    const [entry]: any[] = await TrashItem.create([{
      kind: 'file', itemId: fileId, name: current.originalName || current.filename, taskId: current.taskId,
      ownerId: current.userId, deletedBy: actorId, deletedAt: now, purgeAt: trashDeadline(now),
      payload: { file: current, links },
    }], { session });
    await Task.updateMany({ 'files.url': { $in: paths } }, { $pull: { files: { url: { $in: paths } } } }, { session });
    await FileUpload.findOneAndDelete({ _id: fileId }, { session });
    return { trashId: String(entry._id), purgeAt: entry.purgeAt };
  });
  refresh(); return result;
}

export async function trashTaskAttachment(taskId: string, fileId: string, actorId: string) {
  const task: any = await Task.findOne({ _id: taskId, isDeleted: { $ne: true } }).read('primary').lean();
  if (!task) throw new TrashError(404, 'Task not found');
  const embedded = task.files.find((f: any) => String(f._id) === fileId || f.url?.includes(fileId));
  const found: any = /^[a-f\d]{24}$/i.test(fileId) ? await FileUpload.findOne({ _id: fileId, taskId }).lean() : null;
  const file: any = found || (embedded ? await FileUpload.findOne({ path: embedded.url, $or: [{ taskId }, { taskId: { $exists: false } }, { taskId: null }, { taskId: '' }] }).lean() : null);
  if (file) return trashFile(file, actorId);
  if (!embedded) throw new TrashError(404, 'File not found in this task');
  const now = new Date();
  const result = await transaction(async session => {
    const [entry]: any[] = await TrashItem.create([{
      kind: 'file', itemId: `${taskId}:${String(embedded._id || embedded.url)}`, name: embedded.name || 'Attachment', taskId,
      deletedBy: actorId, deletedAt: now, purgeAt: trashDeadline(now),
      payload: { links: [{ taskId, attachment: embedded }], embeddedOnly: true },
    }], { session });
    const removed = await Task.updateOne({ _id: taskId, 'files.url': embedded.url }, { $pull: { files: { url: embedded.url } } }, { session });
    if (!removed.modifiedCount) throw new TrashError(409, 'File changed. Refresh the task before deleting it.');
    return { trashId: String(entry._id), purgeAt: entry.purgeAt };
  });
  refresh(); return result;
}

export async function trashTask(taskId: string, actorId: string) {
  const now = new Date();
  const result = await transaction(async session => {
    const task: any = await Task.findOne({ _id: taskId, isDeleted: { $ne: true } }).session(session).lean();
    if (!task) {
      const existing: any = await TrashItem.findOne({ kind: 'task', itemId: taskId, state: 'deleted' }).session(session).lean();
      if (existing) return { trashId: String(existing._id), purgeAt: existing.purgeAt };
      throw new TrashError(404, 'Task not found');
    }
    const [entry]: any[] = await TrashItem.create([{
      kind: 'task', itemId: taskId, name: task.title, taskId, deletedBy: actorId, deletedAt: now, purgeAt: trashDeadline(now), payload: {},
    }], { session });
    await Task.updateOne({ _id: taskId, isDeleted: { $ne: true } }, { $set: { isDeleted: true, deletedAt: now, purgeAt: entry.purgeAt }, $push: { activities: {
      userId: actorId, userName: 'Staff', action: 'moved task to Trash', createdAt: now,
    } } }, { session });
    return { trashId: String(entry._id), purgeAt: entry.purgeAt };
  });
  refresh(); void emitTaskUpdated('task_deleted', { taskId }); return result;
}

export async function restoreTrash(trashId: string, actorId: string) {
  const result = await transaction(async session => {
    const entry: any = await TrashItem.findOne({ _id: trashId, state: 'deleted', $or: [{ purgeAt: { $exists: false } }, { purgeAt: { $gt: new Date() } }] }).session(session).lean();
    if (!entry) throw new TrashError(409, 'This item is no longer recoverable or permanent deletion has started.');
    // Touch the entry to serialize restore against the purge claim.
    await TrashItem.updateOne({ _id: entry._id, state: 'deleted' }, { $set: { updatedAt: new Date() } }, { session });
    if (entry.kind === 'task') {
      const restored = await Task.updateOne({ _id: entry.itemId, isDeleted: true }, { $set: { isDeleted: false }, $unset: { deletedAt: '', purgeAt: '' }, $push: { activities: {
        userId: actorId, userName: 'Staff', action: 'restored task from Trash', createdAt: new Date(),
      } } }, { session });
      if (!restored.matchedCount) throw new TrashError(409, 'Task is no longer in Trash.');
    } else {
      if (entry.taskId) {
        const task: any = await Task.findById(entry.taskId).session(session).lean();
        if (!task || task.isDeleted) throw new TrashError(409, 'Restore the parent task before restoring this file.');
      }
      const file = entry.payload.file;
      if (file) {
        const scope = file.taskId ? { taskId: file.taskId } : file.orderId ? { orderId: file.orderId } : { userId: file.userId };
        const collision = await FileUpload.findOne({ ...scope, originalName: file.originalName }).session(session).lean();
        if (collision) throw new TrashError(409, 'A file with this name already exists. Rename it before restoring this file.');
        await FileUpload.create([file], { session });
      }
      for (const link of entry.payload.links || []) {
        await Task.updateOne({ _id: link.taskId, 'files.url': { $ne: link.attachment.url } }, { $push: { files: link.attachment } }, { session });
      }
    }
    await TrashItem.deleteOne({ _id: entry._id }, { session });
    return { kind: entry.kind, taskId: entry.taskId, itemId: entry.itemId };
  });
  refresh();
  if (result.taskId) {
    const task = await Task.findById(result.taskId).read('primary').lean();
    if (task) void emitTaskUpdated('task_updated', { task });
  }
  return result;
}

export async function restoreTrashedTask(taskId: string, actorId: string) {
  const entry: any = await TrashItem.findOne({ kind: 'task', itemId: taskId }).lean();
  if (entry) { await restoreTrash(String(entry._id), actorId); return Task.findById(taskId).read('primary'); }
  // Legacy deleted tasks have no automatic deadline; preserve existing recovery.
  return Task.findOneAndUpdate({ _id: taskId, isDeleted: true, purgeAt: { $exists: false } }, { $set: { isDeleted: false } }, { new: true });
}

export async function purgeTrash(trashId: string, force = false) {
  const now = new Date(), stale = new Date(now.getTime() - 15 * 60000);
  const entry: any = await TrashItem.findOneAndUpdate({ _id: trashId,
    ...(force ? {} : { purgeAt: { $lte: now } }),
    $or: [{ state: 'deleted' }, { state: 'purging', purgeLeaseAt: { $lt: stale } }],
  }, { $set: { state: 'purging', purgeLeaseAt: now } }, { new: true }).lean();
  if (!entry) return false;
  try {
    let files: any[] = [], task: any = null;
    const children: any[] = entry.kind === 'task' ? await TrashItem.find({ kind: 'file', taskId: entry.itemId }).lean() : [];
    if (entry.kind === 'task') {
      task = await Task.findOne({ _id: entry.itemId, isDeleted: true }).read('primary').lean();
      if (!task) throw new Error('Task is not deleted; permanent deletion stopped.');
      files = await FileUpload.find({ taskId: entry.itemId }).read('primary').lean();
    } else if (entry.payload.file) files = [entry.payload.file];
    const paths = [...new Set<string>([
      ...(entry.purgePaths || []), ...files.flatMap(storedPaths),
      ...(task?.files || []).map((f: any) => f.url),
      ...(entry.payload.links || []).map((link: any) => link.attachment.url),
      ...children.flatMap(child => [...storedPaths(child.payload.file), ...(child.payload.links || []).map((link: any) => link.attachment.url)]),
    ].filter(Boolean))];
    await TrashItem.updateOne({ _id: entry._id, state: 'purging' }, { $set: { purgePaths: paths } });
    for (const value of paths) {
      const url = new URL(value);
      const owned = url.hostname === `${S3_BUCKET_NAME}.s3.amazonaws.com` || (url.hostname.startsWith(`${S3_BUCKET_NAME}.s3.`) && url.hostname.endsWith('.amazonaws.com'));
      if (!owned) continue; // External courier URLs are not Shop-Co objects.
      const fileReferences: any = { $or: ['path', 'sourcePath', 'draftQrPath', 'thumbnailPath'].map(key => ({ [key]: value })) };
      if (entry.kind === 'task') fileReferences.taskId = { $ne: entry.itemId };
      if (await FileUpload.exists(fileReferences).read('primary')) continue;
      const taskReferences: any = { 'files.url': value, ...(entry.kind === 'task' ? { _id: { $ne: entry.itemId } } : {}) };
      if (await Task.exists(taskReferences).read('primary')) continue;
      const protectedTrash = await TrashItem.exists({ _id: { $nin: [entry._id, ...children.map(child => child._id)] }, $or: [
        ...['path', 'sourcePath', 'draftQrPath', 'thumbnailPath'].map(key => ({ [`payload.file.${key}`]: value })),
        { 'payload.links.attachment.url': value },
      ] }).read('primary');
      if (protectedTrash) continue;
      if (!await deleteFromS3(value)) throw new Error('Stored file removal failed; metadata retained for retry.');
    }
    await transaction(async session => {
      if (entry.kind === 'task') {
        await FileUpload.deleteMany({ taskId: entry.itemId }, { session });
        await Task.deleteOne({ _id: entry.itemId, isDeleted: true }, { session });
        await TrashItem.deleteMany({ kind: 'file', taskId: entry.itemId }, { session });
      }
      await TrashItem.deleteOne({ _id: entry._id, state: 'purging' }, { session });
    });
    refresh(); return true;
  } catch (error) {
    await TrashItem.updateOne({ _id: entry._id }, { $set: { lastPurgeError: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}


let cleanupRunning = false;
export async function cleanupTrash() {
  if (cleanupRunning) return;
  cleanupRunning = true;
  try {
    const entries: any[] = await TrashItem.find({ purgeAt: { $lte: new Date() } }).select('_id').limit(100).lean();
    for (const entry of entries) {
      try { await purgeTrash(String(entry._id)); }
      catch (error) { console.error('[Trash] Permanent deletion retry pending:', String(entry._id), error instanceof Error ? error.message : String(error)); }
    }
  } finally { cleanupRunning = false; }
}
export function startTrashCleanup() {
  const run = () => { void cleanupTrash().catch(error => console.error('[Trash] Cleanup failed:', error.message)); };
  run(); const timer = setInterval(run, 60000); timer.unref();
}
