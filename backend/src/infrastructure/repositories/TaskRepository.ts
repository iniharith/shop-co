/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Task, ITask } from '../../domain/entities/Task';
import mongoose from 'mongoose';
import { encodeCursor, TaskCursor } from '../../shared/utils/cursorPagination';

export interface TaskFilters {
  status?: string;
  statuses?: string[];
  assignee?: string;
  orderId?: string;
  customerUsername?: string;
  search?: string;
  isDeleted?: boolean;
  days?: number;
  limit?: number;
  cursor?: TaskCursor;
}

export interface TaskPage {
  tasks: ITask[];
  pageInfo: {
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

export class TaskRepository {
  // Hard ceiling — no caller, present or future, can ever pull more than
  // this many tasks in one request. This is what actually stops the
  // Tasks board / print-drafts pages from silently growing an unbounded
  // payload as the DB grows, which was causing very slow loads that led
  // to memory pressure and crashes on iPad (July 2026).
  private static readonly MAX_LIMIT = 1000;
  private static readonly DEFAULT_LIMIT = 500;

  async create(data: Partial<ITask>): Promise<ITask> {
    return Task.create(data);
  }

  private buildQuery(filters?: TaskFilters): any {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.statuses && filters.statuses.length > 0) query.status = { $in: filters.statuses };
    if (filters?.assignee === 'unassigned') {
      query.assignee = { $in: [null, ''] };
    } else if (filters?.assignee) {
      query.assignee = filters.assignee;
    }
    if (filters?.orderId) query.orderId = filters.orderId;
    if (filters?.customerUsername) query.customerUsername = filters.customerUsername;

    const search = filters?.search?.trim();
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { orderId: searchRegex },
        { customerUsername: searchRegex },
        { category: searchRegex },
      ];
      if (/^[a-f\d]{24}$/i.test(search)) query.$or.push({ _id: search });
    }
    
    if (filters?.isDeleted === true) {
      query.isDeleted = true;
    } else {
      query.isDeleted = { $ne: true };
    }

    // Fully unfiltered requests (no status/statuses/assignee/orderId/deleted
    // at all — e.g. the main Tasks board, print-drafts) previously had NO
    // date bound and NO limit, so they fetched every task ever created.
    // Restore a sane default window here, same 180-day precedent already
    // used for the `statuses` filter case below.
    const isFullyUnfiltered =
      !filters?.status && !filters?.statuses?.length && !filters?.assignee &&
      !filters?.orderId && !filters?.customerUsername && !search && filters?.isDeleted !== true;

    if (filters?.days !== undefined) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filters.days);
      query.createdAt = { $gte: daysAgo };
    } else if (isFullyUnfiltered) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 180);
      query.createdAt = { $gte: daysAgo };
    }

    if (filters?.cursor) {
      const cursorBoundary = {
        $or: [
          { updatedAt: { $lt: new Date(filters.cursor.updatedAt) } },
          {
            updatedAt: new Date(filters.cursor.updatedAt),
            _id: { $lt: new mongoose.Types.ObjectId(filters.cursor.id) },
          },
        ],
      };
      query.$and = [...(query.$and || []), cursorBoundary];
    }

    return query;
  }

  private getLimit(filters?: TaskFilters): number {
    const requestedLimit = filters?.limit ?? TaskRepository.DEFAULT_LIMIT;
    return Math.min(Math.max(requestedLimit, 1), TaskRepository.MAX_LIMIT);
  }

  async findAll(filters?: TaskFilters): Promise<ITask[]> {
    const query = this.buildQuery(filters);
    const limit = this.getLimit(filters);

    return Task.find(query)
      .select('-comments -activities -files')
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit)
      .maxTimeMS(10_000)
      .lean() as unknown as Promise<ITask[]>;
  }

  async findPage(filters?: TaskFilters): Promise<TaskPage> {
    const query = this.buildQuery(filters);
    const limit = this.getLimit(filters);
    const results = await Task.find(query)
      .select('-comments -activities -files')
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .maxTimeMS(10_000)
      .lean() as unknown as ITask[];
    const hasNextPage = results.length > limit;
    const tasks = results.slice(0, limit);
    const lastTask = tasks[tasks.length - 1];
    const nextCursor = hasNextPage && lastTask
      ? encodeCursor({
          version: 1,
          updatedAt: lastTask.updatedAt.toISOString(),
          id: lastTask._id.toString(),
        })
      : null;

    return { tasks, pageInfo: { limit, hasNextPage, nextCursor } };
  }

  async findById(id: string): Promise<ITask | null> {
    return Task.findById(id);
  }

  // Task history lives in embedded arrays and can grow without bound. Limit
  // detail responses so opening one task cannot send an oversized document to
  // a browser, especially on mobile devices.
  async findDetailById(id: string): Promise<ITask | null> {
    return Task.findById(id)
      .slice('files', -50)
      .slice('comments', -100)
      .slice('activities', -100)
      .maxTimeMS(10_000);
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
