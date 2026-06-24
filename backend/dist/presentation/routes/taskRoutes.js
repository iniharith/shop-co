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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const TaskRepository_1 = require("../../infrastructure/repositories/TaskRepository");
const order_usecase_1 = require("../../application/usecases/orders/order.usecase");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const user_repository_1 = __importDefault(require("../../infrastructure/db/repositories/user.repository"));
const FileUpload_1 = require("../../domain/entities/FileUpload");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
    api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});
const taskStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: "kampungcetak/tasks",
        allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf", "docx", "zip"]
    },
});
const taskUpload = (0, multer_1.default)({ storage: taskStorage });
const router = (0, express_1.Router)();
// GET /api/tasks
router.get('/', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authReq = req;
    const role = authReq.role;
    const filters = {
        status: req.query.status,
        assignee: req.query.assignee,
        orderId: req.query.orderId,
    };
    // If not admin, only show tasks linked to their username or orders (for simplicity, we'll just match their username)
    if (!['admin', 'sysadmin', 'boss', 'designer', 'production'].includes(role)) {
        filters.customerUsername = ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.email); // or however user is identified
    }
    const tasks = yield TaskRepository_1.taskRepository.findAll(filters);
    res.json({ success: true, tasks });
})));
// POST /api/tasks
router.post('/', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield TaskRepository_1.taskRepository.create(req.body);
    res.json({ success: true, task });
})));
// Helper function to delete all files for a task
const deleteAllTaskFiles = (task) => __awaiter(void 0, void 0, void 0, function* () {
    if (task.files && task.files.length > 0) {
        try {
            const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../domain/entities/FileUpload')));
            for (const file of task.files) {
                // Delete from Cloudinary
                const parts = file.url.split('/');
                const filenameWithExtension = parts[parts.length - 1];
                const publicId = `kampungcetak/tasks/${filenameWithExtension.split('.')[0]}`;
                yield cloudinary_1.v2.uploader.destroy(publicId);
                // Delete from FileUpload collection
                yield FileUpload.findOneAndDelete({ path: file.url, taskId: task._id });
            }
            // Clear files array in task document
            task.files = [];
            yield task.save();
        }
        catch (e) {
            console.error('Failed to delete task files:', e);
        }
    }
});
// PUT /api/tasks/:id
router.put('/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const oldTask = yield TaskRepository_1.taskRepository.findById(req.params.id);
    const task = yield TaskRepository_1.taskRepository.update(req.params.id, req.body);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    if (req.body.assignee && ((_a = oldTask === null || oldTask === void 0 ? void 0 : oldTask.assignee) === null || _a === void 0 ? void 0 : _a.toString()) !== req.body.assignee) {
        const { NotificationRepository } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/repositories/notification.repository')));
        const notifRepo = new NotificationRepository();
        yield notifRepo.createNotification({
            userId: req.body.assignee,
            message: `You have been assigned a new task: ${task.title}`,
            type: 'system',
            read: false
        });
    }
    // Sync status to Order if it changed
    if (req.body.status && req.body.status !== (oldTask === null || oldTask === void 0 ? void 0 : oldTask.status)) {
        if (task.orderId) {
            try {
                const orderUsecase = new order_usecase_1.OrderUsecase();
                yield orderUsecase.updateOrderStatus(task.orderId, req.body.status);
            }
            catch (e) {
                console.error('Failed to sync status to order:', e);
            }
        }
    }
    res.json({ success: true, task });
})));
// DELETE /api/tasks/:id
router.delete('/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield TaskRepository_1.taskRepository.findById(req.params.id);
    if (task) {
        yield deleteAllTaskFiles(task);
        yield TaskRepository_1.taskRepository.delete(req.params.id);
    }
    res.json({ success: true, message: 'Task deleted' });
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
    res.json({ success: true, task });
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
    }
    catch (err) {
        console.error("Failed to sync file upload notes:", err);
    }
    // Add a comment to the task to notify stakeholders
    yield TaskRepository_1.taskRepository.addComment(id, userId, userName, `Note updated for attached file (${fileName}): ${notes || '(cleared)'}`, authReq.role || 'admin');
    res.json({ success: true, task });
})));
// POST /api/tasks/:id/files
router.post('/:id/files', auth_middileware_1.default, taskUpload.single('file'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
    }
    const fileUrl = req.file.path;
    const fileName = req.file.originalname || 'Attached File';
    const task = yield TaskRepository_1.taskRepository.addFile(req.params.id, fileUrl, fileName);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    // Also sync the file to the general FileUpload collection
    try {
        const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../domain/entities/FileUpload')));
        const authReq = req;
        const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id) || 'admin';
        yield FileUpload.create({
            userId: userId,
            taskId: task._id,
            orderId: task.orderId || undefined,
            category: 'TASK',
            filename: req.file.filename,
            originalName: fileName,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: fileUrl,
        });
    }
    catch (e) {
        console.error('Failed to sync task file to FileUpload:', e);
    }
    res.json({ success: true, task });
})));
// DELETE /api/tasks/:id/files/:fileId
router.delete('/:id/files/:fileId', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, fileId } = req.params;
    const task = yield TaskRepository_1.taskRepository.findById(id);
    if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
    }
    // Find the file in the task's array
    const fileIndex = task.files.findIndex((f) => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === fileId || f.url.includes(fileId); });
    if (fileIndex === -1) {
        res.status(404).json({ success: false, message: 'File not found in task' });
        return;
    }
    const fileUrl = task.files[fileIndex].url;
    // Delete from Cloudinary
    try {
        const parts = fileUrl.split('/');
        const filenameWithExtension = parts[parts.length - 1];
        const publicId = `kampungcetak/tasks/${filenameWithExtension.split('.')[0]}`;
        yield cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (e) {
        console.error('Failed to delete file from Cloudinary:', e);
    }
    // Delete from task document
    task.files.splice(fileIndex, 1);
    yield task.save();
    // Delete from FileUpload collection
    try {
        const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../domain/entities/FileUpload')));
        yield FileUpload.findOneAndDelete({ path: fileUrl, taskId: id });
    }
    catch (e) {
        console.error('Failed to delete task file from FileUpload:', e);
    }
    res.json({ success: true, message: 'File deleted from task', task });
})));
exports.default = router;
