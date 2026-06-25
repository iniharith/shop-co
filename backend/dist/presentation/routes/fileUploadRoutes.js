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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const multer_1 = __importDefault(require("multer"));
const s3_1 = require("../../infrastructure/config/s3");
const multer_s3_1 = __importDefault(require("multer-s3"));
const FileUploadRepository_1 = require("../../infrastructure/repositories/FileUploadRepository");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const WhatsAppService_1 = require("../../infrastructure/services/WhatsAppService");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const TaskRepository_1 = require("../../infrastructure/repositories/TaskRepository");
const user_repository_1 = __importDefault(require("../../infrastructure/db/repositories/user.repository"));
const router = (0, express_1.Router)();
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'application/pdf',
];
// ─── Multer + S3 Storage ─────────────────────────
const storage = (0, multer_s3_1.default)({
    s3: s3_1.s3Client,
    bucket: s3_1.S3_BUCKET_NAME,
    acl: 'public-read',
    contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        var _a;
        const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `kampungcetak/uploads/${userId}/${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Jenis fail "${file.mimetype}" tidak dibenarkan. Hanya JPG, PNG, PDF, TIFF, WEBP dibenarkan.`));
        }
    },
});
// ─── POST /api/files/upload ───────────────────────────────
// Customer uploads one or more files (requires auth middleware upstream)
// Files are uploaded directly to AWS S3 — not stored locally.
router.post('/upload', auth_middileware_1.default, upload.array('files', 10), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const files = req.files;
    const { orderId, taskId, notes, userId: bodyUserId, category } = req.body;
    const authReq = req;
    // If admin provides a userId in the body, upload on their behalf
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production'].includes(authReq.role);
    const userId = (isAdmin && bodyUserId) ? bodyUserId : authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    if (!userId && !taskId) {
        res.status(401).json({ success: false, message: 'Log masuk atau Task diperlukan' });
        return;
    }
    if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    // Cloudinary multer-storage-cloudinary puts the secure URL in file.path
    const savedFiles = yield Promise.all(files.map((file) => FileUploadRepository_1.fileUploadRepository.create({
        userId: userId || 'admin',
        orderId: orderId || undefined,
        taskId: taskId || undefined,
        category: category || undefined,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        // file.location is provided by multer-s3
        path: file.location || file.path,
        notes: notes || undefined,
        adminReviewed: false,
    })));
    // Optionally notify customer via WhatsApp
    const customerPhone = (_b = authReq.user) === null || _b === void 0 ? void 0 : _b.phone;
    const customerName = ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.name) || 'Pelanggan';
    if (customerPhone) {
        WhatsAppService_1.whatsAppService
            .sendFileUploadConfirmation({
            phone: customerPhone,
            customerName,
            orderId: orderId || undefined,
            fileCount: savedFiles.length,
        })
            .catch((e) => console.error('[FileUpload] WhatsApp confirmation failed:', e.message));
    }
    res.status(201).json({
        success: true,
        message: `${savedFiles.length} fail berjaya dimuat naik`,
        data: savedFiles,
        count: savedFiles.length,
    });
})));
// ─── GET /api/files/my ────────────────────────────────────
// Customer views their own uploaded files
router.get('/my', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
        return;
    }
    const files = yield FileUploadRepository_1.fileUploadRepository.findByUserId(userId);
    res.json({ success: true, data: files, count: files.length });
})));
// ─── GET /api/files ───────────────────────────────────────
// Admin: list all uploaded files with optional filter
router.get('/', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewed, search } = req.query;
    const filters = {};
    if (reviewed !== undefined)
        filters.adminReviewed = reviewed === 'true';
    if (search)
        filters.search = search;
    const files = yield FileUploadRepository_1.fileUploadRepository.findAll(filters);
    const stats = yield FileUploadRepository_1.fileUploadRepository.getStorageStats();
    res.json({ success: true, data: files, stats, count: files.length });
})));
// ─── GET /api/files/grouped ───────────────────────────────
// Admin: files grouped by customer (Nextcloud folder view)
router.get('/grouped', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const grouped = yield FileUploadRepository_1.fileUploadRepository.getFilesGroupedByUser();
    const stats = yield FileUploadRepository_1.fileUploadRepository.getStorageStats();
    res.json({ success: true, data: grouped, stats });
})));
// 🌐 Public: Get files for a specific folder using robust token
router.get('/folder/:token', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decoded = JSON.parse(Buffer.from(req.params.token, 'base64').toString('utf-8'));
        let query = {};
        if (decoded.t) {
            query = { taskId: decoded.t };
        }
        else if (decoded.o) {
            query = { orderId: decoded.o };
        }
        else if (decoded.u) {
            query = { userId: decoded.u };
        }
        else {
            res.json({ success: true, data: [] });
            return;
        }
        const files = yield FileUpload_1.FileUpload.find(query).sort({ uploadedAt: -1 });
        res.json({ success: true, data: files, folderName: decoded.n });
    }
    catch (e) {
        res.json({ success: true, data: [] });
    }
})));
// 🔹🔹🔹 GET /api/files/stats 🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
router.get('/stats', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield FileUploadRepository_1.fileUploadRepository.getStorageStats();
    res.json({ success: true, data: stats });
})));
// ─── GET /api/files/:id ───────────────────────────────────
router.get('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    res.json({ success: true, data: file });
})));
// ─── GET /api/files/:id/download ─────────────────────────
// Redirects to S3 URL for download
router.get('/:id/download', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    // file.path is the S3 URL — redirect directly
    res.redirect(file.path);
})));
// ─── GET /api/files/:id/preview ──────────────────────────
// Redirects to S3 URL for inline preview
router.get('/:id/preview', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    res.redirect(file.path);
})));
// 📝 PUT /api/files/:id/review 
// Admin marks a file as reviewed (optionally with notes)
router.put('/:id/review', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { reviewed, notes } = req.body;
    const file = yield FileUploadRepository_1.fileUploadRepository.updateAdminReview(req.params.id, reviewed !== false, notes);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    // Sync with task if this file is attached to a task
    if (file.taskId) {
        try {
            const authReq = req;
            const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
            let userName = ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email);
            if (!userName && userId) {
                try {
                    const user = yield user_repository_1.default.findById(userId);
                    userName = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email);
                }
                catch (e) { }
            }
            userName = userName || 'Admin';
            // Update task file notes
            yield TaskRepository_1.taskRepository.updateFileNotes(file.taskId, file.path, notes || '');
            // Add comment to task
            yield TaskRepository_1.taskRepository.addComment(file.taskId, userId, userName, `Note updated for artwork (${file.originalName}): ${notes || '(cleared)'}`, authReq.role || 'admin');
        }
        catch (syncErr) {
            console.error("Failed to sync file note to task:", syncErr);
        }
    }
    res.json({ success: true, data: file });
})));
// 🟨🟨🟨 POST /api/files/bulk-delete 🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨
// Admin or owner bulk deletes files
router.post('/bulk-delete', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production'].includes(authReq.role);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
        return;
    }
    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds)) {
        res.status(400).json({ success: false, message: 'Senarai ID fail diperlukan' });
        return;
    }
    let deletedCount = 0;
    const errors = [];
    for (const id of fileIds) {
        try {
            const file = yield FileUploadRepository_1.fileUploadRepository.findById(id);
            if (!file)
                continue;
            if (!isAdmin && ((_b = file.userId) === null || _b === void 0 ? void 0 : _b.toString()) !== userId.toString()) {
                continue; // skip if unauthorized
            }
            yield FileUploadRepository_1.fileUploadRepository.delete(id);
            if (file.path) {
                yield (0, s3_1.deleteFromS3)(file.path);
            }
            deletedCount++;
        }
        catch (err) {
            errors.push({ id, error: err.message });
        }
    }
    res.json({ success: true, deletedCount, errors });
})));
// 🟨🟨🟨 DELETE /api/files/:id 🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨
// Admin or file owner deletes file from DB and Cloudinary
router.delete('/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production'].includes(authReq.role);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
        return;
    }
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    // Only allow deletion if admin OR if the user owns the file
    if (!isAdmin && ((_b = file.userId) === null || _b === void 0 ? void 0 : _b.toString()) !== userId.toString()) {
        res.status(403).json({ success: false, message: 'Tiada kebenaran untuk memadam fail ini' });
        return;
    }
    // Delete from S3 using the helper
    try {
        if (file.path) {
            yield (0, s3_1.deleteFromS3)(file.path);
        }
    }
    catch (err) {
        console.warn('[FileUpload] Could not delete from S3:', err.message);
    }
    yield FileUploadRepository_1.fileUploadRepository.delete(req.params.id);
    res.json({ success: true, message: 'Fail berjaya dipadam' });
})));
exports.default = router;
