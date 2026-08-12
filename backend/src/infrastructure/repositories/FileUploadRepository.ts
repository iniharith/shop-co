/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { FileUpload, IFileUpload } from '../../domain/entities/FileUpload';
import { RedisService } from '../redis/redis';
import { REDIS_CHANNELS } from '../../shared/constants/redis.constant';
import { getAdminNamespace } from '../socket/socketRegistry';
import { warmPdfSharePreview } from '../../shared/utils/pdfSharePreview';

const redisService = new RedisService();
const FILE_INDEX_CACHE_KEY = 'files:index:v1';
const FILE_STATS_CACHE_KEY = 'files:stats:v1';
const FILE_FOLDER_GROUP_CACHE_PREFIX = 'files:enrichedIndex:';
// In-memory fallback for the slim file index — survives Redis outages and
// avoids re-scanning the whole collection on every page load. Kept short
// (and cleared alongside the Redis keys) so it never serves stale counts.
const FILE_INDEX_MEM_TTL = 120_000;
const fileIndexMemCache = new Map<string, { data: any[]; expiresAt: number }>();
let fileNotificationTimer: ReturnType<typeof setTimeout> | null = null;
export const notifyFileClients = () => {
  if (fileNotificationTimer) clearTimeout(fileNotificationTimer);
  fileNotificationTimer = setTimeout(async () => {
    fileNotificationTimer = null;
    fileIndexMemCache.clear();
    await redisService.del(FILE_INDEX_CACHE_KEY);
    await redisService.del(FILE_STATS_CACHE_KEY);
    // Folder-group responses are keyed by status filters. Clear every
    // variant so the visible file count updates immediately after a change.
    await redisService.delByPrefix(FILE_FOLDER_GROUP_CACHE_PREFIX);
    const message = { action: 'update' as const };
    const adminNamespace = getAdminNamespace();
    if (adminNamespace) {
      try {
        adminNamespace.emit('files_updated', message);
      } catch (e) {
        console.error('Failed to emit files socket event locally:', e);
      }
    }
    await redisService.publish(REDIS_CHANNELS.FILES_UPDATED, JSON.stringify(message));
  }, 300);
};

export class FileUploadRepository {
  async create(data: Partial<IFileUpload>): Promise<IFileUpload> {
    const result = await FileUpload.create(data);
    warmPdfSharePreview(result);
    notifyFileClients();
    return result;
  }

  // Self-healing lookup for share links: the FileUpload record for a given
  // path is normally created at upload time, but if that sync step ever
  // silently failed (network blip, validation error swallowed by a
  // try/catch upstream), the file would have no matching _id and any share
  // link generated for it would 404 forever. This resolves the existing
  // record by path if one exists, or creates it on the spot — so a share
  // link always has a real, working id regardless of what happened at
  // upload time.
  async findOrCreateByPath(data: Partial<IFileUpload> & { path: string }): Promise<IFileUpload> {
    const existing = await FileUpload.findOne({ path: data.path });
    if (existing) {
      warmPdfSharePreview(existing);
      return existing;
    }
    const created = await FileUpload.create(data);
    warmPdfSharePreview(created);
    notifyFileClients();
    return created;
  }

  async createMany(data: Partial<IFileUpload>[]): Promise<IFileUpload[]> {
    const identities = data
      .filter((file) => file.userId && file.filename)
      .map((file) => ({ userId: file.userId, filename: file.filename }));
    const existing = identities.length > 0
      ? await FileUpload.find({ $or: identities }).lean()
      : [];
    const byIdentity = new Map(
      existing.map((file) => [`${file.userId}:${file.filename}`, file as unknown as IFileUpload])
    );
    const missingByIdentity = new Map<string, Partial<IFileUpload>>();

    data.forEach((file) => {
      const identity = `${file.userId}:${file.filename}`;
      if (!byIdentity.has(identity)) missingByIdentity.set(identity, file);
    });

    const missing = Array.from(missingByIdentity.values());
    if (missing.length > 0) {
      const created = await FileUpload.insertMany(missing);
      created.forEach((file) => byIdentity.set(`${file.userId}:${file.filename}`, file as unknown as IFileUpload));
      notifyFileClients();
    }

    const result = data
      .map((file) => byIdentity.get(`${file.userId}:${file.filename}`))
      .filter((file): file is IFileUpload => Boolean(file));
    result.forEach(warmPdfSharePreview);
    return result;
  }

  async findByUserId(userId: string): Promise<IFileUpload[]> {
    return FileUpload.find({ userId }).sort({ uploadedAt: -1 }).limit(200).lean() as unknown as Promise<IFileUpload[]>;
  }

  async findByOrderId(orderId: string): Promise<IFileUpload[]> {
    return FileUpload.find({ orderId }).sort({ uploadedAt: -1 });
  }

  async findAll(filters?: { adminReviewed?: boolean; search?: string; taskIds?: string[]; limit?: number }): Promise<IFileUpload[]> {
    const query: any = {};
    if (filters?.adminReviewed !== undefined) query.adminReviewed = filters.adminReviewed;
    if (filters?.search) {
      const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { originalName: { $regex: escapedSearch, $options: 'i' } },
        { filename: { $regex: escapedSearch, $options: 'i' } },
        { userId: { $regex: escapedSearch, $options: 'i' } },
        { orderId: { $regex: escapedSearch, $options: 'i' } },
      ];
      if (filters.taskIds?.length) query.$or.push({ taskId: { $in: filters.taskIds } });
    }
    
    // Speed optimization: Only load files from the last 30 days by default to prevent massive payloads.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.uploadedAt = { $gte: thirtyDaysAgo };

    const limit = filters?.limit ? Math.min(Math.max(filters.limit, 1), 500) : 0;
    return FileUpload.find(query).sort({ uploadedAt: -1 }).limit(limit).lean() as unknown as Promise<IFileUpload[]>;
  }

  // Slim, unwindowed listing used to build the folder/task grouping on the
  // Artworks/Production/Packaging manager pages. Only the handful of fields
  // needed for grouping + counting are selected, so this stays cheap to
  // return even across every file ever uploaded (no 30-day cutoff, unlike
  // findAll() above) — the goal is "folder name + item count", not full
  // file records. Actual file details are fetched per-folder, on demand,
  // via findByFolderKey() below once a folder is opened.
  async findIndex(): Promise<Pick<IFileUpload, 'userId' | 'orderId' | 'taskId' | 'category' | 'tag' | 'shareSlug' | 'folderId' | 'uploadedAt' | 'originalName'>[]> {
    // In-memory fallback first — instant, and survives Redis outages.
    const now = Date.now();
    const memHit = fileIndexMemCache.get('index');
    if (memHit && memHit.expiresAt > now) return memHit.data;
    // Raced against a short timeout — a slow/unhealthy Redis should never
    // meaningfully delay this response, since it's on the hot path for
    // every Artworks/Production/Packaging page load.
    const cached = await Promise.race([
      redisService.get(FILE_INDEX_CACHE_KEY),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 150)),
    ]);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        fileIndexMemCache.set('index', { data, expiresAt: now + FILE_INDEX_MEM_TTL });
        return data;
      } catch { /* rebuild malformed cache */ }
    }
    const files = await FileUpload.find({}, 'userId orderId taskId category tag shareSlug folderId uploadedAt originalName')
      .sort({ uploadedAt: -1 })
      .maxTimeMS(10_000)
      .lean() as unknown as any[];
    // Fire-and-forget — don't make the caller wait on the cache write.
    fileIndexMemCache.set('index', { data: files, expiresAt: now + FILE_INDEX_MEM_TTL });
    redisService.set(FILE_INDEX_CACHE_KEY, JSON.stringify(files), 300).catch(() => {});
    return files;
  }

  // Full file details for a single folder, fetched only when that folder is
  // opened. Already scoped tightly by taskId (or orderId/userId), so there's
  // no need for a date window here — the result set is naturally small.
  async findByFolderKey(params: { taskId?: string; orderId?: string; userId?: string; shareSlugs?: string[] }): Promise<IFileUpload[]> {
    let query: any = {};
    const shareSlugMatch = (identityField: 'taskId' | 'orderId' | 'userId') => params.shareSlugs?.length ? {
      shareSlug: { $in: params.shareSlugs },
      $or: [
        { [identityField]: { $exists: false } },
        { [identityField]: null },
        { [identityField]: '' },
      ],
    } : null;
    if (params.taskId) {
      const fallback = shareSlugMatch('taskId');
      query = fallback ? { $or: [{ taskId: params.taskId }, fallback] } : { taskId: params.taskId };
    } else if (params.orderId) {
      const fallback = shareSlugMatch('orderId');
      query = fallback ? { $or: [{ orderId: params.orderId }, fallback] } : { orderId: params.orderId };
    } else if (params.userId) {
      const fallback = shareSlugMatch('userId');
      query = fallback ? { $or: [{ userId: params.userId }, fallback] } : { userId: params.userId };
    }
    if (Object.keys(query).length === 0) return [];
    return FileUpload.find(query).sort({ uploadedAt: -1 }).maxTimeMS(10_000).lean() as unknown as Promise<IFileUpload[]>;
  }

  async findById(id: string): Promise<IFileUpload | null> {
    return FileUpload.findById(id);
  }

  async updateFilename(id: string, originalName: string): Promise<IFileUpload | null> {
    const result = await FileUpload.findByIdAndUpdate(
      id,
      { $set: { originalName } },
      { new: true }
    );
    notifyFileClients();
    return result;
  }

  // Re-points a file at the correct customer/order/task — used to fix files
  // uploaded through a share link before its userId was resolved correctly.
  async reassign(
    id: string,
    data: { userId?: string; orderId?: string; taskId?: string; category?: string }
  ): Promise<IFileUpload | null> {
    const update: any = {};
    if (data.userId) update.userId = data.userId;
    if (data.orderId) update.orderId = data.orderId;
    if (data.taskId) update.taskId = data.taskId;
    if (data.category) update.category = data.category;
    const result = await FileUpload.findByIdAndUpdate(id, { $set: update }, { new: true });
    notifyFileClients();
    return result;
  }

  async updateAdminReview(
    id: string,
    reviewed: boolean,
    notes?: string
  ): Promise<IFileUpload | null> {
    const result = await FileUpload.findByIdAndUpdate(
      id,
      { $set: { adminReviewed: reviewed, adminNotes: notes } },
      { new: true }
    );
    notifyFileClients();
    return result;
  }

  async delete(id: string): Promise<void> {
    await FileUpload.findByIdAndDelete(id);
    notifyFileClients();
  }

  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    pendingReview: number;
    totalSizeMB: string;
  }> {
    const cached = await Promise.race([
      redisService.get(FILE_STATS_CACHE_KEY),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 150)),
    ]);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* rebuild malformed cache */ }
    }

    const stats = await FileUpload.aggregate([
      { $match: { /* lightweight — no date filter, full scan */ } },
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
    const output = {
      ...result,
      totalSizeMB: (result.totalSize / (1024 * 1024)).toFixed(2),
    };
    redisService.set(FILE_STATS_CACHE_KEY, JSON.stringify(output), 60).catch(() => {});
    return output;
  }

  async getFilesGroupedByUser(): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return FileUpload.aggregate([
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
  }
}

export const fileUploadRepository = new FileUploadRepository();
