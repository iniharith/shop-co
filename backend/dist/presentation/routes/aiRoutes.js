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
 * /api/ai/* endpoints — semantic search, query suggestions, file verification, indexing.
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const order_repository_1 = __importDefault(require("../../infrastructure/db/repositories/order.repository"));
const FileUpload_1 = require("../../domain/entities/FileUpload");
const aiSearchService_1 = require("../../application/ai/aiSearchService");
const aiVerificationService_1 = require("../../application/ai/aiVerificationService");
const aiIndexService_1 = require("../../application/ai/aiIndexService");
const pgVectorStore_1 = require("../../infrastructure/vector/pgVectorStore");
const openaiClient_1 = require("../../infrastructure/ai/openaiClient");
const redis_1 = require("../../infrastructure/redis/redis");
const router = (0, express_1.Router)();
const redisService = new redis_1.RedisService();
const SEARCH_CACHE_PREFIX = 'ai:search:v1:';
const SUGGESTION_CACHE_PREFIX = 'ai:suggest:v1:';
const SEARCH_CACHE_TTL = 120; // seconds
const ADMIN_ROLES = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'];
const isAdminRole = (role) => Boolean(role && ADMIN_ROLES.includes(role));
function parseCollections(value) {
    if (typeof value !== 'string' && !Array.isArray(value))
        return undefined;
    const raw = Array.isArray(value) ? value : [value];
    const valid = new Set(aiSearchService_1.AI_SEARCH_COLLECTIONS);
    const parsed = raw
        .map((c) => String(c).trim())
        .filter((c) => valid.has(c));
    return parsed.length > 0 ? parsed : undefined;
}
// ─── POST /api/ai/search ───────────────────────────────
// Semantic search. Products are public; tasks/files require an admin role.
router.post('/search', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, collections, limit, includeSummary, language } = req.body || {};
    const role = req.role;
    const requested = parseCollections(collections);
    const wantsSensitive = requested
        ? requested.includes('tasks') || requested.includes('files')
        : true;
    let effectiveCollections = requested;
    if (wantsSensitive && !isAdminRole(role)) {
        // Non-admins may only search products semantically.
        const safe = requested ? requested.filter((c) => c === 'products') : ['products'];
        if (safe.length === 0) {
            res.status(403).json({ success: false, message: 'Akses tidak dibenarkan untuk carian ini' });
            return;
        }
        effectiveCollections = safe;
    }
    const q = typeof query === 'string' ? query.trim() : '';
    if (q.length < 2) {
        res.status(400).json({ success: false, message: 'Query sekurang-kurangnya 2 aksara' });
        return;
    }
    if (q.length > 300) {
        res.status(400).json({ success: false, message: 'Query terlalu panjang (maks 300 aksara)' });
        return;
    }
    const cacheKey = SEARCH_CACHE_PREFIX + require('crypto').createHash('sha1').update(q).digest('hex');
    try {
        const cached = yield redisService.get(cacheKey);
        if (cached) {
            res.json(Object.assign({ success: true }, JSON.parse(cached)));
            return;
        }
    }
    catch (err) {
        // Redis down — skip cache
    }
    try {
        const result = yield (0, aiSearchService_1.aiSearch)(q, {
            collections: effectiveCollections,
            limit,
            includeSummary,
            language,
        });
        try {
            yield redisService.set(cacheKey, JSON.stringify(result), SEARCH_CACHE_TTL);
        }
        catch (err) {
            // cache write is best-effort
        }
        res.json(Object.assign({ success: true }, result));
    }
    catch (err) {
        res.status(503).json({
            success: false,
            message: 'Carian AI tidak tersedia buat masa ini. Sila cuba lagi kemudian.',
            fallback: true,
        });
    }
})));
// ─── GET /api/ai/search/suggestions?q= ────────────────
// Lightweight: returns alternate search queries while the user types.
router.get('/search/suggestions', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) {
        res.json({ success: true, suggestions: [] });
        return;
    }
    if (q.length > 120) {
        res.json({ success: true, suggestions: [] });
        return;
    }
    if (!(0, openaiClient_1.aiConfigured)()) {
        res.json({ success: true, suggestions: [] });
        return;
    }
    const cacheKey = SUGGESTION_CACHE_PREFIX + require('crypto').createHash('sha1').update(q).digest('hex');
    try {
        const cached = yield redisService.get(cacheKey);
        if (cached) {
            res.json({ success: true, suggestions: JSON.parse(cached) });
            return;
        }
    }
    catch (err) {
        // skip cache
    }
    try {
        const suggestions = (yield (0, aiSearchService_1.expandSearchQueries)(q)).filter((s) => s.trim().toLowerCase() !== q.trim().toLowerCase());
        try {
            yield redisService.set(cacheKey, JSON.stringify(suggestions), SEARCH_CACHE_TTL);
        }
        catch (err) { }
        res.json({ success: true, suggestions });
    }
    catch (err) {
        res.json({ success: true, suggestions: [] });
    }
})));
// ─── POST /api/ai/verify ───────────────────────────────
// Scans an uploaded file against the linked order/task details.
router.post('/verify', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const authReq = req;
    const { fileId, file, orderId, taskId, notes } = req.body || {};
    const isAdmin = isAdminRole(authReq.role);
    const authenticatedUserId = authReq.userId || ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
    // 1. Resolve the file
    let fileRef = null;
    let resolvedOrderId = orderId;
    let resolvedTaskId = taskId;
    if (fileId) {
        const doc = yield FileUpload_1.FileUpload.findById(fileId).lean();
        if (!doc) {
            res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
            return;
        }
        fileRef = { path: doc.path, originalName: doc.originalName, mimetype: doc.mimetype };
        resolvedOrderId = doc.orderId || resolvedOrderId;
        resolvedTaskId = doc.taskId || resolvedTaskId;
    }
    else if (file && file.path) {
        fileRef = {
            path: file.path,
            originalName: file.originalName || file.name || 'fail',
            mimetype: file.mimetype || file.type || 'application/octet-stream',
        };
    }
    if (!fileRef) {
        res.status(400).json({ success: false, message: 'fileId atau file.path diperlukan' });
        return;
    }
    // 2. Ownership check (mirror save-metadata)
    if (!isAdmin) {
        if (!resolvedOrderId) {
            res.status(403).json({ success: false, message: 'Pesanan diperlukan untuk pengesahan' });
            return;
        }
        const ownerId = yield order_repository_1.default.getOrderOwnerId(resolvedOrderId);
        if (ownerId !== authenticatedUserId) {
            res.status(403).json({ success: false, message: 'Pesanan tidak sah untuk pengguna ini' });
            return;
        }
    }
    const result = yield (0, aiVerificationService_1.verifyUploadedFile)({
        file: fileRef,
        orderId: resolvedOrderId,
        taskId: resolvedTaskId,
        notes,
    });
    res.json(Object.assign({ success: true }, result));
})));
// ─── POST /api/ai/verify/:fileId ───────────────────────
router.post('/verify/:fileId', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authReq = req;
    const isAdmin = isAdminRole(authReq.role);
    const doc = yield FileUpload_1.FileUpload.findById(req.params.fileId).lean();
    if (!doc) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
    }
    if (!isAdmin && doc.userId && doc.userId !== authReq.userId) {
        res.status(403).json({ success: false, message: 'Akses tidak dibenarkan' });
        return;
    }
    const result = yield (0, aiVerificationService_1.verifyFileUploadById)(req.params.fileId);
    res.json(Object.assign({ success: true }, result));
})));
// ─── POST /api/ai/reindex ──────────────────────────────
router.post('/reindex', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)(...ADMIN_ROLES), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield (0, aiIndexService_1.reindexAll)({
        onProgress: (msg) => console.log('[ai] reindex:', msg),
    });
    res.json({ success: true, message: 'Pengindeksan selesai', report });
})));
// ─── GET /api/ai/status ────────────────────────────────
router.get('/status', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)(...ADMIN_ROLES), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const configured = (0, openaiClient_1.aiConfigured)();
    const counts = configured && pgVectorStore_1.pgVectorStore.isConfigured()
        ? yield pgVectorStore_1.pgVectorStore.counts().catch(() => [])
        : [];
    res.json({
        success: true,
        configured,
        vectorDbConfigured: pgVectorStore_1.pgVectorStore.isConfigured(),
        models: {
            gen: process.env.OPENAI_GEN_MODEL || 'gpt-4o-mini',
            embedding: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
            dim: Number(process.env.AI_EMBEDDING_DIM || 1536),
        },
        counts,
    });
})));
exports.default = router;
