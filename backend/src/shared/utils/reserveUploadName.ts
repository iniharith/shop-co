import { Project } from '../../domain/entities/Project';
import { Request, Response } from 'express';
import { FileUpload } from '../../domain/entities/FileUpload';
import { Task } from '../../domain/entities/Task';
import { UploadNameReservation } from '../../domain/entities/UploadNameReservation';
import { nextFileName } from './duplicateFileName';

type Scope = { projectId?: string; taskId?: string; orderId?: string; userId?: string };
// Reserve at URL creation so concurrent uploads cannot choose the same name.
export async function reserveUploadName(req: Request, res: Response, scope: Scope): Promise<string | null> {
  const requested = req.body.filename;
  if (typeof requested !== 'string' || !requested.trim() || requested.length > 255) {
    res.status(400).json({ success: false, message: 'Invalid filename' });
    return null;
  }
  const filter = scope.taskId ? { taskId: scope.taskId } : scope.orderId ? { orderId: scope.orderId } : { userId: scope.userId };
  const scopeKey = JSON.stringify(scope.projectId ? { projectId: scope.projectId } : filter);
  await UploadNameReservation.init();
  const records = scope.projectId ? [] : await FileUpload.find(filter).select('originalName').lean();
  const names = records.map(file => file.originalName);
  if (scope.projectId) {
    const project = await Project.findById(scope.projectId).select('files.originalName').lean();
    names.push(...(project?.files || []).map(file => file.originalName));
  }
  if (scope.taskId) {
    const task = await Task.findById(scope.taskId).select('files.name').lean();
    names.push(...(task?.files || []).map(file => file.name));
  }
  await UploadNameReservation.deleteMany({ scope: scopeKey, expiresAt: { $lte: new Date() } });
  const reservations = await UploadNameReservation.find({ scope: scopeKey }).lean();
  names.push(...reservations.map(item => item.name));
  for (let attempt = 0; attempt < 100; attempt++) {
    const assignedName = nextFileName(requested, names);
    if (assignedName !== requested && req.body.duplicateAction !== 'rename') {
      res.json({ success: false, code: 'DUPLICATE_FILE', message: 'Duplicated file', originalName: requested, suggestedName: assignedName });
      return null;
    }
    try {
      await UploadNameReservation.create({ scope: scopeKey, name: assignedName.toLowerCase(), expiresAt: new Date(Date.now() + 3600000) });
      return assignedName;
    } catch (error: any) {
      if (error.code !== 11000) throw error;
      names.push(assignedName);
    }
  }
  throw new Error('Unable to reserve upload filename. Please retry.');
}
