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
exports.clearFolderGroupCache = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const s3_1 = require("../../infrastructure/config/s3");
const multer_s3_1 = __importDefault(require("multer-s3"));
const FileUploadRepository_1 = require("../../infrastructure/repositories/FileUploadRepository");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const WhatsAppService_1 = require("../../infrastructure/services/WhatsAppService");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const TaskRepository_1 = require("../../infrastructure/repositories/TaskRepository");
const Task_1 = require("../../domain/entities/Task");
const user_repository_1 = __importDefault(require("../../infrastructure/db/repositories/user.repository"));
const ShareLinkRepository_1 = require("../../infrastructure/repositories/ShareLinkRepository");
const ShareLink_1 = require("../../domain/entities/ShareLink");
const VirtualFolder_1 = require("../../domain/entities/VirtualFolder");
const order_repository_1 = __importDefault(require("../../infrastructure/db/repositories/order.repository"));
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const user_model_1 = __importDefault(require("../../infrastructure/db/models/user.model"));
const redis_1 = require("../../infrastructure/redis/redis");
const taskBroadcast_1 = require("../../shared/utils/taskBroadcast");
const streamFilesAsZip_1 = require("../../shared/utils/streamFilesAsZip");
const downloadProgress_1 = require("../../shared/utils/downloadProgress");
const pdfSharePreview_1 = require("../../shared/utils/pdfSharePreview");
// Tiered cache: Redis primary, in-memory fallback when Redis connection drops
const enrichedIndexCache = new redis_1.RedisService();
const ENRICHED_CACHE_KEY_PREFIX = 'files:enrichedIndex:v2:';
const ENRICHED_CACHE_TTL = 120; // seconds
const memCache = new Map();
const clearFolderGroupCache = () => __awaiter(void 0, void 0, void 0, function* () {
    memCache.clear();
    try {
        yield enrichedIndexCache.delByPrefix(ENRICHED_CACHE_KEY_PREFIX);
    }
    catch (err) {
        console.error('Failed to clear folderGroup cache:', err);
    }
});
exports.clearFolderGroupCache = clearFolderGroupCache;
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
// ─── POST /api/files/resolve-by-path ──────────────────────
// Used by the "Share" button on a file that doesn't have a locally-known
// FileUpload id (e.g. because the sync at upload time silently failed).
// Idempotent: returns the existing record for this path if one exists,
// otherwise creates it — so share links always resolve to a real id.
router.post('/resolve-by-path', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { path, name, mimetype, size, taskId, orderId, category, tag } = req.body;
    const authReq = req;
    if (!path || !name) {
        res.status(400).json({ success: false, message: 'path and name are required' });
        return;
    }
    const userId = authReq.userId || ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id) || 'admin';
    const file = yield FileUploadRepository_1.fileUploadRepository.findOrCreateByPath({
        userId,
        taskId: taskId || undefined,
        orderId: orderId || undefined,
        category: category || (taskId ? 'TASK' : 'UNCATEGORIZED'),
        tag: tag || 'attachment',
        filename: name,
        originalName: name,
        mimetype: mimetype || 'application/octet-stream',
        size: size || 0,
        path,
    });
    res.json({ success: true, data: file });
})));
// ─── POST /api/files/save-metadata ────────────────────────
// Client calls this after direct S3 upload succeeds
router.post('/save-metadata', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { orderId, taskId, notes, userId: bodyUserId, category, tag, folderId, shareSlug, files } = req.body;
    const authReq = req;
    // If admin provides a userId in the body, upload on their behalf
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(authReq.role);
    const authenticatedUserId = authReq.userId || ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
    let userId = isAdmin ? bodyUserId : authenticatedUserId;
    if (orderId && (!isAdmin || !userId)) {
        const orderOwnerId = yield order_repository_1.default.getOrderOwnerId(orderId);
        if (!isAdmin && orderOwnerId !== authenticatedUserId) {
            res.status(403).json({ success: false, message: 'Pesanan tidak sah untuk pengguna ini' });
            return;
        }
        if (isAdmin && orderOwnerId)
            userId = orderOwnerId;
    }
    if (isAdmin && !userId && !taskId && !orderId) {
        userId = authenticatedUserId;
    }
    if (!userId && !taskId) {
        res.status(401).json({ success: false, message: 'Log masuk atau Task diperlukan' });
        return;
    }
    if (!files || !Array.isArray(files) || files.length === 0) {
        res.status(400).json({ success: false, message: 'Tiada fail metadata diberikan' });
        return;
    }
    const savedFiles = yield FileUploadRepository_1.fileUploadRepository.createMany(files.map((file) => ({
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
    const customerPhone = (_d = authReq.user) === null || _d === void 0 ? void 0 : _d.phone;
    const customerName = ((_e = authReq.user) === null || _e === void 0 ? void 0 : _e.name) || 'Pelanggan';
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
router.get('/', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewed, search, limit } = req.query;
    const filters = {};
    if (reviewed !== undefined)
        filters.adminReviewed = reviewed === 'true';
    if (search) {
        filters.search = search;
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedSearch, 'i');
        const matchingTasks = yield Task_1.Task.find({
            isDeleted: { $ne: true },
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { orderId: searchRegex },
                { customerUsername: searchRegex },
            ],
        }).select('_id').limit(100).lean();
        filters.taskIds = matchingTasks.map(task => task._id.toString());
    }
    if (limit) {
        const parsedLimit = parseInt(limit, 10);
        if (!Number.isNaN(parsedLimit))
            filters.limit = parsedLimit;
    }
    const files = yield FileUploadRepository_1.fileUploadRepository.findAll(filters);
    // Enrich files that were uploaded via a share link with the link's metadata
    // so the admin grouping logic can place them in the correct folder
    const enrichedFiles = yield enrichWithShareLinks(files);
    const stats = { totalFiles: enrichedFiles.length, totalSize: 0, pendingReview: 0, totalSizeMB: "0" };
    res.json({ success: true, data: enrichedFiles, stats, count: enrichedFiles.length });
})));
// Backfills taskId/orderId/folderName onto files uploaded via a share link,
// and normalizes category for task-linked files. Shared by every endpoint
// that returns file listings for the admin manager pages.
function enrichWithShareLinks(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const slugsNeeded = [...new Set(files.filter((f) => f.shareSlug).map((f) => f.shareSlug))];
        let slugMap = {};
        if (slugsNeeded.length > 0) {
            const links = yield ShareLink_1.ShareLink.find({ slug: { $in: slugsNeeded } });
            links.forEach((l) => { slugMap[l.slug] = l; });
        }
        return files.map((file) => {
            const f = file.toObject ? file.toObject() : Object.assign({}, file);
            if (f.shareSlug && slugMap[f.shareSlug]) {
                const link = slugMap[f.shareSlug];
                if (!f.taskId && link.taskId)
                    f.taskId = link.taskId;
                if (!f.orderId && link.orderId)
                    f.orderId = link.orderId;
                f._shareFolderName = link.folderName;
            }
            if (f.taskId)
                f.category = 'TASK';
            return f;
        });
    });
}
// ─── GET /api/files/index ───────────────────────────────────
// Slim, unwindowed file listing used to render the folder list (name + item
// count) on the Artworks/Production/Packaging manager pages fast. Each
// record only carries the fields needed to group files into folders — no
// S3 URLs, sizes, notes, etc. — so it stays cheap to return in full instead
// of applying the 30-day cutoff that GET / below uses (that cutoff was
// hiding folders whose artwork was uploaded more than 30 days ago, even
// though the underlying job was still active).
router.get('/index', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield FileUploadRepository_1.fileUploadRepository.findIndex();
    const enriched = yield enrichWithShareLinks(files);
    res.json({ success: true, data: enriched });
})));
// ─── GET /api/files/folder-group ─────────────────────────────
// Server-side grouping of files into task/order/user folders with counts.
// Eliminates the client-side O(n*m) join between files, tasks, orders, users.
// Accepts ?taskStatuses= comma-separated list to filter by task status
// (defaults to artwork statuses if omitted).
router.get('/folder-group', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const ARTWORK_STATUSES = ["PLACED", "IN_DESIGN", "IN_PROGRESS", "PENDING_ARTWORK", "ARTWORK_REVIEWED", "ARTWORK_REJECTED", "PEMBETULAN", "DONE_DESIGN"];
    const rawStatuses = (_a = req.query.taskStatuses) === null || _a === void 0 ? void 0 : _a.split(',').filter(Boolean);
    const taskStatusFilter = rawStatuses && rawStatuses.length > 0 ? rawStatuses : ARTWORK_STATUSES;
    const filterUpper = taskStatusFilter.map(s => s.toUpperCase());
    // Generate plain string variants for MongoDB queries ($in array)
    const statusQueryValues = Array.from(new Set([
        ...filterUpper,
        ...filterUpper.map(s => s.toLowerCase()),
        ...filterUpper.map(s => s.replace(/_/g, ' ')),
        ...filterUpper.map(s => s.replace(/_/g, '-')),
    ]));
    const matchesStatus = (status) => {
        if (!status)
            return false;
        const s = status.toUpperCase();
        const sNormalized = s.replace(/[\s-]/g, '_');
        return filterUpper.some(f => {
            const fNormalized = f.replace(/[\s-]/g, '_');
            return f === s || fNormalized === sNormalized || s.includes(f) || f.includes(s);
        });
    };
    // Try cache: Redis first, in-memory as fallback
    const cacheKey = `${ENRICHED_CACHE_KEY_PREFIX}${filterUpper.join(',')}`;
    let cachedData = null;
    try {
        const raw = yield enrichedIndexCache.get(cacheKey);
        if (raw)
            cachedData = JSON.parse(raw);
    }
    catch ( /* Redis unavailable, try in-memory */_e) { /* Redis unavailable, try in-memory */ }
    if (!cachedData) {
        const mem = memCache.get(cacheKey);
        if (mem && mem.expiresAt > Date.now())
            cachedData = mem.data;
    }
    if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        res.json({ success: true, data: cachedData });
        return;
    }
    // 1. Load enriched file index
    const files = yield FileUploadRepository_1.fileUploadRepository.findIndex();
    const enriched = yield enrichWithShareLinks(files);
    // 2. Collect unique references with ObjectId validation
    const orderIds = [...new Set(enriched.filter((f) => f.orderId && mongoose_1.default.Types.ObjectId.isValid(f.orderId)).map((f) => f.orderId))];
    const userIds = [...new Set(enriched.filter((f) => !f.taskId && f.userId && mongoose_1.default.Types.ObjectId.isValid(f.userId)).map((f) => f.userId))];
    const allTaskIds = [...new Set(enriched.filter((f) => f.taskId && mongoose_1.default.Types.ObjectId.isValid(f.taskId)).map((f) => f.taskId))];
    // 3. Load all tasks in this queue & all referenced tasks by ID
    const [tasks, taskFileCounts, orders, users, allReferencedTasks] = yield Promise.all([
        Task_1.Task.find({ status: { $in: statusQueryValues }, isDeleted: { $ne: true } })
            .select('title status orderId category')
            .lean(),
        Task_1.Task.aggregate([
            { $match: { status: { $in: statusQueryValues }, isDeleted: { $ne: true } } },
            { $project: { fileCount: { $size: { $ifNull: ['$files', []] } } } },
        ]),
        orderIds.length ? order_model_1.default.find({ _id: { $in: orderIds } }).select('orderStatus userId easyparcelAwb easyparcelBookingStatus awbUrl awbUrlsByFormat').lean() : [],
        userIds.length ? user_model_1.default.find({ _id: { $in: userIds } }).select('name').lean() : [],
        allTaskIds.length ? Task_1.Task.find({ _id: { $in: allTaskIds } }).select('title status orderId category isDeleted').lean() : [],
    ]);
    const taskMap = new Map(tasks.map((t) => [t._id.toString(), t]));
    const allTaskMap = new Map(allReferencedTasks.map((t) => [t._id.toString(), t]));
    const taskFileCountMap = new Map(taskFileCounts.map((t) => [t._id.toString(), t.fileCount || 0]));
    const orderMap = new Map(orders.map((o) => [o._id.toString(), o]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    // 4. Group files
    const groups = {};
    for (const file of enriched) {
        let groupKey;
        let folderName;
        let isTask = false;
        if (file.taskId) {
            const task = allTaskMap.get(file.taskId) || taskMap.get(file.taskId);
            if (task) {
                // Task is soft-deleted — hide its files entirely until the task is
                // permanently deleted (when FileUpload records are removed too).
                if (task.isDeleted)
                    continue;
                if (!matchesStatus(task.status)) {
                    // Task status does not match requested queue filter — skip file
                    continue;
                }
                groupKey = `task:${file.taskId}`;
                folderName = task.title;
                isTask = true;
            }
            else {
                if (file.orderId) {
                    const order = orderMap.get(file.orderId);
                    if (order && !matchesStatus(order.orderStatus))
                        continue;
                }
                groupKey = file.orderId ? `order:${file.orderId}` : `user:${file.userId}`;
                folderName = file._shareFolderName || ((_b = userMap.get(file.userId)) === null || _b === void 0 ? void 0 : _b.name) || file.userId || 'Unknown';
            }
        }
        else {
            if (file.orderId) {
                const order = orderMap.get(file.orderId);
                if (order && !matchesStatus(order.orderStatus))
                    continue;
            }
            groupKey = file.orderId ? `order:${file.orderId}` : `user:${file.userId}`;
            folderName = file._shareFolderName || ((_c = userMap.get(file.userId)) === null || _c === void 0 ? void 0 : _c.name) || file.userId || 'Unknown';
        }
        if (!groups[groupKey]) {
            groups[groupKey] = {
                folderName,
                orderId: file.orderId || '',
                taskId: file.taskId || '',
                userId: file.userId || '',
                isTask,
                category: isTask ? (_d = taskMap.get(file.taskId)) === null || _d === void 0 ? void 0 : _d.category : file.category,
                files: [],
            };
        }
        groups[groupKey].files.push({
            _id: file._id,
            originalName: file.originalName,
            folderId: file.folderId,
            shareSlug: file.shareSlug,
            category: file.category,
        });
    }
    // 5. Add empty placeholders for tasks that have no files yet
    for (const task of tasks) {
        if (!matchesStatus(task.status))
            continue;
        const key = `task:${task._id}`;
        if (!groups[key]) {
            groups[key] = {
                folderName: task.title,
                orderId: task.orderId || '',
                taskId: task._id.toString(),
                userId: '',
                isTask: true,
                category: task.category,
                files: [],
            };
        }
    }
    // Enrich with orderStatus and derived fields
    const result = Object.values(groups).map((g) => {
        var _a, _b;
        let orderStatus = null;
        let orderAWB = null;
        if (g.taskId)
            orderStatus = ((_a = taskMap.get(g.taskId)) === null || _a === void 0 ? void 0 : _a.status) || null;
        else if (g.orderId)
            orderStatus = ((_b = orderMap.get(g.orderId)) === null || _b === void 0 ? void 0 : _b.orderStatus) || null;
        const taskFileCount = g.taskId ? (taskFileCountMap.get(g.taskId) || 0) : 0;
        const order = g.orderId ? orderMap.get(g.orderId) : null;
        if (order) {
            const awbUrls = order.awbUrlsByFormat || {};
            orderAWB = {
                easyparcelAwb: order.easyparcelAwb || '',
                easyparcelBookingStatus: order.easyparcelBookingStatus || null,
                printUrl: awbUrls.A6 || awbUrls.A4 || order.awbUrl || '',
            };
        }
        return Object.assign(Object.assign({}, g), { orderStatus, orderAWB, fileCount: Math.max(g.files.length, taskFileCount) });
    });
    res.json({ success: true, data: result });
    if (result.length > 0) {
        enrichedIndexCache.set(cacheKey, JSON.stringify(result), ENRICHED_CACHE_TTL).catch(() => { });
        memCache.set(cacheKey, { data: result, expiresAt: Date.now() + ENRICHED_CACHE_TTL * 1000 });
    }
})));
// ─── GET /api/files/by-folder ────────────────────────────────
// Full file details (thumbnails, S3 URLs, etc.) for a single folder, fetched
// only when that folder is actually opened. Pass taskId, or orderId/userId.
router.get('/by-folder', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId, orderId, userId } = req.query;
    if (!taskId && !orderId && !userId) {
        res.status(400).json({ success: false, message: 'taskId, orderId, or userId is required' });
        return;
    }
    const linkFilter = taskId ? { taskId } : orderId ? { orderId } : { userId };
    const links = yield ShareLink_1.ShareLink.find(linkFilter).select('slug').lean();
    const files = yield FileUploadRepository_1.fileUploadRepository.findByFolderKey({
        taskId,
        orderId,
        userId,
        shareSlugs: links.map(link => link.slug),
    });
    const enriched = yield enrichWithShareLinks(files);
    res.json({ success: true, data: enriched });
})));
// ─── GET /api/files/grouped ───────────────────────────────
// Admin: files grouped by customer (Nextcloud folder view)
router.get('/grouped', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
// Admin: create (or reuse) a short, name-based share link for a folder.
router.post('/share-link', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { folderName, taskId, orderId, userId, folderId, audience: requestedAudience } = req.body;
    const audience = requestedAudience || 'CUSTOMER';
    if (!folderName) {
        res.status(400).json({ success: false, message: 'folderName diperlukan' });
        return;
    }
    if (!['CUSTOMER', 'SUPPLIER'].includes(audience)) {
        res.status(400).json({ success: false, message: 'audience mesti CUSTOMER atau SUPPLIER' });
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
        audience,
    });
    res.json({ success: true, data: link });
})));
// ─── PUT /api/files/share-link/:slug ───────────────────────
// Admin: backfill userId on an existing share link if it was created
// before the customer's userId was resolvable (fixes old links).
router.put('/share-link/:slug', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get('/share-links', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const links = yield ShareLink_1.ShareLink.find().sort({ createdAt: -1 });
    res.json({ success: true, data: links });
})));
// ─── DELETE /api/files/share-link/:slug ────────────────────
// Admin: delete a share link (e.g. a stale/ambiguous one)
router.delete('/share-link/:slug', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield ShareLink_1.ShareLink.deleteOne({ slug: req.params.slug });
    res.json({ success: true });
})));
// 🌐 Public: Get files for a specific folder using a short slug
const getShareFileConditions = (link, slug) => {
    const conditions = [{ shareSlug: slug }];
    if (link.folderId)
        conditions.push({ folderId: link.folderId });
    else if (link.taskId)
        conditions.push({ taskId: link.taskId });
    else if (link.orderId)
        conditions.push({ orderId: link.orderId });
    else if (link.userId)
        conditions.push({ userId: link.userId });
    return conditions;
};
const shareAudience = (link) => link.audience === 'SUPPLIER' ? 'SUPPLIER' : 'CUSTOMER';
const getShareFileQuery = (link, slug) => {
    const audience = shareAudience(link);
    const legacyCustomerPortal = audience === 'CUSTOMER' && String(link.folderName || '').startsWith('Artwork Upload:');
    const customerTagConditions = [
        { tag: { $in: ['draft', 'attachment'] } },
        {
            $and: [
                { shareSlug: slug },
                { $or: [{ tag: { $exists: false } }, { tag: null }, { tag: '' }] },
            ],
        },
    ];
    if (legacyCustomerPortal) {
        customerTagConditions.push({ $or: [{ tag: { $exists: false } }, { tag: null }, { tag: '' }] });
    }
    const filters = [
        { $or: getShareFileConditions(link, slug) },
        audience === 'SUPPLIER'
            ? { tag: 'for_print' }
            : { $or: customerTagConditions },
    ];
    if (audience === 'CUSTOMER') {
        filters.push({
            $or: [
                { folderId: { $exists: false } },
                { folderId: null },
                { folderId: '' },
                { folderId: 'null' },
            ],
        });
    }
    return { $and: filters };
};
router.get('/s/:slug/meta', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Share link not found' });
        return;
    }
    res.json({ success: true, folderName: link.folderName });
})));
router.get('/s/:slug', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader('Cache-Control', 'no-store');
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, code: 'SHARE_LINK_NOT_FOUND', message: 'Share link not found' });
        return;
    }
    // Match files 3 ways and merge: by the exact slug stamp (covers every
    // customer upload through this link), and by taskId/orderId (covers
    // files the admin added directly to the folder before sharing it).
    const files = yield FileUpload_1.FileUpload.find(getShareFileQuery(link, req.params.slug))
        .select('_id originalName mimetype size uploadedAt notes tag folderId')
        .sort({ uploadedAt: -1 });
    const audience = shareAudience(link);
    let folders = [];
    if (audience === 'SUPPLIER' && link.taskId) {
        folders = yield VirtualFolder_1.VirtualFolder.find({ taskId: link.taskId }).select('_id name').sort({ name: 1 }).lean();
    }
    res.json({ success: true, data: files, folders, folderName: link.folderName, audience });
})));
// 🌐 Public: Poll real-time progress for an in-flight bulk ZIP download.
// The frontend generates a downloadId, passes it to download-all/download-batch,
// then polls this endpoint every ~500ms to show "Downloading... (3/12)".
router.get('/download-progress/:downloadId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const progress = (0, downloadProgress_1.getDownloadProgress)(req.params.downloadId);
    if (!progress) {
        res.status(404).json({ success: false, message: 'Unknown or expired downloadId' });
        return;
    }
    res.json(Object.assign({ success: true }, progress));
})));
// 🌐 Public: Download all files in a shared folder as a single ZIP
router.get('/s/:slug/download-all', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link not found' });
        return;
    }
    const files = yield FileUpload_1.FileUpload.find(getShareFileQuery(link, req.params.slug)).sort({ uploadedAt: -1 });
    if (!files.length) {
        res.status(404).json({ success: false, message: 'No files found' });
        return;
    }
    const folderName = link.folderName || 'files';
    const downloadId = typeof req.query.downloadId === 'string' ? req.query.downloadId : undefined;
    const result = yield (0, streamFilesAsZip_1.streamFilesAsZip)(res, files.map((f) => ({ originalName: f.originalName, path: f.path })), folderName, downloadId);
    if (!result.success) {
        res.status(502).json({
            success: false,
            message: 'Could not fetch any files for this folder from storage. Please try again or contact support.',
        });
    }
})));
// 🔒 Admin: Download a specific set of files (by id) as a single ZIP.
// Used by Artworks/Production/Packaging "Download folder" buttons instead
// of building the ZIP client-side with JSZip — client-side zipping was
// pulling every file's full bytes into browser memory before assembling
// the archive, which is what caused "array buffer allocation failed" on
// folders with many or large files. This streams server-side instead.
//
// Concurrent download limiter — cap at 5 simultaneous ZIP jobs to prevent
// Node.js from being overwhelmed when multiple folders are downloaded at once.
let activeDownloads = 0;
const MAX_CONCURRENT_DOWNLOADS = 5;
router.post('/download-batch', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fileIds, zipName, downloadId } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        res.status(400).json({ success: false, message: 'fileIds array is required' });
        return;
    }
    if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
        res.status(429).json({ success: false, message: 'Terlalu banyak download serentak. Sila tunggu sebentar dan cuba semula.' });
        return;
    }
    const files = yield FileUpload_1.FileUpload.find({ _id: { $in: fileIds } });
    if (!files.length) {
        res.status(404).json({ success: false, message: 'No files found' });
        return;
    }
    activeDownloads++;
    // Decrement counter when response finishes (whether success, error, or client abort)
    res.on('close', () => { activeDownloads = Math.max(0, activeDownloads - 1); });
    res.on('finish', () => { activeDownloads = Math.max(0, activeDownloads - 1); });
    const result = yield (0, streamFilesAsZip_1.streamFilesAsZip)(res, files.map((f) => ({ originalName: f.originalName, path: f.path })), zipName || 'files', downloadId);
    if (!result.success) {
        res.status(502).json({
            success: false,
            message: 'Could not fetch any files from storage. Please try again or contact support.',
        });
    }
})));
// 🌐 Public: Upload files to a folder using a short slug
const decodeSharedSlug = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link tidak dijumpai' });
        return;
    }
    req.userId = link.userId || 'customer';
    req.taskId = link.taskId;
    req.orderId = link.orderId;
    const requestedFolderId = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.folderId) === 'string' ? req.body.folderId : undefined;
    if (requestedFolderId && shareAudience(link) === 'SUPPLIER') {
        if (!link.taskId || !/^[a-f\d]{24}$/i.test(requestedFolderId)) {
            res.status(400).json({ success: false, message: 'Invalid supplier folder' });
            return;
        }
        const folderExists = yield VirtualFolder_1.VirtualFolder.exists({ _id: requestedFolderId, taskId: link.taskId });
        if (!folderExists) {
            res.status(403).json({ success: false, message: 'Supplier folder is outside this share link' });
            return;
        }
        req.folderId = requestedFolderId;
    }
    else {
        req.folderId = link.folderId;
    }
    req.shareSlug = req.params.slug;
    req.shareAudience = shareAudience(link);
    req.shareTag = shareAudience(link) === 'SUPPLIER' ? 'for_print' : 'attachment';
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
    const safeUsername = username.toString().replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'customer';
    const key = `kampungcetak/customer_uploads/${safeUsername}/${uniqueSuffix}-${safeFilename}`;
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
    const uploadName = `Artwork Upload: #${orderId} - ${username}`;
    // 1. Create a Task for this upload
    const savedTask = yield TaskRepository_1.taskRepository.create({
        title: uploadName,
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
        mimetype: f.mimetype || 'application/octet-stream',
        size: f.size,
        path: f.path,
        taskId: savedTask._id.toString(),
        tag: 'attachment',
        adminReviewed: false,
    })));
    // ── Real-time: broadcast the new task + files to all admin tabs ────────
    (0, taskBroadcast_1.emitTaskUpdated)('task_created', { task: savedTask }).catch(console.error);
    // 3. Create a ShareLink for the customer to view their uploaded files
    const shareLink = yield ShareLinkRepository_1.shareLinkRepository.findOrCreate({
        folderName: uploadName,
        taskId: savedTask._id.toString(),
        orderId: orderId,
        userId: username,
        audience: 'CUSTOMER',
    });
    res.json({ success: true, data: savedFiles, task: savedTask, shareLinkSlug: shareLink.slug });
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
    const { taskId, orderId, userId, folderId, shareCategory, shareSlug, shareTag } = req;
    const savedFiles = yield Promise.all(files.map((f) => FileUploadRepository_1.fileUploadRepository.create({
        userId: userId || 'customer',
        orderId: orderId || undefined,
        taskId: taskId || undefined,
        folderId: folderId || undefined,
        category: shareCategory || 'artwork',
        shareSlug,
        tag: shareTag,
        filename: f.key,
        originalName: f.originalName,
        mimetype: f.mimetype || 'application/octet-stream',
        size: f.size,
        path: f.path,
        adminReviewed: false,
    })));
    res.json({ success: true, data: savedFiles });
})));
router.post('/s/:slug/upload', (0, express_async_handler_1.default)(decodeSharedSlug), upload.array('files', 100), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    const { taskId, orderId, userId, folderId, shareCategory, shareSlug, shareTag } = req;
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
        tag: shareTag,
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
// Public file content, scoped to a valid share slug. This avoids relying on
// private storage URLs that may only appear to work from an admin's cache.
router.get('/s/:slug/files/:id/content', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link not found' });
        return;
    }
    const file = yield FileUpload_1.FileUpload.findOne(Object.assign({ _id: req.params.id }, getShareFileQuery(link, req.params.slug)));
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    const download = req.query.download === 'true';
    const disposition = download ? 'attachment' : 'inline';
    const safeName = file.originalName.replace(/"/g, '\\"');
    res.setHeader('Cache-Control', 'private, max-age=300');
    try {
        if (file.path.includes('amazonaws.com')) {
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
            const urlObj = new URL(file.path);
            const rawKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
            const command = new GetObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: decodeURIComponent(rawKey),
                ResponseContentDisposition: `${disposition}; filename="${safeName}"`,
                ResponseContentType: file.mimetype || 'application/octet-stream',
            });
            const signedUrl = yield getSignedUrl(s3Client, command, { expiresIn: 300 });
            res.redirect(signedUrl);
            return;
        }
        const response = yield fetch(file.path);
        if (!response.ok)
            throw new Error('Failed to fetch file');
        res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
        res.setHeader('Content-Type', file.mimetype || response.headers.get('content-type') || 'application/octet-stream');
        if (!response.body)
            throw new Error('File response has no body');
        const { Readable } = require('stream');
        Readable.fromWeb(response.body).pipe(res);
    }
    catch (err) {
        console.error('[SharedContent] Failed to load file:', err);
        if (!res.headersSent) {
            res.status(502).json({ success: false, message: 'Failed to load file' });
        }
    }
})));
// 🌐 Public: Delete a file from a shared folder (slug acts as auth)
router.delete('/s/:slug/files/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link not found' });
        return;
    }
    const file = yield FileUpload_1.FileUpload.findOne(Object.assign({ _id: req.params.id }, getShareFileQuery(link, req.params.slug)));
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
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
    const link = yield ShareLinkRepository_1.shareLinkRepository.findBySlug(req.params.slug);
    if (!link) {
        res.status(404).json({ success: false, message: 'Link not found' });
        return;
    }
    const file = yield FileUpload_1.FileUpload.findOne(Object.assign({ _id: req.params.id }, getShareFileQuery(link, req.params.slug)));
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
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
// Redirects to an inline, signed URL so image previews work for private S3 files.
router.get('/:id/preview', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    const previewPath = req.query.thumbnail === 'true' && file.thumbnailPath
        ? file.thumbnailPath
        : file.path;
    try {
        if (previewPath.includes('amazonaws.com')) {
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const url = new URL(previewPath);
            const key = decodeURIComponent(url.pathname.replace(/^\//, ''));
            const safeName = file.originalName.replace(/["\\\r\n]/g, '_');
            const command = new GetObjectCommand({
                Bucket: s3_1.S3_BUCKET_NAME,
                Key: key,
                ResponseContentDisposition: `inline; filename="${safeName}"`,
            });
            res.redirect(yield getSignedUrl(s3_1.s3Client, command, { expiresIn: 3600 }));
            return;
        }
    }
    catch (err) {
        console.error('Error creating file preview URL:', err);
    }
    res.redirect(previewPath);
})));
// ─── GET /api/files/:id/info ──────────────────────────────
// Public: returns basic file metadata for share page display (no auth needed)
router.get('/:id/info', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield FileUploadRepository_1.fileUploadRepository.findById(req.params.id);
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    (0, pdfSharePreview_1.warmPdfSharePreview)(file);
    res.json({
        success: true,
        data: {
            id: file._id,
            originalName: file.originalName,
            mimetype: file.mimetype,
            size: file.size,
            createdAt: file.createdAt,
            path: file.path,
            hasThumbnail: Boolean(file.thumbnailPath),
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
// 🟥 PUT /api/files/:id/tag
// Admin changes a file's tag (attachment / draft / for_print / awb)
router.put('/:id/tag', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tag } = req.body;
    const validTags = ['attachment', 'draft', 'for_print', 'awb'];
    if (!tag || !validTags.includes(tag)) {
        res.status(400).json({ success: false, message: 'Tag tidak sah' });
        return;
    }
    const updatedFile = yield FileUpload_1.FileUpload.findByIdAndUpdate(req.params.id, { tag }, { new: true });
    if (!updatedFile) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    // Sync with task if this file is attached to a task
    if (updatedFile.taskId) {
        try {
            yield TaskRepository_1.taskRepository.updateFileTag(updatedFile.taskId, updatedFile.path, tag);
        }
        catch (syncErr) {
            console.error("Failed to sync file tag to task:", syncErr);
        }
    }
    res.json({ success: true, data: updatedFile, message: 'File tag updated successfully' });
})));
// ─── AI AGENT ENDPOINTS ──────────────────────────────────────────────────
router.get('/drafts/pending', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const drafts = yield FileUploadRepository_1.fileUploadRepository.findAll({ search: '' });
        const pending = drafts.filter(d => d.tag === 'draft' && d.botNotified !== true);
        // Batch-load all referenced tasks in one query instead of N+1
        const taskIds = [...new Set(pending.filter(d => d.taskId).map(d => d.taskId))];
        const tasks = taskIds.length > 0
            ? yield Task_1.Task.find({ _id: { $in: taskIds } }).select('description').lean()
            : [];
        const taskMap = new Map(tasks.map((t) => [t._id.toString(), t]));
        const results = [];
        for (const draft of pending) {
            let phone = null;
            if (draft.userId && draft.userId.startsWith('user_')) {
                phone = draft.userId.replace('user_', '');
            }
            else if (draft.taskId) {
                const task = taskMap.get(draft.taskId.toString());
                if (task && task.description && task.description.includes('Phone Number:')) {
                    const match = task.description.match(/Phone Number:\s*(\d+)/);
                    if (match)
                        phone = match[1];
                }
            }
            if (phone) {
                results.push({
                    _id: draft._id,
                    url: draft.path,
                    phone,
                    orderId: draft.orderId
                });
            }
        }
        res.json({ success: true, pending: results });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.post('/drafts/:id/mark-notified', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = yield require('../../domain/entities/FileUpload').FileUpload.findByIdAndUpdate(req.params.id, { $set: { botNotified: true } }, { new: true });
        res.json({ success: true, file });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
exports.default = router;
