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
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const FileUploadRepository_1 = require("../../infrastructure/repositories/FileUploadRepository");
const WhatsAppService_1 = require("../../infrastructure/services/WhatsAppService");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
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
// ─── Cloudinary Configuration ─────────────────────────────
// Railway filesystem is ephemeral — files are wiped on each redeploy.
// Cloudinary provides persistent, cloud-hosted storage for all uploads.
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
    api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});
// ─── Multer + Cloudinary Storage ─────────────────────────
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        return ({
            folder: `kampungcetak/uploads/${req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'unknown'}`,
            // PDFs must be stored as 'raw', images as 'image'
            resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'gif', 'pdf'],
            public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        });
    }),
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
// Files are uploaded directly to Cloudinary — not stored locally.
router.post('/upload', auth_middileware_1.default, upload.array('files', 10), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const files = req.files;
    const { orderId, notes, userId: bodyUserId, category } = req.body;
    const authReq = req;
    // If admin provides a userId in the body, upload on their behalf
    const userId = (authReq.role === 'admin' && bodyUserId) ? bodyUserId : authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
        return;
    }
    if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    // Cloudinary multer-storage-cloudinary puts the secure URL in file.path
    const savedFiles = yield Promise.all(files.map((file) => FileUploadRepository_1.fileUploadRepository.create({
        userId,
        orderId: orderId || undefined,
        category: category || undefined,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        // file.path = Cloudinary secure URL (e.g. https://res.cloudinary.com/...)
        path: file.path,
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
// ─── GET /api/files/stats ─────────────────────────────────
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
// Redirects to Cloudinary URL for download
router.get('/:id/download', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    // file.path is the Cloudinary URL — redirect directly
    res.redirect(file.path);
})));
// ─── GET /api/files/:id/preview ──────────────────────────
// Redirects to Cloudinary URL for inline preview
router.get('/:id/preview', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    res.redirect(file.path);
})));
// ─── PUT /api/files/:id/review ────────────────────────────
// Admin marks a file as reviewed (optionally with notes)
router.put('/:id/review', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewed, notes } = req.body;
    const file = yield FileUploadRepository_1.fileUploadRepository.updateAdminReview(req.params.id, reviewed !== false, notes);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    res.json({ success: true, data: file });
})));
// ─── DELETE /api/files/:id ────────────────────────────────
// Admin deletes file from DB and Cloudinary
router.delete('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    // Delete from Cloudinary using the public_id extracted from the URL
    try {
        // Extract public_id from Cloudinary URL
        // e.g. https://res.cloudinary.com/{cloud}/image/upload/v123/kampungcetak/uploads/{userId}/{public_id}
        const urlParts = file.path.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1) {
            // Join everything after 'upload/v{version}/' as the public_id path
            const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
            const publicId = publicIdWithVersion.replace(/\.[^/.]+$/, ''); // remove extension
            const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
            yield cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
            console.log(`[FileUpload] Deleted from Cloudinary: ${publicId}`);
        }
    }
    catch (err) {
        console.warn('[FileUpload] Could not delete from Cloudinary:', err.message);
    }
    yield FileUploadRepository_1.fileUploadRepository.delete(req.params.id);
    res.json({ success: true, message: 'Fail berjaya dipadam' });
})));
exports.default = router;
