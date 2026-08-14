/**
 * Coded by Harith
 * Kampungcetak ®
 * /api/ai/* endpoints — semantic search, query suggestions, file verification, indexing.
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import OrderRepository from '../../infrastructure/db/repositories/order.repository';
import { FileUpload } from '../../domain/entities/FileUpload';
import { aiSearch, expandSearchQueries, AI_SEARCH_COLLECTIONS, AiCollection } from '../../application/ai/aiSearchService';
import {
  verifyUploadedFile,
  verifyFileUploadById,
} from '../../application/ai/aiVerificationService';
import { reindexAll, indexFile } from '../../application/ai/aiIndexService';
import { pgVectorStore } from '../../infrastructure/vector/pgVectorStore';
import { aiConfigured } from '../../infrastructure/ai/openaiClient';
import { RedisService } from '../../infrastructure/redis/redis';

const router = Router();
const redisService = new RedisService();
const SEARCH_CACHE_PREFIX = 'ai:search:v1:';
const SUGGESTION_CACHE_PREFIX = 'ai:suggest:v1:';
const SEARCH_CACHE_TTL = 120; // seconds

const ADMIN_ROLES = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'];

const isAdminRole = (role: string | undefined) => Boolean(role && ADMIN_ROLES.includes(role));

function parseCollections(value: unknown): AiCollection[] | undefined {
  if (typeof value !== 'string' && !Array.isArray(value)) return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const valid = new Set<string>(AI_SEARCH_COLLECTIONS as readonly string[]);
  const parsed = raw
    .map((c) => String(c).trim())
    .filter((c) => valid.has(c));
  return parsed.length > 0 ? (parsed as AiCollection[]) : undefined;
}

// ─── POST /api/ai/search ───────────────────────────────
// Semantic search. Products are public; tasks/files require an admin role.
router.post(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { query, collections, limit, includeSummary, language } = req.body || {};
    const role = (req as any).role as string | undefined;
    const requested = parseCollections(collections);
    const wantsSensitive = requested
      ? requested.includes('tasks') || requested.includes('files')
      : true;

    let effectiveCollections: AiCollection[] | undefined = requested;
    if (wantsSensitive && !isAdminRole(role)) {
      // Non-admins may only search products semantically.
      const safe: AiCollection[] = requested ? requested.filter((c) => c === 'products') : ['products'];
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
      const cached = await redisService.get(cacheKey);
      if (cached) {
        res.json({ success: true, ...JSON.parse(cached) });
        return;
      }
    } catch (err) {
      // Redis down — skip cache
    }

    try {
      const result = await aiSearch(q, {
        collections: effectiveCollections,
        limit,
        includeSummary,
        language,
      });
      try {
        await redisService.set(cacheKey, JSON.stringify(result), SEARCH_CACHE_TTL);
      } catch (err) {
        // cache write is best-effort
      }
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(503).json({
        success: false,
        message: 'Carian AI tidak tersedia buat masa ini. Sila cuba lagi kemudian.',
        fallback: true,
      });
    }
  })
);

// ─── GET /api/ai/search/suggestions?q= ────────────────
// Lightweight: returns alternate search queries while the user types.
router.get(
  '/search/suggestions',
  asyncHandler(async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) {
      res.json({ success: true, suggestions: [] });
      return;
    }
    if (q.length > 120) {
      res.json({ success: true, suggestions: [] });
      return;
    }
    if (!aiConfigured()) {
      res.json({ success: true, suggestions: [] });
      return;
    }

    const cacheKey = SUGGESTION_CACHE_PREFIX + require('crypto').createHash('sha1').update(q).digest('hex');
    try {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        res.json({ success: true, suggestions: JSON.parse(cached) });
        return;
      }
    } catch (err) {
      // skip cache
    }

    try {
      const suggestions = (await expandSearchQueries(q)).filter((s) => s.trim().toLowerCase() !== q.trim().toLowerCase());
      try {
        await redisService.set(cacheKey, JSON.stringify(suggestions), SEARCH_CACHE_TTL);
      } catch (err) {}
      res.json({ success: true, suggestions });
    } catch (err) {
      res.json({ success: true, suggestions: [] });
    }
  })
);

// ─── POST /api/ai/verify ───────────────────────────────
// Scans an uploaded file against the linked order/task details.
router.post(
  '/verify',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const { fileId, file, orderId, taskId, notes } = req.body || {};
    const isAdmin = isAdminRole(authReq.role);
    const authenticatedUserId = authReq.userId || authReq.user?._id?.toString() || authReq.user?.id;

    // 1. Resolve the file
    let fileRef: { path: string; originalName: string; mimetype: string } | null = null;
    let resolvedOrderId = orderId as string | undefined;
    let resolvedTaskId = taskId as string | undefined;

    if (fileId) {
      const doc = await FileUpload.findById(fileId).lean();
      if (!doc) {
        res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
        return;
      }
      fileRef = { path: doc.path, originalName: doc.originalName, mimetype: doc.mimetype };
      resolvedOrderId = doc.orderId || resolvedOrderId;
      resolvedTaskId = doc.taskId || resolvedTaskId;
    } else if (file && file.path) {
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
      const ownerId = await OrderRepository.getOrderOwnerId(resolvedOrderId);
      if (ownerId !== authenticatedUserId) {
        res.status(403).json({ success: false, message: 'Pesanan tidak sah untuk pengguna ini' });
        return;
      }
    }

    const result = await verifyUploadedFile({
      file: fileRef,
      orderId: resolvedOrderId,
      taskId: resolvedTaskId,
      notes,
    });

    res.json({ success: true, ...result });
  })
);

// ─── POST /api/ai/verify/:fileId ───────────────────────
router.post(
  '/verify/:fileId',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const isAdmin = isAdminRole(authReq.role);
    const doc = await FileUpload.findById(req.params.fileId).lean();
    if (!doc) {
      res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
      return;
    }
    if (!isAdmin && doc.userId && doc.userId !== authReq.userId) {
      res.status(403).json({ success: false, message: 'Akses tidak dibenarkan' });
      return;
    }
    const result = await verifyFileUploadById(req.params.fileId);
    res.json({ success: true, ...result });
  })
);

// ─── POST /api/ai/reindex ──────────────────────────────
router.post(
  '/reindex',
  authMiddilware,
  authorizeRoles(...ADMIN_ROLES),
  asyncHandler(async (req: Request, res: Response) => {
    const report = await reindexAll({
      onProgress: (msg) => console.log('[ai] reindex:', msg),
    });
    res.json({ success: true, message: 'Pengindeksan selesai', report });
  })
);

// ─── GET /api/ai/status ────────────────────────────────
router.get(
  '/status',
  authMiddilware,
  authorizeRoles(...ADMIN_ROLES),
  asyncHandler(async (_req: Request, res: Response) => {
    const configured = aiConfigured();
    const counts = configured && pgVectorStore.isConfigured()
      ? await pgVectorStore.counts().catch(() => [])
      : [];
    res.json({
      success: true,
      configured,
      vectorDbConfigured: pgVectorStore.isConfigured(),
      models: {
        gen: process.env.OPENAI_GEN_MODEL || 'gpt-4o-mini',
        embedding: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        dim: Number(process.env.AI_EMBEDDING_DIM || 1536),
      },
      counts,
    });
  })
);

export default router;
