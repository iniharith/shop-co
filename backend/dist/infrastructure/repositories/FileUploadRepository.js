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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadRepository = exports.FileUploadRepository = exports.notifyFileClients = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const FileUpload_1 = require("../../domain/entities/FileUpload");
const redis_1 = require("../redis/redis");
const redis_constant_1 = require("../../shared/constants/redis.constant");
const redisService = new redis_1.RedisService();
const FILE_INDEX_CACHE_KEY = 'files:index:v1';
const FILE_STATS_CACHE_KEY = 'files:stats:v1';
const FILE_FOLDER_GROUP_CACHE_PREFIX = 'files:enrichedIndex:';
let fileNotificationTimer = null;
const notifyFileClients = () => {
    if (fileNotificationTimer)
        clearTimeout(fileNotificationTimer);
    fileNotificationTimer = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        fileNotificationTimer = null;
        yield redisService.del(FILE_INDEX_CACHE_KEY);
        yield redisService.del(FILE_STATS_CACHE_KEY);
        // Folder-group responses are keyed by status filters. Clear every
        // variant so the visible file count updates immediately after a change.
        yield redisService.delByPrefix(FILE_FOLDER_GROUP_CACHE_PREFIX);
        yield redisService.publish(redis_constant_1.REDIS_CHANNELS.FILES_UPDATED, JSON.stringify({ action: 'update' }));
    }), 300);
};
exports.notifyFileClients = notifyFileClients;
class FileUploadRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield FileUpload_1.FileUpload.create(data);
            (0, exports.notifyFileClients)();
            return result;
        });
    }
    // Self-healing lookup for share links: the FileUpload record for a given
    // path is normally created at upload time, but if that sync step ever
    // silently failed (network blip, validation error swallowed by a
    // try/catch upstream), the file would have no matching _id and any share
    // link generated for it would 404 forever. This resolves the existing
    // record by path if one exists, or creates it on the spot — so a share
    // link always has a real, working id regardless of what happened at
    // upload time.
    findOrCreateByPath(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield FileUpload_1.FileUpload.findOne({ path: data.path });
            if (existing)
                return existing;
            const created = yield FileUpload_1.FileUpload.create(data);
            (0, exports.notifyFileClients)();
            return created;
        });
    }
    createMany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const identities = data
                .filter((file) => file.userId && file.filename)
                .map((file) => ({ userId: file.userId, filename: file.filename }));
            const existing = identities.length > 0
                ? yield FileUpload_1.FileUpload.find({ $or: identities }).lean()
                : [];
            const byIdentity = new Map(existing.map((file) => [`${file.userId}:${file.filename}`, file]));
            const missingByIdentity = new Map();
            data.forEach((file) => {
                const identity = `${file.userId}:${file.filename}`;
                if (!byIdentity.has(identity))
                    missingByIdentity.set(identity, file);
            });
            const missing = Array.from(missingByIdentity.values());
            if (missing.length > 0) {
                const created = yield FileUpload_1.FileUpload.insertMany(missing);
                created.forEach((file) => byIdentity.set(`${file.userId}:${file.filename}`, file));
                (0, exports.notifyFileClients)();
            }
            return data
                .map((file) => byIdentity.get(`${file.userId}:${file.filename}`))
                .filter((file) => Boolean(file));
        });
    }
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.find({ userId }).sort({ uploadedAt: -1 }).limit(200).lean();
        });
    }
    findByOrderId(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.find({ orderId }).sort({ uploadedAt: -1 });
        });
    }
    findAll(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {};
            if ((filters === null || filters === void 0 ? void 0 : filters.adminReviewed) !== undefined)
                query.adminReviewed = filters.adminReviewed;
            if (filters === null || filters === void 0 ? void 0 : filters.search) {
                query.$or = [
                    { originalName: { $regex: filters.search, $options: 'i' } },
                    { userId: { $regex: filters.search, $options: 'i' } },
                    { orderId: { $regex: filters.search, $options: 'i' } },
                ];
            }
            // Speed optimization: Only load files from the last 30 days by default to prevent massive payloads.
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.uploadedAt = { $gte: thirtyDaysAgo };
            return FileUpload_1.FileUpload.find(query).sort({ uploadedAt: -1 }).lean();
        });
    }
    // Slim, unwindowed listing used to build the folder/task grouping on the
    // Artworks/Production/Packaging manager pages. Only the handful of fields
    // needed for grouping + counting are selected, so this stays cheap to
    // return even across every file ever uploaded (no 30-day cutoff, unlike
    // findAll() above) — the goal is "folder name + item count", not full
    // file records. Actual file details are fetched per-folder, on demand,
    // via findByFolderKey() below once a folder is opened.
    findIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            // Raced against a short timeout — a slow/unhealthy Redis should never
            // meaningfully delay this response, since it's on the hot path for
            // every Artworks/Production/Packaging page load.
            const cached = yield Promise.race([
                redisService.get(FILE_INDEX_CACHE_KEY),
                new Promise((resolve) => setTimeout(() => resolve(null), 150)),
            ]);
            if (cached) {
                try {
                    return JSON.parse(cached);
                }
                catch ( /* rebuild malformed cache */_a) { /* rebuild malformed cache */ }
            }
            const files = yield FileUpload_1.FileUpload.find({}, 'userId orderId taskId category tag shareSlug folderId uploadedAt originalName')
                .sort({ uploadedAt: -1 })
                .maxTimeMS(10000)
                .lean();
            // Fire-and-forget — don't make the caller wait on the cache write.
            redisService.set(FILE_INDEX_CACHE_KEY, JSON.stringify(files), 300).catch(() => { });
            return files;
        });
    }
    // Full file details for a single folder, fetched only when that folder is
    // opened. Already scoped tightly by taskId (or orderId/userId), so there's
    // no need for a date window here — the result set is naturally small.
    findByFolderKey(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = {};
            if (params.taskId) {
                query.taskId = params.taskId;
            }
            else if (params.orderId && params.userId) {
                // Files end up grouped together if they match on EITHER field (the
                // order lookup sometimes falls back from userId to a resolved
                // orderId, or vice versa) — so match either, not both at once.
                query.$or = [{ orderId: params.orderId }, { userId: params.userId }];
            }
            else if (params.orderId) {
                query.orderId = params.orderId;
            }
            else if (params.userId) {
                query.userId = params.userId;
            }
            if (Object.keys(query).length === 0)
                return [];
            return FileUpload_1.FileUpload.find(query).sort({ uploadedAt: -1 }).maxTimeMS(10000).lean();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.findById(id);
        });
    }
    updateFilename(id, originalName) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield FileUpload_1.FileUpload.findByIdAndUpdate(id, { $set: { originalName } }, { new: true });
            (0, exports.notifyFileClients)();
            return result;
        });
    }
    // Re-points a file at the correct customer/order/task — used to fix files
    // uploaded through a share link before its userId was resolved correctly.
    reassign(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = {};
            if (data.userId)
                update.userId = data.userId;
            if (data.orderId)
                update.orderId = data.orderId;
            if (data.taskId)
                update.taskId = data.taskId;
            if (data.category)
                update.category = data.category;
            const result = yield FileUpload_1.FileUpload.findByIdAndUpdate(id, { $set: update }, { new: true });
            (0, exports.notifyFileClients)();
            return result;
        });
    }
    updateAdminReview(id, reviewed, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield FileUpload_1.FileUpload.findByIdAndUpdate(id, { $set: { adminReviewed: reviewed, adminNotes: notes } }, { new: true });
            (0, exports.notifyFileClients)();
            return result;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield FileUpload_1.FileUpload.findByIdAndDelete(id);
            (0, exports.notifyFileClients)();
        });
    }
    getStorageStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = yield Promise.race([
                redisService.get(FILE_STATS_CACHE_KEY),
                new Promise((resolve) => setTimeout(() => resolve(null), 150)),
            ]);
            if (cached) {
                try {
                    return JSON.parse(cached);
                }
                catch ( /* rebuild malformed cache */_a) { /* rebuild malformed cache */ }
            }
            const stats = yield FileUpload_1.FileUpload.aggregate([
                { $match: { /* lightweight — no date filter, full scan */} },
                {
                    $group: {
                        _id: null,
                        totalFiles: { $sum: 1 },
                        totalSize: { $sum: '$size' },
                        pendingReview: {
                            $sum: { $cond: [{ $eq: ['$adminReviewed', false] }, 1, 0] },
                        },
                    },
                },
            ]);
            const result = stats[0] || { totalFiles: 0, totalSize: 0, pendingReview: 0 };
            const output = Object.assign(Object.assign({}, result), { totalSizeMB: (result.totalSize / (1024 * 1024)).toFixed(2) });
            redisService.set(FILE_STATS_CACHE_KEY, JSON.stringify(output), 60).catch(() => { });
            return output;
        });
    }
    getFilesGroupedByUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return FileUpload_1.FileUpload.aggregate([
                {
                    $match: { uploadedAt: { $gte: thirtyDaysAgo } }
                },
                {
                    $group: {
                        _id: '$userId',
                        files: {
                            $push: {
                                _id: '$_id',
                                originalName: '$originalName',
                                mimetype: '$mimetype',
                                size: '$size',
                                uploadedAt: '$uploadedAt',
                                taskId: '$taskId',
                                orderId: '$orderId',
                                category: '$category',
                                tag: '$tag',
                                adminReviewed: '$adminReviewed',
                                adminNotes: '$adminNotes',
                                thumbnailPath: '$thumbnailPath',
                                folderId: '$folderId',
                                shareSlug: '$shareSlug',
                                path: { $substrCP: ['$path', 0, 100] },
                            }
                        },
                        totalFiles: { $sum: 1 },
                        totalSize: { $sum: '$size' },
                        pendingReview: {
                            $sum: { $cond: [{ $eq: ['$adminReviewed', false] }, 1, 0] },
                        },
                        lastUpload: { $max: '$uploadedAt' },
                    },
                },
                { $sort: { lastUpload: -1 } },
            ]);
        });
    }
}
exports.FileUploadRepository = FileUploadRepository;
exports.fileUploadRepository = new FileUploadRepository();
