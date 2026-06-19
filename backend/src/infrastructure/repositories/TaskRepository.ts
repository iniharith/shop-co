import { Task, ITask } from '../../domain/entities/Task';

export class TaskRepository {
  async create(data: Partial<ITask>): Promise<ITask> {
    return Task.create(data);
  }

  async findAll(filters?: { status?: string; assignee?: string; orderId?: string; customerUsername?: string }): Promise<ITask[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.assignee) query.assignee = filters.assignee;
    if (filters?.orderId) query.orderId = filters.orderId;
    if (filters?.customerUsername) query.customerUsername = filters.customerUsername;
    return Task.find(query).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<ITask | null> {
    return Task.findById(id);
  }

  async update(id: string, data: Partial<ITask>): Promise<ITask | null> {
    return Task.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async delete(id: string): Promise<void> {
    await Task.findByIdAndDelete(id);
  }

  async addComment(taskId: string, userId: string, userName: string, text: string, role?: string): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { comments: { userId, userName, text, role: role || 'admin', createdAt: new Date() } } },
      { new: true }
    );
  }

  async addFile(taskId: string, url: string, name: string): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { files: { url, name } } },
      { new: true }
    );
  }
}

export const taskRepository = new TaskRepository();
