import { Request, Response, NextFunction } from 'express';

export const isTaskId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
export const INVALID_TASK_ID_MESSAGE = 'Task ID is missing or invalid. Reopen the task before saving or uploading.';

export function validateTaskIdParam(_req: Request, res: Response, next: NextFunction, value: string) {
  if (!isTaskId(value)) { res.status(400).json({ success: false, code: 'INVALID_TASK_ID', message: INVALID_TASK_ID_MESSAGE }); return; }
  next();
}

export function uploadTaskId(taskId: unknown, folderPath: unknown): string | undefined {
  const explicit = taskId !== undefined && taskId !== null && taskId !== '';
  const folder = typeof folderPath === 'string' && folderPath.startsWith('tasks/') ? folderPath.slice(6) : undefined;
  if ((explicit && !isTaskId(taskId)) || (folder !== undefined && !isTaskId(folder))
      || (explicit && folder !== undefined && String(taskId).toLowerCase() !== folder.toLowerCase()))
    throw new Error(INVALID_TASK_ID_MESSAGE);
  return explicit ? taskId as string : folder;
}
