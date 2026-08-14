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
 * Monthly orders report repository. Assembles every production task into a
 * report row — including manually created tasks that have no linked order —
 * and enriches with file totals and staff assignments for a given month.
 */
const mongoose_1 = __importDefault(require("mongoose"));
const order_model_1 = __importDefault(require("../db/models/order.model"));
const product_model_1 = __importDefault(require("../db/models/product.model"));
const user_model_1 = __importDefault(require("../db/models/user.model"));
const FileUpload_1 = require("../../domain/entities/FileUpload");
const Task_1 = require("../../domain/entities/Task");
const PAGE_SIZE = 100;
const toStr = (value, fallback = '') => {
    if (value === null || value === undefined)
        return fallback;
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    try {
        return JSON.stringify(value);
    }
    catch (_a) {
        return fallback;
    }
};
/**
 * Manual tasks usually encode the customer inside the title, e.g.
 * "F | 14 AUG 26 | KC Seriazhari (MANUAL POSTAGE)" → "Seriazhari".
 * Used as a last-resort fallback for the customer column.
 */
const kcNameFromTitle = (title) => {
    const match = toStr(title).match(/KC\s+([A-Za-z0-9_.-]+)/i);
    return match ? match[1] : '';
};
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
    getTaskPage(window_1, cursor_1) {
        return __awaiter(this, arguments, void 0, function* (window, cursor, limit = PAGE_SIZE) {
            const safeLimit = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), 500);
            const filter = {
                createdAt: { $gte: window.start, $lt: window.endExclusive },
                isDeleted: { $ne: true },
            };
            const decoded = this.buildCursor(cursor);
            if (decoded) {
                filter.$or = [
                    { createdAt: { $lt: decoded.createdAt } },
                    { createdAt: decoded.createdAt, _id: { $lt: new mongoose_1.default.Types.ObjectId(decoded.id) } },
                ];
            }
            const tasks = yield Task_1.Task.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .limit(safeLimit + 1)
                .lean()
                .exec();
            const hasNextPage = tasks.length > safeLimit;
            const pageTasks = hasNextPage ? tasks.slice(0, safeLimit) : tasks;
            let nextCursor = null;
            if (hasNextPage && pageTasks.length > 0) {
                const last = pageTasks[pageTasks.length - 1];
                nextCursor = Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: String(last._id) })).toString('base64url');
            }
            return { tasks: pageTasks, hasNextPage, nextCursor };
        });
    }
    assemble(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!tasks.length)
                return [];
            const taskIds = tasks.map(t => String(t._id));
            const validOrderIds = tasks
                .map(t => t.orderId)
                .filter((id) => typeof id === 'string' && mongoose_1.default.Types.ObjectId.isValid(id));
            const validProductIds = tasks
                .map(t => t.productId)
                .filter((id) => typeof id === 'string' && mongoose_1.default.Types.ObjectId.isValid(id));
            const assigneeIds = [...new Set(tasks
                    .map(t => t.assignee)
                    .filter((a) => typeof a === 'string' && mongoose_1.default.Types.ObjectId.isValid(a)))];
            const [orderDocs, productDocs, taskFiles, assigneeDocs] = yield Promise.all([
                validOrderIds.length ? order_model_1.default.find({ _id: { $in: validOrderIds } }).lean().exec() : Promise.resolve([]),
                validProductIds.length ? product_model_1.default.find({ _id: { $in: validProductIds } }).select('name description category').lean().exec() : Promise.resolve([]),
                FileUpload_1.FileUpload.find({ taskId: { $in: taskIds } }).lean().exec(),
                assigneeIds.length ? user_model_1.default.find({ _id: { $in: assigneeIds } }).select('name role').lean().exec() : Promise.resolve([]),
            ]);
            const orderMap = new Map(orderDocs.map(o => [String(o._id), o]));
            const productMap = new Map(productDocs.map(p => [String(p._id), p]));
            const assigneeMap = new Map(assigneeDocs.map(u => [String(u._id), u]));
            const filesByTaskId = new Map();
            for (const file of taskFiles) {
                if (!file.taskId)
                    continue;
                const list = filesByTaskId.get(String(file.taskId)) || [];
                list.push(file);
                filesByTaskId.set(String(file.taskId), list);
            }
            const rows = [];
            for (const task of tasks) {
                const taskId = String(task._id);
                const linkedOrder = task.orderId ? orderMap.get(String(task.orderId)) : null;
                const product = task.productId ? productMap.get(String(task.productId)) : null;
                const orderItem = ((_a = linkedOrder === null || linkedOrder === void 0 ? void 0 : linkedOrder.products) === null || _a === void 0 ? void 0 : _a[0]) || null;
                const manualItem = (linkedOrder === null || linkedOrder === void 0 ? void 0 : linkedOrder.manualItemName)
                    ? { name: linkedOrder.manualItemName, description: linkedOrder.manualItemDescription || '', category: linkedOrder.manualItemCategory || '' }
                    : null;
                const itemName = (orderItem === null || orderItem === void 0 ? void 0 : orderItem.productNameSnapshot)
                    || (manualItem === null || manualItem === void 0 ? void 0 : manualItem.name)
                    || (product === null || product === void 0 ? void 0 : product.name)
                    || task.title
                    || 'Unknown item';
                const description = (orderItem === null || orderItem === void 0 ? void 0 : orderItem.productDescriptionSnapshot)
                    || (manualItem === null || manualItem === void 0 ? void 0 : manualItem.description)
                    || (product === null || product === void 0 ? void 0 : product.description)
                    || task.description
                    || '';
                const category = (orderItem === null || orderItem === void 0 ? void 0 : orderItem.productCategorySnapshot)
                    || (manualItem === null || manualItem === void 0 ? void 0 : manualItem.category)
                    || (product === null || product === void 0 ? void 0 : product.category)
                    || task.category
                    || 'N/A';
                const fileDocs = filesByTaskId.get(taskId) || [];
                const embeddedFiles = Array.isArray(task.files) ? task.files : [];
                const fileCount = Math.max(embeddedFiles.length, fileDocs.length) || 0;
                const fileTotalBytes = fileDocs.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
                const assignee = task.assignee && assigneeMap.get(String(task.assignee));
                const assignedTo = (assignee === null || assignee === void 0 ? void 0 : assignee.name) || (task.assignee ? String(task.assignee) : 'Unassigned');
                // Some imported tasks store the platform order number (digits only) in
                // customerUsername; prefer the KC handle from the title for those.
                const rawUsername = toStr(task.customerUsername);
                const usableUsername = /^\d+$/.test(rawUsername) ? '' : rawUsername;
                rows.push({
                    customerName: toStr((linkedOrder === null || linkedOrder === void 0 ? void 0 : linkedOrder.customerName) || usableUsername || kcNameFromTitle(task.title), 'N/A'),
                    orderId: toStr(task.orderId) || `TASK-${taskId}`,
                    orderDate: task.createdAt,
                    orderStatus: toStr(task.status, 'PLACED'),
                    category: toStr(category, 'N/A'),
                    itemName: toStr(itemName, 'Unknown item'),
                    itemDescription: toStr(description),
                    size: toStr((orderItem === null || orderItem === void 0 ? void 0 : orderItem.size) || ''),
                    quantity: Number(orderItem === null || orderItem === void 0 ? void 0 : orderItem.quantity) || 1,
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
        });
    }
}
exports.MonthlyReportRepository = MonthlyReportRepository;
exports.default = new MonthlyReportRepository();
