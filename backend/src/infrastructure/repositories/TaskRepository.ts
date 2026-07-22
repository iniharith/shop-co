/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Task, ITask } from '../../domain/entities/Task';

export class TaskRepository {
  async create(data: Partial<ITask>): Promise<ITask> {
    return Task.create(data);
  }

  async findAll(filters?: { status?: string; statuses?: string[]; assignee?: string; orderId?: string; customerUsername?: string; isDeleted?: boolean; days?: number; }): Promise<ITask[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.statuses && filters.statuses.length > 0) query.status = { $in: filters.statuses };
    if (filters?.assignee) query.assignee = filters.assignee;
    if (filters?.orderId) query.orderId = filters.orderId;
    if (filters?.customerUsername) query.customerUsername = filters.customerUsername;
    
    if (filters?.isDeleted === true) {
      query.isDeleted = true;
    } else {
      query.isDeleted = { $ne: true };
    }

    const days = filters?.days || 30;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    query.createdAt = { $gte: daysAgo };

    return Task.find(query)
      .select('-comments -activities -files')
      .sort({ createdAt: -1 })
      .maxTimeMS(10_000)
      .lean() as unknown as Promise<ITask[]>;
  }

  async findById(id: string): Promise<ITask | null> {
    return Task.findById(id);
  }

  async update(id: string, data: Partial<ITask>): Promise<ITask | null> {
    return Task.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async updateByOrderId(orderId: string, data: Partial<ITask>): Promise<void> {
    await Task.updateMany({ orderId }, { $set: data });
  }

  async findByOrderId(orderId: string): Promise<ITask[]> {
    return Task.find({ orderId });
  }

  async countRecent(days = 30): Promise<number> {
    const createdAfter = new Date();
    createdAfter.setDate(createdAfter.getDate() - days);
    return Task.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: createdAfter },
    });
  }

  async delete(id: string): Promise<void> {
    await Task.findByIdAndUpdate(id, { $set: { isDeleted: true } });
  }

  async permanentDelete(id: string): Promise<void> {
    await Task.findByIdAndDelete(id);
  }

  async addComment(taskId: string, userId: string, userName: string, text: string, role?: string): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { comments: { userId, userName, text, role: role || 'admin', createdAt: new Date() } } },
      { new: true }
    );
  }

  async addActivity(taskId: string, userId: string, userName: string, action: string, details?: string): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { activities: { userId, userName, action, details: details || '', createdAt: new Date() } } },
      { new: true }
    );
  }

  async deleteComment(taskId: string, commentId: string): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      taskId,
      { $pull: { comments: { _id: commentId } } as any },
      { new: true }
    );
  }

  async pinComment(taskId: string, commentId: string, pinned: boolean): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, 'comments._id': commentId },
      { $set: { 'comments.$.pinned': pinned } },
      { new: true }
    );
  }

  async addFile(taskId: string, url: string, name: string, tag?: string): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { files: { url, name, notes: '', tag: tag || 'attachment' } } },
      { new: true }
    );
  }

  async deleteFile(taskId: string, fileId: string): Promise<ITask | null> {
    const task = await Task.findById(taskId);
    if (!task) return null;

    const file = (task as any).files?.find((f: any) =>
      f._id?.toString() === fileId || f.url?.includes(fileId)
    );

    if (!file) return task;

    return Task.findByIdAndUpdate(
      taskId,
      { $pull: { files: { _id: file._id } } as any },
      { new: true }
    );
  }

  async updateFileNotes(taskId: string, fileUrl: string, notes: string): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, 'files.url': fileUrl },
      { $set: { 'files.$.notes': notes } },
      { new: true }
    );
  }
}

export const taskRepository = new TaskRepository();
