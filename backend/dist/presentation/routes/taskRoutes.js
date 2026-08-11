"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const TaskRepository_1 = require("../../infrastructure/repositories/TaskRepository");
const order_usecase_1 = require("../../application/usecases/orders/order.usecase");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const s3_1 = require("../../infrastructure/config/s3");
const multer_s3_1 = __importDefault(require("multer-s3"));
const multer_1 = __importDefault(require("multer"));
const user_repository_1 = __importDefault(require("../../infrastructure/db/repositories/user.repository"));
const notification_repository_1 = require("../../infrastructure/db/repositories/notification.repository");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const redis_1 = require("../../infrastructure/redis/redis");
const redis_constant_1 = require("../../shared/constants/redis.constant");
const taskBroadcast_1 = require("../../shared/utils/taskBroadcast");
const FileUploadRepository_1 = require("../../infrastructure/repositories/FileUploadRepository");
const fileUploadRoutes_1 = require("./fileUploadRoutes");
const cursorPagination_1 = require("../../shared/utils/cursorPagination");
const redisService = new redis_1.RedisService();
const TASK_FILE_TAGS = new Set(['attachment', 'draft', 'for_print', 'awb']);
const normalizeTaskFileTag = (tag) => {
    const value = String(tag);
    return TASK_FILE_TAGS.has(value) ? value : 'attachment';
};
const taskStorage = (0, multer_s3_1.default)({
    s3: s3_1.s3Client,
    bucket: s3_1.S3_BUCKET_NAME,
    contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const taskId = req.params.id || req.body.taskId || 'unknown_task';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `kampungcetak/tasks/${taskId}/${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});
const taskUpload = (0, multer_1.default)({ storage: taskStorage });
const router = (0, express_1.Router)();
router.get('/', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authReq = req;
    const role = authReq.role;
    const filters = {
        status: req.query.status,
        assignee: req.query.assignee,
        orderId: req.query.orderId,
        search: req.query.search,
    };
    if (req.query.cursor !== undefined) {
        if (typeof req.query.cursor !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid cursor' });
            return;
        }
        try {
            filters.cursor = (0, cursorPagination_1.decodeCursor)(req.query.cursor);
        }
        catch (_c) {
            res.status(400).json({ success: false, message: 'Invalid cursor' });
            return;
        }
    }
    // 'statuses' (plural, comma-separated) was being silently dropped here —
    // the admin manager pages (Production/Packaging) rely on it to scope
    // their queries, and without it they were falling back to the default
    // 30-day window with no status filter at all.
    if (req.query.statuses) {
        filters.statuses = req.query.statuses.split(',').map(s => s.trim()).filter(Boolean);
        // Jobs can sit in production/packaging well past 30 days; widen the
        // window whenever a specific status set is requested so those aren't
        // silently excluded.
        filters.days = 180;
    }
    if (req.query.deleted === 'true') {
        filters.isDeleted = true;
    }
    // If not admin, only show tasks linked to their username or orders (for simplicity, we'll just match their username)
    if (!['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(role)) {
        filters.customerUsername = ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.email); // or however user is identified
    }
    if (req.query.limit) {
        const parsed = parseInt(req.query.limit, 10);
        if (!Number.isNaN(parsed))
            filters.limit = parsed;
    }
    const { tasks, pageInfo } = yield TaskRepository_1.taskRepository.findPage(filters);
    res.json({ success: true, tasks, pageInfo });
})));
// GET /api/tasks/:id
router.get('/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield TaskRepository_1.taskRepository.findDetailById(req.params.id);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    res.json({ success: true, task });
})));
// POST /api/tasks
router.post('/', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const task = yield TaskRepository_1.taskRepository.create(req.body);
    // Log the initial state as activity — otherwise a task created with an
    // assignee/status already filled in shows an empty feed, since those
    // values were never "changed" via a later update.
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id) || 'system';
    let userName = ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email);
    if (!userName && userId && userId !== 'system') {
        try {
            const user = yield user_repository_1.default.findById(userId);
            userName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email);
        }
        catch (error) { }
    }
    userName = userName || 'System';
    if (task.assignee) {
        try {
            const assignedUser = yield user_repository_1.default.findById(task.assignee);
            const assigneeName = assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User';
            yield TaskRepository_1.taskRepository.addActivity(task._id.toString(), userId, userName, `assigned to ${assigneeName}`);
        }
        catch (e) { }
    }
    if (task.status && task.status !== 'PLACED') {
        yield TaskRepository_1.taskRepository.addActivity(task._id.toString(), userId, userName, `set status to ${task.status.replace(/_/g, ' ')}`);
    }
    const freshTask = yield TaskRepository_1.taskRepository.findById(task._id.toString());
    res.json({ success: true, task: freshTask });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_created', { task: freshTask });
})));
// Helper function to delete all files for a task
const deleteAllTaskFiles = (task) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../domain/entities/FileUpload')));
        const taskId = task._id.toString();
        // Delete all FileUpload records referencing this task (share link uploads + direct uploads)
        yield FileUpload.deleteMany({ taskId });
        void (0, FileUploadRepository_1.notifyFileClients)();
        // Delete files from S3 and clear task.files array
        if (task.files && task.files.length > 0) {
            for (const file of task.files) {
                if (file.url) {
                    yield (0, s3_1.deleteFromS3)(file.url);
                }
            }
            task.files = [];
            yield task.save();
        }
    }
    catch (e) {
        console.error('Failed to delete task files:', e);
    }
});
// PUT /api/tasks/:id
router.put('/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const oldTask = yield TaskRepository_1.taskRepository.findById(req.params.id);
    const isDoneChanged = typeof req.body.isDone === 'boolean' && req.body.isDone !== Boolean(oldTask === null || oldTask === void 0 ? void 0 : oldTask.isDone);
    // If someone is being newly assigned to a task that's still "In Progress",
    // automatically advance it to "In Design" — being assigned implies design work
    // is starting. Only triggers when assignee actually changes, and only nudges
    // the status if the caller didn't already explicitly request a different one.
    const isNewAssignment = req.body.assignee && ((_a = oldTask === null || oldTask === void 0 ? void 0 : oldTask.assignee) === null || _a === void 0 ? void 0 : _a.toString()) !== req.body.assignee;
    const currentStatus = (oldTask === null || oldTask === void 0 ? void 0 : oldTask.status) || 'PLACED';
    const preDesignStatuses = ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED'];
    if (isNewAssignment && preDesignStatuses.includes(currentStatus) && (!req.body.status || req.body.status === currentStatus)) {
        req.body.status = 'IN_DESIGN';
    }
    const task = yield TaskRepository_1.taskRepository.update(req.params.id, req.body);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    if (req.body.assignee && ((_b = oldTask === null || oldTask === void 0 ? void 0 : oldTask.assignee) === null || _b === void 0 ? void 0 : _b.toString()) !== req.body.assignee) {
        const { NotificationRepository } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/repositories/notification.repository')));
        const notifRepo = new NotificationRepository();
        const newNotif = yield notifRepo.createNotification({
            userId: req.body.assignee,
            title: 'Tugasan Baru',
            message: `You have been assigned a new task: ${task.title}`,
            type: 'SYSTEM',
            read: false
        });
        yield redisService.publish(redis_constant_1.REDIS_CHANNELS.NOTIFICATION, JSON.stringify(newNotif));
    }
    // Log activities
    const authReq = req;
    const userId = authReq.userId || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c._id) || ((_d = authReq.user) === null || _d === void 0 ? void 0 : _d.id) || 'system';
    const userName = ((_e = authReq.user) === null || _e === void 0 ? void 0 : _e.name) || ((_f = authReq.user) === null || _f === void 0 ? void 0 : _f.email) || 'System';
    if (req.body.status && req.body.status !== (oldTask === null || oldTask === void 0 ? void 0 : oldTask.status)) {
        const oldStatus = ((oldTask === null || oldTask === void 0 ? void 0 : oldTask.status) || 'PLACED').replace(/_/g, ' ');
        const newStatus = req.body.status.replace(/_/g, ' ');
        yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName, `changed status from ${oldStatus} to ${newStatus}`);
    }
    if (req.body.assignee !== undefined && ((_g = oldTask === null || oldTask === void 0 ? void 0 : oldTask.assignee) === null || _g === void 0 ? void 0 : _g.toString()) !== ((_h = (req.body.assignee || undefined)) === null || _h === void 0 ? void 0 : _h.toString())) {
        if (req.body.assignee) {
            const assignedUser = yield user_repository_1.default.findById(req.body.assignee);
            const assigneeName = assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User';
            yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName, `assigned to ${assigneeName}`);
        }
        else {
            yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName, `unassigned this task`);
        }
    }
    if (req.body.description !== undefined && req.body.description !== (oldTask === null || oldTask === void 0 ? void 0 : oldTask.description)) {
        const trunc = (s, max) => { const t = s || ''; return t.length > max ? t.substring(0, max) + '...' : (t || '(empty)'); };
        yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName, `changed description`, `from "${trunc(oldTask === null || oldTask === void 0 ? void 0 : oldTask.description, 80)}" to "${trunc(req.body.description, 80)}"`);
    }
    if (req.body.title !== undefined && req.body.title !== (oldTask === null || oldTask === void 0 ? void 0 : oldTask.title)) {
        yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName, `changed title`, `from "${(oldTask === null || oldTask === void 0 ? void 0 : oldTask.title) || '(empty)'}" to "${req.body.title}"`);
    }
    if (isDoneChanged) {
        yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName, req.body.isDone ? 'marked task as done' : 'marked task as not done');
    }
    // Sync status to the linked order only when status itself changed. Linking
    // an order must not silently change its status or notify its customer.
    if (req.body.status && req.body.status !== (oldTask === null || oldTask === void 0 ? void 0 : oldTask.status)) {
        if (task.orderId) {
            try {
                const orderUsecase = new order_usecase_1.OrderUsecase();
                yield orderUsecase.updateOrderStatus(task.orderId, task.status === 'RETURN' ? 'RETURNED' : task.status, false, req.params.id);
            }
            catch (e) {
                console.error('Failed to sync status to order:', e);
            }
        }
    }
    // Clear the folder-group cache so Production/Packaging pages see the updated status
    if (req.body.status && req.body.status !== (oldTask === null || oldTask === void 0 ? void 0 : oldTask.status)) {
        yield (0, fileUploadRoutes_1.clearFolderGroupCache)().catch(() => { });
    }
    // Refetch to include newly added activities in the response and broadcast
    const freshTask = yield TaskRepository_1.taskRepository.findById(req.params.id);
    res.json({ success: true, task: freshTask });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: freshTask });
})));
// DELETE /api/tasks/:id
router.delete('/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield TaskRepository_1.taskRepository.findById(req.params.id);
    if (task) {
        if (req.query.permanent === 'true') {
            yield deleteAllTaskFiles(task);
            yield TaskRepository_1.taskRepository.permanentDelete(req.params.id);
        }
        else {
            yield TaskRepository_1.taskRepository.delete(req.params.id);
        }
        yield (0, fileUploadRoutes_1.clearFolderGroupCache)().catch(() => { });
    }
    res.json({ success: true, message: req.query.permanent === 'true' ? 'Task permanently deleted' : 'Task deleted' });
    (0, taskBroadcast_1.emitTaskUpdated)('task_deleted', { taskId: req.params.id });
})));
// POST /api/tasks/:id/restore
router.post('/:id/restore', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const task = yield TaskRepository_1.taskRepository.restore(req.params.id);
    if (!task) {
        res.status(404).json({ success: false, message: 'Deleted task not found' });
        return;
    }
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.id) || 'system';
    const userName = ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.name) || ((_d = authReq.user) === null || _d === void 0 ? void 0 : _d.email) || 'System';
    yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName, 'restored this task');
    yield (0, fileUploadRoutes_1.clearFolderGroupCache)().catch(() => { });
    const freshTask = yield TaskRepository_1.taskRepository.findById(req.params.id);
    res.json({ success: true, message: 'Task restored', task: freshTask });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: freshTask });
})));
// POST /api/tasks/:id/comments
router.post('/:id/comments', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    let userName = ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email);
    if (!userName && userId) {
        try {
            const user = yield user_repository_1.default.findById(userId);
            userName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email);
        }
        catch (error) {
            console.error("Error fetching user for comment:", error);
        }
    }
    userName = userName || 'User';
    const role = authReq.role;
    const { text } = req.body;
    if (!text) {
        res.status(400).json({ success: false, message: 'Comment text is required' });
        return;
    }
    const task = yield TaskRepository_1.taskRepository.addComment(req.params.id, userId, userName, text, role);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    // Send notification to assignee if they are not the one commenting
    if (task.assignee && task.assignee.toString() !== userId.toString()) {
        try {
            const notifRepo = new notification_repository_1.NotificationRepository();
            yield notifRepo.createNotification({
                userId: task.assignee.toString(),
                title: 'New Task Comment',
                message: `${userName} commented on task: ${task.title}`,
                type: 'SYSTEM',
                taskId: task._id.toString(),
                link: `/admin/tasks?taskId=${task._id.toString()}`,
                read: false
            });
        }
        catch (err) {
            console.error("Failed to send comment notification:", err);
        }
    }
    res.json({ success: true, task });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task });
})));
// DELETE /api/tasks/:id/comments/:commentId
router.delete('/:id/comments/:commentId', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield TaskRepository_1.taskRepository.deleteComment(req.params.id, req.params.commentId);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    res.json({ success: true, task });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task });
})));
// PUT /api/tasks/:id/comments/:commentId/pin
router.put('/:id/comments/:commentId/pin', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pinned } = req.body;
    const task = yield TaskRepository_1.taskRepository.pinComment(req.params.id, req.params.commentId, pinned);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task or comment not found' });
        return;
    }
    res.json({ success: true, task });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task });
})));
// PUT /api/tasks/:id/files/notes
router.put('/:id/files/notes', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id } = req.params;
    const { fileUrl, notes } = req.body;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    let userName = ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email);
    if (!userName && userId) {
        try {
            const user = yield user_repository_1.default.findById(userId);
            userName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email);
        }
        catch (error) { }
    }
    userName = userName || 'Admin';
    if (!fileUrl) {
        res.status(400).json({ success: false, message: 'fileUrl is required' });
        return;
    }
    // Update the note in the Task
    const task = yield TaskRepository_1.taskRepository.updateFileNotes(id, fileUrl, notes || '');
    if (!task) {
        res.status(404).json({ success: false, message: 'Task or file not found' });
        return;
    }
    // Extract filename for comment
    const fileName = fileUrl.split('/').pop() || 'file';
    // Sync the note to the FileUpload collection
    try {
        yield FileUpload_1.FileUpload.findOneAndUpdate({ path: fileUrl, taskId: id }, { $set: { adminNotes: notes || '' } });
        void (0, FileUploadRepository_1.notifyFileClients)();
    }
    catch (err) {
        console.error("Failed to sync file upload notes:", err);
    }
    // Add an activity to the task to notify stakeholders
    yield TaskRepository_1.taskRepository.addActivity(id, userId, userName, `updated note for attached file (${fileName}): ${notes || '(cleared)'}`);
    const freshTask = yield TaskRepository_1.taskRepository.findById(id);
    res.json({ success: true, task: freshTask });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: freshTask });
})));
// POST /api/tasks/:id/files
router.post('/:id/files', auth_middileware_1.default, taskUpload.single('file'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
    }
    const fileUrl = req.file.location;
    const fileName = req.file.originalname || 'Attached File';
    const tag = normalizeTaskFileTag(req.body.tag);
    const folderId = req.body.folderId || undefined;
    const task = yield TaskRepository_1.taskRepository.addFile(req.params.id, fileUrl, fileName, tag);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    {
        const authReq = req;
        const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id) || 'admin';
        let userName = ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email);
        if (!userName && userId) {
            try {
                const user = yield user_repository_1.default.findById(userId);
                userName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email);
            }
            catch (error) { }
        }
        yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName || 'Admin', `uploaded file "${fileName}"`);
    }
    // Also sync the file to the general FileUpload collection
    try {
        const authReq = req;
        const userId = authReq.userId || ((_d = authReq.user) === null || _d === void 0 ? void 0 : _d.id) || 'admin';
        yield FileUploadRepository_1.fileUploadRepository.create({
            userId: userId,
            taskId: task._id.toString(),
            orderId: task.orderId || undefined,
            category: 'TASK',
            tag: tag,
            folderId: folderId,
            filename: req.file.key || req.file.filename || req.file.originalname,
            originalName: fileName,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: fileUrl,
        });
    }
    catch (e) {
        console.error('Failed to sync task file to FileUpload:', e);
    }
    const freshTask = yield TaskRepository_1.taskRepository.findById(req.params.id);
    res.json({ success: true, task: freshTask });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: freshTask });
})));
// POST /api/tasks/:id/files/save-metadata
router.post('/:id/files/save-metadata', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { fileUrl, fileName, fileKey, mimetype, size } = req.body;
    const tag = normalizeTaskFileTag(req.body.tag);
    const folderId = req.body.folderId || undefined;
    if (!fileUrl || !fileName) {
        res.status(400).json({ success: false, message: 'fileUrl and fileName are required' });
        return;
    }
    const task = yield TaskRepository_1.taskRepository.addFile(req.params.id, fileUrl, fileName, tag);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    {
        const authReq = req;
        const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id) || 'admin';
        let userName = ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email);
        if (!userName && userId) {
            try {
                const user = yield user_repository_1.default.findById(userId);
                userName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email);
            }
            catch (error) { }
        }
        yield TaskRepository_1.taskRepository.addActivity(req.params.id, userId, userName || 'Admin', `uploaded file "${fileName}"`);
    }
    try {
        const authReq = req;
        const userId = authReq.userId || ((_d = authReq.user) === null || _d === void 0 ? void 0 : _d.id) || 'admin';
        yield FileUploadRepository_1.fileUploadRepository.create({
            userId: userId,
            taskId: task._id.toString(),
            orderId: task.orderId || undefined,
            category: 'TASK',
            tag,
            folderId,
            filename: fileKey || fileName,
            originalName: fileName,
            mimetype: mimetype || 'application/octet-stream',
            size: size || 0,
            path: fileUrl,
        });
    }
    catch (e) {
        console.error('Failed to sync task file to FileUpload:', e);
    }
    const freshTask = yield TaskRepository_1.taskRepository.findById(req.params.id);
    res.json({ success: true, task: freshTask });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: freshTask });
})));
// DELETE /api/tasks/:id/files/:fileId
router.delete('/:id/files/:fileId', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id, fileId } = req.params;
    const task = yield TaskRepository_1.taskRepository.findById(id);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    const authReq = req;
    const actorId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id) || 'admin';
    let actorName = ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email);
    if (!actorName && actorId) {
        try {
            const user = yield user_repository_1.default.findById(actorId);
            actorName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email);
        }
        catch (error) { }
    }
    actorName = actorName || 'Admin';
    // Find the file in the task's array
    const fileIndex = task.files.findIndex((f) => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === fileId || f.url.includes(fileId); });
    if (fileIndex === -1) {
        // It might be a FileUpload document (customer file attached virtually)
        try {
            const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../domain/entities/FileUpload')));
            const fileDoc = yield FileUpload.findById(fileId);
            if (fileDoc) {
                if (fileDoc.path)
                    yield (0, s3_1.deleteFromS3)(fileDoc.path).catch(console.error);
                yield FileUpload.findByIdAndDelete(fileId);
                // Remove the matching entry from the task's files array too, so the
                // file does not resurrect on the next refetch / socket update.
                if (fileDoc.path) {
                    const tfIndex = task.files.findIndex((f) => f.url === fileDoc.path);
                    if (tfIndex !== -1) {
                        task.files.splice(tfIndex, 1);
                        yield task.save();
                    }
                }
                void (0, FileUploadRepository_1.notifyFileClients)();
                yield TaskRepository_1.taskRepository.addActivity(id, actorId, actorName, `deleted file "${fileDoc.originalName || fileDoc.filename || 'attachment'}"`);
                const freshTask = yield TaskRepository_1.taskRepository.findById(id);
                res.json({ success: true, message: 'File deleted from task', task: freshTask });
                void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: freshTask });
                return;
            }
        }
        catch (e) { }
        res.status(404).json({ success: false, message: 'File not found in task' });
        return;
    }
    const fileUrl = task.files[fileIndex].url;
    const fileName = task.files[fileIndex].name || fileUrl.split('/').pop() || 'attachment';
    // Delete from S3
    try {
        if (fileUrl) {
            yield (0, s3_1.deleteFromS3)(fileUrl);
        }
    }
    catch (e) {
        console.error('Failed to delete file from S3:', e);
    }
    // Delete from task document
    task.files.splice(fileIndex, 1);
    yield task.save();
    // Delete from FileUpload collection
    try {
        const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../domain/entities/FileUpload')));
        yield FileUpload.findOneAndDelete({ path: fileUrl });
        void (0, FileUploadRepository_1.notifyFileClients)();
    }
    catch (e) {
        console.error('Failed to delete task file from FileUpload:', e);
    }
    yield TaskRepository_1.taskRepository.addActivity(id, actorId, actorName, `deleted file "${fileName}"`);
    const freshTask = yield TaskRepository_1.taskRepository.findById(id);
    res.json({ success: true, message: 'File deleted from task', task: freshTask });
    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: freshTask });
})));
exports.default = router;
