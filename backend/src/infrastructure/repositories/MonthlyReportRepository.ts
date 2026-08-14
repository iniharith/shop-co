/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Monthly orders report repository. Assembles orders with their item
 * snapshots, file totals and staff assignments for a given month window.
 */
import mongoose from 'mongoose';
import OrderModel from '../db/models/order.model';
import ProductModel from '../db/models/product.model';
import UserModel from '../db/models/user.model';
import { FileUpload } from '../../domain/entities/FileUpload';
import { ShareLink } from '../../domain/entities/ShareLink';
import { Task } from '../../domain/entities/Task';
import { MonthWindow } from '../../shared/utils/monthlyReport';

const PAGE_SIZE = 100;

const toStr = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value); } catch { return fallback; }
};

interface OrderPage {
  orders: any[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

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

  async getOrderPage(window: MonthWindow, cursor?: string, limit = PAGE_SIZE): Promise<OrderPage> {
    const safeLimit = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), 500);
    const filter: Record<string, unknown> = {
      createdAt: { $gte: window.start, $lt: window.endExclusive },
    };
    const decoded = this.buildCursor(cursor);
    if (decoded) {
      filter.$or = [
        { createdAt: { $lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, _id: { $lt: new mongoose.Types.ObjectId(decoded.id) } },
      ];
    }

    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit + 1)
      .lean()
      .exec();

    const hasNextPage = orders.length > safeLimit;
    const pageOrders = hasNextPage ? orders.slice(0, safeLimit) : orders;

    let nextCursor: string | null = null;
    if (hasNextPage && pageOrders.length > 0) {
      const last = pageOrders[pageOrders.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: String(last._id) })).toString('base64url');
    }

    return { orders: pageOrders, hasNextPage, nextCursor };
  }

  async assemble(orders: any[]): Promise<any[]> {
    if (!orders.length) return [];

    const orderIds = orders.map(o => String(o._id));
    const validOrderIds = orderIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    const productIds = orders
      .flatMap(o => (o.products || []).map((p: any) => p.product?.toString?.() || p.product))
      .filter((id: unknown) => mongoose.Types.ObjectId.isValid(id as string));

    const [productDocs, tasks, shareLinks, orderScopedFiles] = await Promise.all([
      ProductModel.find({ _id: { $in: productIds } }).select('name description category').lean().exec(),
      Task.find({ orderId: { $in: validOrderIds } }).lean().exec(),
      ShareLink.find({ orderId: { $in: validOrderIds } }).lean().exec(),
      FileUpload.find({ orderId: { $in: validOrderIds } }).lean().exec(),
    ]);

    const taskIds = tasks.map(t => String(t._id));
    const taskFiles = taskIds.length
      ? await FileUpload.find({ taskId: { $in: taskIds } }).lean().exec()
      : [];

    const shareSlugs = [...new Set(shareLinks.map(link => link.slug).filter(Boolean))];
    const shareFiles = shareSlugs.length
      ? await FileUpload.find({ shareSlug: { $in: shareSlugs } }).lean().exec()
      : [];

    const productMap = new Map<string, any>(productDocs.map(p => [String(p._id), p]));
    const tasksByOrder = new Map<string, any[]>();
    for (const task of tasks) {
      if (!task.orderId) continue;
      const list = tasksByOrder.get(String(task.orderId)) || [];
      list.push(task);
      tasksByOrder.set(String(task.orderId), list);
    }

    const assigneeIds = [...new Set(
      tasks
        .map(t => t.assignee)
        .filter((a): a is string => typeof a === 'string' && mongoose.Types.ObjectId.isValid(a))
    )];
    const assigneeDocs = assigneeIds.length
      ? await UserModel.find({ _id: { $in: assigneeIds } }).select('name role').lean().exec()
      : [];
    const assigneeMap = new Map<string, any>(assigneeDocs.map(u => [String(u._id), u]));

    const filesByOrderId = new Map<string, any[]>();
    const filesByTaskId = new Map<string, any[]>();
    const addFile = (map: Map<string, any[]>, key: string, file: any) => {
      if (!key) return;
      const list = map.get(key) || [];
      list.push(file);
      map.set(key, list);
    };
    for (const file of orderScopedFiles) {
      if (file.orderId) addFile(filesByOrderId, String(file.orderId), file);
      if (file.taskId) addFile(filesByTaskId, String(file.taskId), file);
    }
    for (const file of taskFiles) {
      if (file.orderId) addFile(filesByOrderId, String(file.orderId), file);
      if (file.taskId) addFile(filesByTaskId, String(file.taskId), file);
    }
    for (const file of shareFiles) {
      if (file.orderId) addFile(filesByOrderId, String(file.orderId), file);
      if (file.taskId) addFile(filesByTaskId, String(file.taskId), file);
    }

    const rows: any[] = [];
    for (const order of orders) {
      const orderId = String(order._id);
      const orderTasks = tasksByOrder.get(orderId) || [];

      const collectFiles = () => {
        const seen = new Set<string>();
        const files: any[] = [];
        const push = (file: any) => {
          const id = String(file._id);
          if (seen.has(id)) return;
          seen.add(id);
          files.push(file);
        };
        for (const file of filesByOrderId.get(orderId) || []) push(file);
        for (const task of orderTasks) {
          for (const file of filesByTaskId.get(String(task._id)) || []) push(file);
        }
        return files;
      };

      const files = collectFiles();
      let fileCount = files.length;
      let fileTotalBytes = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
      let fileSource = 'live';

      // Delivered orders rely on the preserved summary (files are deleted from S3).
      if (order.fileSummarySnapshot && order.fileSummarySnapshot.capturedAt) {
        const snapshot = order.fileSummarySnapshot;
        if (files.length === 0) {
          fileCount = snapshot.count || 0;
          fileTotalBytes = snapshot.totalBytes || 0;
          fileSource = 'snapshot';
        }
      }

      const assignments = [...new Map(
        orderTasks
          .filter(t => t.assignee && mongoose.Types.ObjectId.isValid(t.assignee))
          .map(t => [String(t.assignee), {
            assigneeId: String(t.assignee),
            assigneeName: assigneeMap.get(String(t.assignee))?.name || null,
            role: assigneeMap.get(String(t.assignee))?.role || null,
          }])
      ).values()];
      const assignedTo = assignments.length
        ? assignments.map(a => a.assigneeName || a.assigneeId).join(', ')
        : 'Unassigned';

      const items = order.products && order.products.length
        ? order.products
        : [{
            product: null,
            size: '',
            quantity: 1,
            name: order.manualItemName || '',
            description: order.manualItemDescription || '',
            category: order.manualItemCategory || '',
            isManual: true,
          }];

      for (const item of items) {
        const productRef = item.product;
        const product = productRef && mongoose.Types.ObjectId.isValid(String(productRef))
          ? productMap.get(String(productRef))
          : null;

        const name = item.productNameSnapshot || item.name || product?.name || 'Unknown item';
        const description = item.productDescriptionSnapshot || item.description || product?.description || '';
        const category = item.productCategorySnapshot || item.category || product?.category || '';

        rows.push({
          customerName: toStr(order.customerName, 'N/A'),
          orderId,
          orderDate: order.createdAt,
          orderStatus: toStr(order.orderStatus, 'PLACED'),
          category: toStr(category, 'N/A'),
          itemName: toStr(name, 'Unknown item'),
          itemDescription: toStr(description),
          size: toStr(item.size),
          quantity: Number(item.quantity) || 1,
          fileCount,
          fileTotalBytes,
          fileSizeMB: fileTotalBytes / (1024 * 1024),
          fileSizeGB: fileTotalBytes / (1024 * 1024 * 1024),
          assignedTo,
          assignments,
          fileSource,
        });
      }
    }
    return rows;
  }
}

export default new MonthlyReportRepository();
