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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
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
const Task_1 = require("../../domain/entities/Task");
const user_repository_1 = __importDefault(require("../../infrastructure/db/repositories/user.repository"));
const ShareLinkRepository_1 = require("../../infrastructure/repositories/ShareLinkRepository");
const ShareLink_1 = require("../../domain/entities/ShareLink");
const order_repository_1 = __importDefault(require("../../infrastructure/db/repositories/order.repository"));
const router = (0, express_1.Router)();
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10);
// ─── Multer + S3 Storage ─────────────────────────
const storage = (0, multer_s3_1.default)({
    s3: s3_1.s3Client,
    bucket: s3_1.S3_BUCKET_NAME,
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
        cb(null, true);
    }
});
// ─── POST /api/files/upload ───────────────────────────────
// Customer uploads one or more files (requires auth middleware upstream)
// Files are uploaded directly to AWS S3 — not stored locally.
router.post('/upload', auth_middileware_1.default, upload.array('files', 100), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const files = req.files;
    const { orderId, taskId, notes, userId: bodyUserId, category, tag, folderId } = req.body;
    const authReq = req;
    // If admin provides a userId in the body, upload on their behalf
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(authReq.role);
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
        tag: tag || undefined,
        filename: file.key || file.filename || file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        // file.location is provided by multer-s3
        path: file.location || file.path,
        notes: notes || undefined,
        adminReviewed: false,
        folderId: folderId || undefined,
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
// ─── POST /api/files/presigned-url ────────────────────────
// Get a presigned URL to upload file directly to S3
router.post('/presigned-url', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { filename, contentType, folderPath } = req.body;
    if (!filename || !contentType) {
        res.status(400).json({ success: false, message: 'filename and contentType are required' });
        return;
    }
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'unknown';
    const folder = folderPath ? folderPath : userId;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const key = `kampungcetak/uploads/${folder}/${uniqueSuffix}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const command = new PutObjectCommand({
        Bucket: s3_1.S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });
    const signedUrl = yield getSignedUrl(s3_1.s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${s3_1.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-5'}.amazonaws.com/${key}`;
    res.json({ success: true, signedUrl, fileUrl, key });
})));
// ─── POST /api/files/save-metadata ────────────────────────
// Client calls this after direct S3 upload succeeds
router.post('/save-metadata', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { orderId, taskId, notes, userId: bodyUserId, category, tag, folderId, shareSlug, files } = req.body;
    const authReq = req;
    // If admin provides a userId in the body, upload on their behalf
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(authReq.role);
    let userId = (isAdmin && bodyUserId) ? bodyUserId : undefined;
    // If no userId is provided, but taskId or orderId is, do not fallback to admin's ID
    if (!userId && !taskId && !orderId) {
        userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    }
    if (!userId && !taskId) {
        res.status(401).json({ success: false, message: 'Log masuk atau Task diperlukan' });
        return;
    }
    if (!files || !Array.isArray(files) || files.length === 0) {
        res.status(400).json({ success: false, message: 'Tiada fail metadata diberikan' });
        return;
    }
    const savedFiles = yield Promise.all(files.map((file) => FileUploadRepository_1.fileUploadRepository.create({
        userId: userId || 'admin',
        orderId: orderId || undefined,
        taskId: taskId || undefined,
        category: category || undefined,
        tag: tag || undefined,
        filename: file.key || file.filename || file.originalname || file.name,
        originalName: file.originalname || file.name,
        mimetype: file.mimetype || file.type || 'application/octet-stream',
        size: file.size || 0,
        path: file.fileUrl || file.path || file.url,
        notes: notes || undefined,
        adminReviewed: false,
        folderId: folderId || undefined,
        shareSlug: shareSlug || undefined,
    })));
    // Optionally notify customer via WhatsApp
    const customerPhone = (_b = authReq.user) === null || _b === void 0 ? void 0 : _b.phone;
    const customerName = ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.name) || 'Pelanggan';
    if (customerPhone) {
        WhatsAppService_1.whatsAppService
            .sendFileUploadConfirmation({
            phone: customerPhone,
            customerName: customerName,
            fileCount: savedFiles.length,
        })
            .catch((err) => console.error('Failed to send WhatsApp notification:', err));
    }
    res.status(201).json({
        success: true,
        message: `${savedFiles.length} fail berjaya direkodkan`,
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
    // Enrich files that were uploaded via a share link with the link's metadata
    // so the admin grouping logic can place them in the correct folder
    const slugsNeeded = [...new Set(files.filter((f) => f.shareSlug).map((f) => f.shareSlug))];
    let slugMap = {};
    if (slugsNeeded.length > 0) {
        const links = yield ShareLink_1.ShareLink.find({ slug: { $in: slugsNeeded } });
        links.forEach((l) => { slugMap[l.slug] = l; });
    }
    const enrichedFiles = files.map((file) => {
        if (file.shareSlug && slugMap[file.shareSlug]) {
            const link = slugMap[file.shareSlug];
            const f = file.toObject ? file.toObject() : Object.assign({}, file);
            // Backfill taskId/orderId/category from the share link so grouping works
            if (!f.taskId && link.taskId) {
                f.taskId = link.taskId;
                f.category = 'TASK'; // also fix category so grouping treats it as a task file
            }
            if (!f.orderId && link.orderId)
                f.orderId = link.orderId;
            f._shareFolderName = link.folderName; // pass folder name to frontend
            return f;
        }
        return file;
    });
    const stats = yield FileUploadRepository_1.fileUploadRepository.getStorageStats();
    res.json({ success: true, data: enrichedFiles, stats, count: enrichedFiles.length });
})));
// ─── GET /api/files/grouped ───────────────────────────────
// Admin: files grouped by customer (Nextcloud folder view)
router.get('/grouped', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const grouped = yield FileUploadRepository_1.fileUploadRepository.getFilesGroupedByUser();
    const stats = yield FileUploadRepository_1.fileUploadRepository.getStorageStats();
    res.json({ success: true, data: grouped, stats });
})));
// ─── PUT /api/files/:id/reassign ───────────────────────────
// Admin: fix a file that landed in the wrong folder (e.g. uploaded via a
// share link before the link's userId was resolved correctly).
router.put('/:id/reassign', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, orderId, taskId, category } = req.body;
    const file = yield FileUploadRepository_1.fileUploadRepository.reassign(req.params.id, {
        userId,
        orderId,
        taskId,
        category,
    });
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    res.json({ success: true, data: file });
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
// 🌐 Public: Upload files to a specific folder using robust token
const decodeSharedToken = (req, res, next) => {
    try {
        const decoded = JSON.parse(Buffer.from(req.params.token, 'base64').toString('utf-8'));
        req.userId = decoded.u || 'customer';
        req.taskId = decoded.t;
        req.orderId = decoded.o;
        // Preserve folder type so the admin UI re-groups this upload into the
        // SAME folder the link was generated from (task folders are grouped by
        // taskId/category, not by userId).
        req.shareCategory = decoded.t ? 'TASK' : 'artwork';
        next();
    }
    catch (e) {
        res.status(400).json({ success: false, message: 'Invalid token' });
    }
};
router.post('/shared/upload/:token', decodeSharedToken, upload.array('files', 100), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    const { taskId, orderId, userId, shareCategory } = req;
    if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const savedFiles = yield Promise.all(files.map((file) => FileUploadRepository_1.fileUploadRepository.create({
        userId: userId || 'customer',
        orderId: orderId || undefined,
        taskId: taskId || undefined,
        category: shareCategory || 'artwork',
        shareSlug: req.params.token, // Add shareSlug so backend enrichment works
        filename: file.key || file.filename || file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.location || file.path,
        adminReviewed: false,
    })));
    res.status(201).json({
        success: true,
        message: `${savedFiles.length} fail berjaya dimuat naik`,
        data: savedFiles,
    });
})));
// ─── POST /api/files/share-link ───────────────────────────
// Admin: create (or reuse) a short, name-based share link for a folder
// e.g. { folderName: "Ahmad Ali", taskId, orderId, userId } -> { slug: "ahmad-ali" }
router.post('/share-link', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { folderName, taskId, orderId, userId, folderId } = req.body;
    if (!folderName) {
        res.status(400).json({ success: false, message: 'folderName diperlukan' });
        return;
    }
    // Always try to resolve the REAL customer userId server-side, even if the
    // admin UI didn't have one on hand (e.g. an empty folder with no files yet).
    // This keeps customer uploads grouped under the correct user in the admin
    // view instead of falling into a generic "customer" folder.
    let resolvedUserId = userId || undefined;
    let resolvedOrderId = orderId || undefined;
    if (!resolvedUserId && taskId) {
        try {
            const task = yield TaskRepository_1.taskRepository.findById(taskId);
            if (task) {
                resolvedOrderId = resolvedOrderId || task.orderId;
            }
        }
        catch (e) { }
    }
    if (!resolvedUserId && resolvedOrderId) {
        try {
            const order = yield order_repository_1.default.getOrderById(resolvedOrderId);
            if (order) {
                const ou = order.userId;
                resolvedUserId = (ou === null || ou === void 0 ? void 0 : ou._id) ? ou._id.toString() : ou === null || ou === void 0 ? void 0 : ou.toString();
            }
        }
        catch (e) { }
    }
    if (!taskId && !resolvedOrderId && !resolvedUserId && !folderId) {
        res.status(400).json({
            success: false,
            message: 'Folder ini belum dikaitkan dengan order, task, atau pelanggan — tidak boleh jana share link',
        });
        return;
    }
    const link = yield ShareLinkRepository_1.shareLinkRepository.findOrCreate({
        folderName,
        taskId,
        orderId: resolvedOrderId,
        userId: resolvedUserId,
        folderId,
    });
    res.json({ success: true, data: link });
})));
// ─── PUT /api/files/share-link/:slug ───────────────────────
// Admin: backfill userId on an existing share link if it was created
// before the customer's userId was resolvable (fixes old links).
router.put('/share-link/:slug', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link tidak dijumpai' });
        return;
    }
    const { userId } = req.body;
    if (userId) {
        link.userId = userId;
        yield link.save();
    }
    res.json({ success: true, data: link });
})));
// ─── GET /api/files/share-links ────────────────────────────
// Admin: list all share links (for diagnosing/cleaning up old/ambiguous ones)
router.get('/share-links', auth_middileware_1.default, (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const links = yield ShareLink_1.ShareLink.find().sort({ createdAt: -1 });
    res.json({ success: true, data: links });
})));
// ─── DELETE /api/files/share-link/:slug ────────────────────
// Admin: delete a share link (e.g. a stale/ambiguous one)
router.delete('/share-link/:slug', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield ShareLink_1.ShareLink.deleteOne({ slug: req.params.slug });
    res.json({ success: true });
})));
// 🌐 Public: Get files for a specific folder using a short slug
router.get('/s/:slug', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.json({ success: true, data: [], folderName: null });
        return;
    }
    // Match files 3 ways and merge: by the exact slug stamp (covers every
    // customer upload through this link), and by taskId/orderId (covers
    // files the admin added directly to the folder before sharing it).
    const orConditions = [{ shareSlug: req.params.slug }];
    if (link.folderId)
        orConditions.push({ folderId: link.folderId });
    else if (link.taskId)
        orConditions.push({ taskId: link.taskId });
    else if (link.orderId)
        orConditions.push({ orderId: link.orderId });
    else if (link.userId)
        orConditions.push({ userId: link.userId });
    const files = yield FileUpload_1.FileUpload.find({ $or: orConditions }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: files, folderName: link.folderName });
})));
// 🌐 Public: Download all files in a shared folder as a single ZIP
router.get('/s/:slug/download-all', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link not found' });
        return;
    }
    const orConditions = [{ shareSlug: req.params.slug }];
    if (link.folderId)
        orConditions.push({ folderId: link.folderId });
    else if (link.taskId)
        orConditions.push({ taskId: link.taskId });
    else if (link.orderId)
        orConditions.push({ orderId: link.orderId });
    else if (link.userId)
        orConditions.push({ userId: link.userId });
    const files = yield FileUpload_1.FileUpload.find({ $or: orConditions }).sort({ uploadedAt: -1 });
    if (!files.length) {
        res.status(404).json({ success: false, message: 'No files found' });
        return;
    }
    const archiver = require('archiver');
    const { Readable } = require('stream');
    const folderName = (link.folderName || 'files').replace(/[^a-zA-Z0-9 _-]/g, '_');
    // Resolve a fetchable URL for each file. Files stored on S3 are almost
    // always in a private bucket (downloads elsewhere in this app go through
    // a signed URL), so fetching file.path directly returns 403 for every
    // file. That failure was being swallowed by `if (!fileRes.ok) continue`,
    // so the loop finished having appended zero entries and the ZIP was
    // still finalized and sent — a "successful" download with nothing
    // inside. Signing S3 URLs here fixes that.
    const resolveDownloadUrl = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
        if (!filePath.includes('amazonaws.com'))
            return filePath;
        try {
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
            const urlObj = new URL(filePath);
            const rawKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
            const key = decodeURIComponent(rawKey);
            return yield getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn: 300 });
        }
        catch (e) {
            console.warn(`Could not sign URL for ${filePath}:`, e);
            return filePath;
        }
    });
    let addedCount = 0;
    const skipped = [];
    // Sign/fetch every file BEFORE opening the response, so that if every
    // single file fails we can return a clear JSON error instead of sending
    // a 200 OK with an empty zip body.
    const preparedFiles = [];
    for (const file of files) {
        try {
            const downloadUrl = yield resolveDownloadUrl(file.path);
            const fileRes = yield fetch(downloadUrl);
            if (!fileRes.ok || !fileRes.body) {
                skipped.push(file.originalName);
                console.warn(`[download-all] Skipping ${file.originalName}: HTTP ${fileRes.status}`);
                continue;
            }
            preparedFiles.push({ name: file.originalName, stream: fileRes.body });
            addedCount++;
        }
        catch (e) {
            skipped.push(file.originalName);
            console.warn(`[download-all] Skipping ${file.originalName}:`, e);
        }
    }
    if (addedCount === 0) {
        res.status(502).json({
            success: false,
            message: 'Could not fetch any files for this folder from storage. Please try again or contact support.',
        });
        return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);
    if (skipped.length) {
        res.setHeader('X-Skipped-Files', String(skipped.length));
    }
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err) => { console.error('Archive error:', err); res.end(); });
    archive.pipe(res);
    for (const { name, stream } of preparedFiles) {
        archive.append(Readable.fromWeb(stream), { name });
    }
    yield archive.finalize();
})));
// 🌐 Public: Upload files to a folder using a short slug
const decodeSharedSlug = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link tidak dijumpai' });
        return;
    }
    req.userId = link.userId || 'customer';
    req.taskId = link.taskId;
    req.orderId = link.orderId;
    req.folderId = link.folderId;
    req.shareSlug = req.params.slug;
    // Preserve folder type so the admin UI re-groups this upload into the
    // SAME folder the link was generated from (task folders are grouped by
    // taskId/category, not by userId).
    req.shareCategory = link.taskId ? 'TASK' : 'artwork';
    next();
});
// 🌐 Public: Get presigned URL for direct S3 upload via CUSTOMER UPLOAD PORTAL
router.post('/customer/upload-url', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename, contentType, orderId, username } = req.body;
    if (!filename || !orderId || !username) {
        res.status(400).json({ success: false, message: 'Filename, orderId, and username required' });
        return;
    }
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `kampungcetak/customer_uploads/${username}/${uniqueSuffix}-${safeFilename}`;
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType || 'application/octet-stream'
    });
    const uploadUrl = yield getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({
        success: true,
        url: uploadUrl,
        key: key,
        publicUrl: `https://${S3_BUCKET_NAME}.s3.ap-southeast-5.amazonaws.com/${key}`,
        userId: username,
        orderId,
        category: 'CUSTOMER_UPLOAD'
    });
})));
// 🌐 Public: Save metadata after direct S3 upload via CUSTOMER UPLOAD PORTAL
router.post('/customer/save-metadata', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { files, orderId, username, phoneNumber, item } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0 || !orderId || !username) {
        res.status(400).json({ success: false, message: 'Files, orderId, and username required' });
        return;
    }
    // 1. Create a Task for this upload
    const savedTask = yield TaskRepository_1.taskRepository.create({
        title: `Artwork Upload: #${orderId}`,
        description: `Phone Number: ${phoneNumber || 'N/A'}\nItem: ${item || 'N/A'}`,
        orderId: orderId,
        customerUsername: username,
        status: 'PLACED',
        category: 'UNASSIGNED',
        assignee: undefined,
        files: files.map((f) => ({
            url: f.path,
            name: f.originalName,
            tag: 'attachment'
        }))
    });
    // 2. Save FileUpload entries
    const savedFiles = yield Promise.all(files.map((f) => FileUploadRepository_1.fileUploadRepository.create({
        userId: username,
        orderId: orderId,
        category: 'CUSTOMER_UPLOAD',
        filename: f.key,
        originalName: f.originalName,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
        taskId: savedTask._id.toString(),
        adminReviewed: false,
    })));
    res.json({ success: true, data: savedFiles, task: savedTask });
})));
// 🌐 Public: Get presigned URL for direct S3 upload via shared link
router.post('/s/:slug/upload-url', (0, express_async_handler_1.default)(decodeSharedSlug), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename, contentType } = req.body;
    if (!filename) {
        res.status(400).json({ success: false, message: 'Filename required' });
        return;
    }
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
    // Get variables decoded from the slug
    const userId = req.userId || 'customer';
    const taskId = req.taskId;
    const orderId = req.orderId;
    const folderId = req.folderId;
    const shareCategory = req.shareCategory || 'artwork';
    const shareSlug = req.shareSlug;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `kampungcetak/uploads/${userId}/${uniqueSuffix}-${safeFilename}`;
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType || 'application/octet-stream'
    });
    const uploadUrl = yield getSignedUrl(s3Client, command, { expiresIn: 3600 });
    // We also need to save the file metadata to the database immediately 
    // because the customer uploads directly to S3 and we don't have a backend callback.
    // Wait, if they upload directly to S3, we should save metadata AFTER they finish uploading.
    // We can return the metadata info and let the frontend call a separate route, 
    // or just assume they will finish it. But wait, it's safer to have the frontend save metadata.
    // Since the frontend is just /share/[slug]/page.tsx, let's just return the URL and let the frontend save metadata!
    res.json({
        success: true,
        url: uploadUrl,
        key: key,
        publicUrl: `https://${S3_BUCKET_NAME}.s3.ap-southeast-5.amazonaws.com/${key}`,
        userId, taskId, orderId, folderId, shareCategory, shareSlug
    });
})));
// 🌐 Public: Save metadata after direct S3 upload via shared link
router.post('/s/:slug/save-metadata', (0, express_async_handler_1.default)(decodeSharedSlug), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
        res.status(400).json({ success: false, message: 'Files required' });
        return;
    }
    const { taskId, orderId, userId, folderId, shareCategory, shareSlug } = req;
    const savedFiles = yield Promise.all(files.map((f) => FileUploadRepository_1.fileUploadRepository.create({
        userId: userId || 'customer',
        orderId: orderId || undefined,
        taskId: taskId || undefined,
        folderId: folderId || undefined,
        category: shareCategory || 'artwork',
        shareSlug,
        filename: f.key,
        originalName: f.originalName,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
        adminReviewed: false,
    })));
    res.json({ success: true, data: savedFiles });
})));
router.post('/s/:slug/upload', (0, express_async_handler_1.default)(decodeSharedSlug), upload.array('files', 100), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    const { taskId, orderId, userId, folderId, shareCategory, shareSlug } = req;
    if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const savedFiles = yield Promise.all(files.map((file) => FileUploadRepository_1.fileUploadRepository.create({
        userId: userId || 'customer',
        orderId: orderId || undefined,
        taskId: taskId || undefined,
        folderId: folderId || undefined,
        category: shareCategory || 'artwork',
        shareSlug,
        filename: file.key || file.filename || file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.location || file.path,
        adminReviewed: false,
    })));
    res.status(201).json({
        success: true,
        message: `${savedFiles.length} fail berjaya dimuat naik`,
        data: savedFiles,
    });
})));
// 🌐 Public: Delete a file from a shared folder (slug acts as auth)
router.delete('/s/:slug/files/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link not found' });
        return;
    }
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    // Verify file belongs to this share link
    const belongsToLink = file.shareSlug === req.params.slug ||
        (link.taskId && ((_a = file.taskId) === null || _a === void 0 ? void 0 : _a.toString()) === ((_b = link.taskId) === null || _b === void 0 ? void 0 : _b.toString())) ||
        (link.orderId && ((_c = file.orderId) === null || _c === void 0 ? void 0 : _c.toString()) === ((_d = link.orderId) === null || _d === void 0 ? void 0 : _d.toString()));
    if (!belongsToLink) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
    }
    try {
        if (file.path)
            yield (0, s3_1.deleteFromS3)(file.path);
    }
    catch (err) {
        console.warn('[SharedDelete] S3 delete failed:', err.message);
    }
    yield FileUploadRepository_1.fileUploadRepository.delete(req.params.id);
    if (file.path) {
        yield Task_1.Task.updateMany({ "files.url": file.path }, { $pull: { files: { url: file.path } } });
    }
    res.json({ success: true, message: 'File deleted' });
})));
// 🌐 Public: Add/update a note on a file from a shared folder
router.patch('/s/:slug/files/:id/note', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link not found' });
        return;
    }
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    const belongsToLink = file.shareSlug === req.params.slug ||
        (link.taskId && ((_a = file.taskId) === null || _a === void 0 ? void 0 : _a.toString()) === ((_b = link.taskId) === null || _b === void 0 ? void 0 : _b.toString())) ||
        (link.orderId && ((_c = file.orderId) === null || _c === void 0 ? void 0 : _c.toString()) === ((_d = link.orderId) === null || _d === void 0 ? void 0 : _d.toString()));
    if (!belongsToLink) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
    }
    const { notes } = req.body;
    file.notes = notes !== null && notes !== void 0 ? notes : '';
    yield file.save();
    res.json({ success: true, data: file });
})));
// 🔹🔹🔹 GET /api/files/stats 🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
router.get('/stats', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield FileUploadRepository_1.fileUploadRepository.getStorageStats();
    res.json({ success: true, data: stats });
})));
// ─── GET /api/files/proxy-download ─────────────────────────
// Proxies an S3 URL provided via query parameter to force download
router.get('/proxy-download', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileUrl = req.query.url;
    const fileName = req.query.name || "download";
    if (!fileUrl) {
        res.status(400).json({ success: false, message: 'URL required' });
        return;
    }
    try {
        if (fileUrl.includes('amazonaws.com')) {
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
            const urlObj = new URL(fileUrl);
            const rawKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
            const key = decodeURIComponent(rawKey);
            const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';
            const commandParams = {
                Bucket: S3_BUCKET_NAME,
                Key: key,
                ResponseContentDisposition: `${disposition}; filename="${fileName.replace(/"/g, '\\"')}"`
            };
            if (req.query.inline === 'true' && fileName.toLowerCase().endsWith('.pdf')) {
                commandParams.ResponseContentType = 'application/pdf';
            }
            const command = new GetObjectCommand(commandParams);
            const signedUrl = yield getSignedUrl(s3Client, command, { expiresIn: 3600 });
            // If stream=true is passed, proxy the S3 file through the backend to avoid CORS errors in browser fetch
            if (req.query.stream === 'true') {
                const s3Response = yield fetch(signedUrl);
                if (!s3Response.ok)
                    throw new Error("Failed to fetch from S3");
                res.setHeader('Content-Disposition', `${disposition}; filename="${fileName.replace(/"/g, '\\"')}"`);
                let contentType = s3Response.headers.get('content-type') || 'application/octet-stream';
                if (req.query.inline === 'true' && fileName.toLowerCase().endsWith('.pdf')) {
                    contentType = 'application/pdf';
                }
                res.setHeader('Content-Type', contentType);
                // Use Readable.fromWeb to pipe the web stream to the Node.js response
                const { Readable } = require('stream');
                if (s3Response.body) {
                    Readable.fromWeb(s3Response.body).pipe(res);
                }
                else {
                    res.status(500).json({ success: false, message: 'No body in S3 response' });
                }
                return;
            }
            res.redirect(signedUrl);
            return;
        }
        const response = yield fetch(fileUrl);
        if (!response.ok)
            throw new Error("Failed to fetch from URL");
        res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/"/g, '\\"')}"`);
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        if (response.body) {
            const { Readable } = require('stream');
            Readable.fromWeb(response.body).pipe(res);
        }
        else {
            res.redirect(fileUrl);
        }
    }
    catch (err) {
        console.error("Error streaming proxy file:", err);
        // Only fall back to a redirect for plain navigations (e.g. the user
        // clicked a direct download link). A bulk "Download All" request calls
        // this endpoint with fetch()+stream=true and expects real file bytes
        // back — redirecting it to a possibly-private S3 URL used to make the
        // fetch "succeed" with an empty/AccessDenied body, which is how a
        // whole batch of files could silently end up as 0 bytes inside the
        // generated ZIP. So for stream requests we return a real error instead.
        if (!res.headersSent) {
            if (req.query.stream === 'true') {
                res.status(502).json({ success: false, message: 'Failed to fetch file for download' });
            }
            else {
                res.redirect(fileUrl);
            }
        }
    }
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
// Proxies the S3 URL to force a download with Content-Disposition
router.get('/:id/download', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    try {
        if (file.path.includes('amazonaws.com')) {
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
            const urlObj = new URL(file.path);
            const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
            const command = new GetObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key,
                ResponseContentDisposition: `attachment; filename="${file.originalName.replace(/"/g, '\\"')}"`
            });
            const signedUrl = yield getSignedUrl(s3Client, command, { expiresIn: 3600 });
            res.redirect(signedUrl);
            return;
        }
        // Import axios dynamically if not at top of file, or use global fetch
        const response = yield fetch(file.path);
        if (!response.ok)
            throw new Error("Failed to fetch from URL");
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/"/g, '\\"')}"`);
        res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
        if (response.body) {
            // Node 18+ fetch body is a web readable stream. We need to pipe it.
            const { Readable } = require('stream');
            Readable.fromWeb(response.body).pipe(res);
        }
        else {
            res.redirect(file.path);
        }
    }
    catch (err) {
        console.error("Error streaming file:", err);
        // Fallback to redirect if streaming fails
        res.redirect(file.path);
    }
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
// ─── GET /api/files/:id/info ──────────────────────────────
// Public: returns basic file metadata for share page display (no auth needed)
router.get('/:id/info', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    res.json({
        success: true,
        data: {
            id: file._id,
            originalName: file.originalName,
            mimetype: file.mimetype,
            size: file.size,
            createdAt: file.createdAt,
            path: file.path,
        }
    });
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
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(authReq.role);
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
                // Remove file from any Task that references it
                yield Task_1.Task.updateMany({ "files.url": file.path }, { $pull: { files: { url: file.path } } });
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
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(authReq.role);
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
            // Remove file from any Task that references it
            yield Task_1.Task.updateMany({ "files.url": file.path }, { $pull: { files: { url: file.path } } });
        }
    }
    catch (err) {
        console.warn('[FileUpload] Could not delete from S3:', err.message);
    }
    yield FileUploadRepository_1.fileUploadRepository.delete(req.params.id);
    res.json({ success: true, message: 'Fail berjaya dipadam' });
})));
// ─── PUT /api/files/:id/move ─────────────────────────────────
// Admin moves a file to a folder
router.put('/:id/move', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { folderId } = req.body;
    const { id } = req.params;
    // We allow setting folderId to null/undefined to move it back to root
    const updatedFile = yield FileUpload_1.FileUpload.findByIdAndUpdate(id, { folderId: folderId || null }, { new: true });
    if (!updatedFile) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    res.json({ success: true, data: updatedFile, message: 'File moved successfully' });
})));
exports.default = router;
