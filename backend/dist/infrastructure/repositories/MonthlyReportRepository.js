"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyReportRepository = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Monthly orders report repository. Assembles orders with their item
 * snapshots, file totals and staff assignments for a given month window.
 */
const mongoose_1 = __importDefault(require("mongoose"));
const order_model_1 = __importDefault(require("../db/models/order.model"));
const product_model_1 = __importDefault(require("../db/models/product.model"));
const user_model_1 = __importDefault(require("../db/models/user.model"));
const FileUpload_1 = require("../../domain/entities/FileUpload");
const ShareLink_1 = require("../../domain/entities/ShareLink");
const Task_1 = require("../../domain/entities/Task");
const PAGE_SIZE = 100;
class MonthlyReportRepository {
    buildCursor(value) {
        if (!value)
            return null;
        try {
            const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
            const createdAt = new Date(parsed.createdAt);
            if (Number.isNaN(createdAt.getTime()))
                return null;
            if (!mongoose_1.default.Types.ObjectId.isValid(parsed.id))
                return null;
            return { createdAt, id: parsed.id };
        }
        catch (_a) {
            return null;
        }
    }
    getOrderPage(window_1, cursor_1) {
        return __awaiter(this, arguments, void 0, function* (window, cursor, limit = PAGE_SIZE) {
            const safeLimit = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), 500);
            const filter = {
                createdAt: { $gte: window.start, $lt: window.endExclusive },
            };
            const decoded = this.buildCursor(cursor);
            if (decoded) {
                filter.$or = [
                    { createdAt: { $lt: decoded.createdAt } },
                    { createdAt: decoded.createdAt, _id: { $lt: new mongoose_1.default.Types.ObjectId(decoded.id) } },
                ];
            }
            const orders = yield order_model_1.default.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .limit(safeLimit + 1)
                .lean()
                .exec();
            const hasNextPage = orders.length > safeLimit;
            const pageOrders = hasNextPage ? orders.slice(0, safeLimit) : orders;
            let nextCursor = null;
            if (hasNextPage && pageOrders.length > 0) {
                const last = pageOrders[pageOrders.length - 1];
                nextCursor = Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: String(last._id) })).toString('base64url');
            }
            return { orders: pageOrders, hasNextPage, nextCursor };
        });
    }
    assemble(orders) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!orders.length)
                return [];
            const orderIds = orders.map(o => String(o._id));
            const validOrderIds = orderIds.filter(id => mongoose_1.default.Types.ObjectId.isValid(id));
            const productIds = orders
                .flatMap(o => (o.products || []).map((p) => { var _a, _b; return ((_b = (_a = p.product) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || p.product; }))
                .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
            const [productDocs, tasks, shareLinks, orderScopedFiles] = yield Promise.all([
                product_model_1.default.find({ _id: { $in: productIds } }).select('name description category').lean().exec(),
                Task_1.Task.find({ orderId: { $in: validOrderIds } }).lean().exec(),
                ShareLink_1.ShareLink.find({ orderId: { $in: validOrderIds } }).lean().exec(),
                FileUpload_1.FileUpload.find({ orderId: { $in: validOrderIds } }).lean().exec(),
            ]);
            const taskIds = tasks.map(t => String(t._id));
            const taskFiles = taskIds.length
                ? yield FileUpload_1.FileUpload.find({ taskId: { $in: taskIds } }).lean().exec()
                : [];
            const shareSlugs = [...new Set(shareLinks.map(link => link.slug).filter(Boolean))];
            const shareFiles = shareSlugs.length
                ? yield FileUpload_1.FileUpload.find({ shareSlug: { $in: shareSlugs } }).lean().exec()
                : [];
            const productMap = new Map(productDocs.map(p => [String(p._id), p]));
            const tasksByOrder = new Map();
            for (const task of tasks) {
                if (!task.orderId)
                    continue;
                const list = tasksByOrder.get(String(task.orderId)) || [];
                list.push(task);
                tasksByOrder.set(String(task.orderId), list);
            }
            const assigneeIds = [...new Set(tasks
                    .map(t => t.assignee)
                    .filter((a) => typeof a === 'string' && mongoose_1.default.Types.ObjectId.isValid(a)))];
            const assigneeDocs = assigneeIds.length
                ? yield user_model_1.default.find({ _id: { $in: assigneeIds } }).select('name role').lean().exec()
                : [];
            const assigneeMap = new Map(assigneeDocs.map(u => [String(u._id), u]));
            const filesByOrderId = new Map();
            const filesByTaskId = new Map();
            const addFile = (map, key, file) => {
                if (!key)
                    return;
                const list = map.get(key) || [];
                list.push(file);
                map.set(key, list);
            };
            for (const file of orderScopedFiles) {
                if (file.orderId)
                    addFile(filesByOrderId, String(file.orderId), file);
                if (file.taskId)
                    addFile(filesByTaskId, String(file.taskId), file);
            }
            for (const file of taskFiles) {
                if (file.orderId)
                    addFile(filesByOrderId, String(file.orderId), file);
                if (file.taskId)
                    addFile(filesByTaskId, String(file.taskId), file);
            }
            for (const file of shareFiles) {
                if (file.orderId)
                    addFile(filesByOrderId, String(file.orderId), file);
                if (file.taskId)
                    addFile(filesByTaskId, String(file.taskId), file);
            }
            const rows = [];
            for (const order of orders) {
                const orderId = String(order._id);
                const orderTasks = tasksByOrder.get(orderId) || [];
                const collectFiles = () => {
                    const seen = new Set();
                    const files = [];
                    const push = (file) => {
                        const id = String(file._id);
                        if (seen.has(id))
                            return;
                        seen.add(id);
                        files.push(file);
                    };
                    for (const file of filesByOrderId.get(orderId) || [])
                        push(file);
                    for (const task of orderTasks) {
                        for (const file of filesByTaskId.get(String(task._id)) || [])
                            push(file);
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
                const assignments = [...new Map(orderTasks
                        .filter(t => t.assignee && mongoose_1.default.Types.ObjectId.isValid(t.assignee))
                        .map(t => {
                        var _a, _b;
                        return [String(t.assignee), {
                                assigneeId: String(t.assignee),
                                assigneeName: ((_a = assigneeMap.get(String(t.assignee))) === null || _a === void 0 ? void 0 : _a.name) || null,
                                role: ((_b = assigneeMap.get(String(t.assignee))) === null || _b === void 0 ? void 0 : _b.role) || null,
                            }];
                    })).values()];
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
                    const product = productRef && mongoose_1.default.Types.ObjectId.isValid(String(productRef))
                        ? productMap.get(String(productRef))
                        : null;
                    const name = item.productNameSnapshot || item.name || (product === null || product === void 0 ? void 0 : product.name) || 'Unknown item';
                    const description = item.productDescriptionSnapshot || item.description || (product === null || product === void 0 ? void 0 : product.description) || '';
                    const category = item.productCategorySnapshot || item.category || (product === null || product === void 0 ? void 0 : product.category) || '';
                    rows.push({
                        customerName: order.customerName || 'N/A',
                        orderId,
                        orderDate: order.createdAt,
                        orderStatus: order.orderStatus || 'PLACED',
                        category: category || 'N/A',
                        itemName: name,
                        itemDescription: description,
                        size: item.size || '',
                        quantity: item.quantity || 1,
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
        });
    }
}
exports.MonthlyReportRepository = MonthlyReportRepository;
exports.default = new MonthlyReportRepository();
