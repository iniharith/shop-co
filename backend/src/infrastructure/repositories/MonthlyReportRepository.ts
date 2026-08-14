/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Monthly orders report repository. Assembles every production task into a
 * report row — including manually created tasks that have no linked order —
 * and enriches with file totals and staff assignments for a given month.
 */
import mongoose from 'mongoose';
import OrderModel from '../db/models/order.model';
import ProductModel from '../db/models/product.model';
import UserModel from '../db/models/user.model';
import { FileUpload } from '../../domain/entities/FileUpload';
import { Task } from '../../domain/entities/Task';
import { MonthWindow } from '../../shared/utils/monthlyReport';

const PAGE_SIZE = 100;

const toStr = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value); } catch { return fallback; }
};

interface TaskPage {
  tasks: any[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

/**
 * Manual tasks usually encode the customer inside the title, e.g.
 * "F | 14 AUG 26 | KC Seriazhari (MANUAL POSTAGE)" → "Seriazhari".
 * Used as a last-resort fallback for the customer column.
 */
const kcNameFromTitle = (title: unknown): string => {
  const match = toStr(title).match(/KC\s+([A-Za-z0-9_.-]+)/i);
  return match ? match[1] : '';
};

export class MonthlyReportRepository {
  private buildCursor(value?: string): { createdAt: Date; id: string } | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) return null;
      if (!mongoose.Types.ObjectId.isValid(parsed.id)) return null;
      return { createdAt, id: parsed.id };
    } catch {
      return null;
    }
  }

  async getTaskPage(window: MonthWindow, cursor?: string, limit = PAGE_SIZE): Promise<TaskPage> {
    const safeLimit = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), 500);
    const filter: Record<string, unknown> = {
      createdAt: { $gte: window.start, $lt: window.endExclusive },
      isDeleted: { $ne: true },
    };
    const decoded = this.buildCursor(cursor);
    if (decoded) {
      filter.$or = [
        { createdAt: { $lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, _id: { $lt: new mongoose.Types.ObjectId(decoded.id) } },
      ];
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit + 1)
      .lean()
      .exec();

    const hasNextPage = tasks.length > safeLimit;
    const pageTasks = hasNextPage ? tasks.slice(0, safeLimit) : tasks;

    let nextCursor: string | null = null;
    if (hasNextPage && pageTasks.length > 0) {
      const last = pageTasks[pageTasks.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: String(last._id) })).toString('base64url');
    }

    return { tasks: pageTasks, hasNextPage, nextCursor };
  }

  async assemble(tasks: any[]): Promise<any[]> {
    if (!tasks.length) return [];

    const taskIds = tasks.map(t => String(t._id));
    const validOrderIds = tasks
      .map(t => t.orderId)
      .filter((id: unknown) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    const validProductIds = tasks
      .map(t => t.productId)
      .filter((id: unknown) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));

    const assigneeIds = [...new Set(
      tasks
        .map(t => t.assignee)
        .filter((a): a is string => typeof a === 'string' && mongoose.Types.ObjectId.isValid(a))
    )];

    const [orderDocs, productDocs, taskFiles, assigneeDocs] = await Promise.all([
      validOrderIds.length ? OrderModel.find({ _id: { $in: validOrderIds } }).lean().exec() : Promise.resolve([]),
      validProductIds.length ? ProductModel.find({ _id: { $in: validProductIds } }).select('name description category').lean().exec() : Promise.resolve([]),
      FileUpload.find({ taskId: { $in: taskIds } }).lean().exec(),
      assigneeIds.length ? UserModel.find({ _id: { $in: assigneeIds } }).select('name role').lean().exec() : Promise.resolve([]),
    ]);

    const orderMap = new Map<string, any>(orderDocs.map(o => [String(o._id), o]));
    const productMap = new Map<string, any>(productDocs.map(p => [String(p._id), p]));
    const assigneeMap = new Map<string, any>(assigneeDocs.map(u => [String(u._id), u]));

    const filesByTaskId = new Map<string, any[]>();
    for (const file of taskFiles) {
      if (!file.taskId) continue;
      const list = filesByTaskId.get(String(file.taskId)) || [];
      list.push(file);
      filesByTaskId.set(String(file.taskId), list);
    }

    const rows: any[] = [];
    for (const task of tasks) {
      const taskId = String(task._id);
      const linkedOrder = task.orderId ? orderMap.get(String(task.orderId)) : null;
      const product = task.productId ? productMap.get(String(task.productId)) : null;

      const orderItem = linkedOrder?.products?.[0] || null;
      const manualItem = linkedOrder?.manualItemName
        ? { name: linkedOrder.manualItemName, description: linkedOrder.manualItemDescription || '', category: linkedOrder.manualItemCategory || '' }
        : null;

      const itemName = orderItem?.productNameSnapshot
        || manualItem?.name
        || product?.name
        || task.title
        || 'Unknown item';
      const description = orderItem?.productDescriptionSnapshot
        || manualItem?.description
        || product?.description
        || task.description
        || '';
      const category = orderItem?.productCategorySnapshot
        || manualItem?.category
        || product?.category
        || task.category
        || 'N/A';

      const fileDocs = filesByTaskId.get(taskId) || [];
      const embeddedFiles = Array.isArray(task.files) ? task.files : [];
      const fileCount = Math.max(embeddedFiles.length, fileDocs.length) || 0;
      const fileTotalBytes = fileDocs.reduce((sum, file) => sum + (Number(file.size) || 0), 0);

      const assignee = task.assignee && assigneeMap.get(String(task.assignee));
      const assignedTo = assignee?.name || (task.assignee ? String(task.assignee) : 'Unassigned');

      // Some imported tasks store the platform order number (digits only) in
      // customerUsername; prefer the KC handle from the title for those.
      const rawUsername = toStr(task.customerUsername);
      const usableUsername = /^\d+$/.test(rawUsername) ? '' : rawUsername;

      rows.push({
        customerName: toStr(linkedOrder?.customerName || usableUsername || kcNameFromTitle(task.title), 'N/A'),
        orderId: toStr(task.orderId) || `TASK-${taskId}`,
        orderDate: task.createdAt,
        orderStatus: toStr(task.status, 'PLACED'),
        category: toStr(category, 'N/A'),
        itemName: toStr(itemName, 'Unknown item'),
        itemDescription: toStr(description),
        size: toStr(orderItem?.size || ''),
        quantity: Number(orderItem?.quantity) || 1,
        fileCount,
        fileTotalBytes,
        fileSizeMB: fileTotalBytes / (1024 * 1024),
        fileSizeGB: fileTotalBytes / (1024 * 1024 * 1024),
        assignedTo,
        assignments: assignee ? [{ assigneeId: String(task.assignee), assigneeName: assignee.name, role: assignee.role }] : [],
        fileSource: 'tasks',
      });
    }
    return rows;
  }
}

export default new MonthlyReportRepository();
