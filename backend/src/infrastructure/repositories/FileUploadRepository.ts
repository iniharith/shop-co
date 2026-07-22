/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { FileUpload, IFileUpload } from '../../domain/entities/FileUpload';
import { RedisService } from '../redis/redis';
import { REDIS_CHANNELS } from '../../shared/constants/redis.constant';

const redisService = new RedisService();
const FILE_INDEX_CACHE_KEY = 'files:index:v1';
let fileNotificationTimer: ReturnType<typeof setTimeout> | null = null;
export const notifyFileClients = () => {
  if (fileNotificationTimer) clearTimeout(fileNotificationTimer);
  fileNotificationTimer = setTimeout(async () => {
    fileNotificationTimer = null;
    await redisService.del(FILE_INDEX_CACHE_KEY);
    await redisService.publish(REDIS_CHANNELS.FILES_UPDATED, JSON.stringify({ action: 'update' }));
  }, 300);
};

export class FileUploadRepository {
  async create(data: Partial<IFileUpload>): Promise<IFileUpload> {
    const result = await FileUpload.create(data);
    notifyFileClients();
    return result;
  }

  async findByUserId(userId: string): Promise<IFileUpload[]> {
    return FileUpload.find({ userId }).sort({ uploadedAt: -1 }).limit(200).lean() as unknown as Promise<IFileUpload[]>;
  }

  async findByOrderId(orderId: string): Promise<IFileUpload[]> {
    return FileUpload.find({ orderId }).sort({ uploadedAt: -1 });
  }

  async findAll(filters?: { adminReviewed?: boolean; search?: string }): Promise<IFileUpload[]> {
    const query: any = {};
    if (filters?.adminReviewed !== undefined) query.adminReviewed = filters.adminReviewed;
    if (filters?.search) {
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

    return FileUpload.find(query).sort({ uploadedAt: -1 }).lean() as unknown as Promise<IFileUpload[]>;
  }

  // Slim, unwindowed listing used to build the folder/task grouping on the
  // Artworks/Production/Packaging manager pages. Only the handful of fields
  // needed for grouping + counting are selected, so this stays cheap to
  // return even across every file ever uploaded (no 30-day cutoff, unlike
  // findAll() above) — the goal is "folder name + item count", not full
  // file records. Actual file details are fetched per-folder, on demand,
  // via findByFolderKey() below once a folder is opened.
  async findIndex(): Promise<Pick<IFileUpload, 'userId' | 'orderId' | 'taskId' | 'category' | 'tag' | 'shareSlug' | 'folderId' | 'uploadedAt' | 'originalName'>[]> {
    const cached = await redisService.get(FILE_INDEX_CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* rebuild malformed cache */ }
    }
    const files = await FileUpload.find({}, 'userId orderId taskId category tag shareSlug folderId uploadedAt originalName')
      .sort({ uploadedAt: -1 })
      .maxTimeMS(10_000)
      .lean() as unknown as any[];
    await redisService.set(FILE_INDEX_CACHE_KEY, JSON.stringify(files), 30);
    return files;
  }

  // Full file details for a single folder, fetched only when that folder is
  // opened. Already scoped tightly by taskId (or orderId/userId), so there's
  // no need for a date window here — the result set is naturally small.
  async findByFolderKey(params: { taskId?: string; orderId?: string; userId?: string }): Promise<IFileUpload[]> {
    let query: any = {};
    if (params.taskId) {
      query.taskId = params.taskId;
    } else if (params.orderId && params.userId) {
      // Files end up grouped together if they match on EITHER field (the
      // order lookup sometimes falls back from userId to a resolved
      // orderId, or vice versa) — so match either, not both at once.
      query.$or = [{ orderId: params.orderId }, { userId: params.userId }];
    } else if (params.orderId) {
      query.orderId = params.orderId;
    } else if (params.userId) {
      query.userId = params.userId;
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
    const stats = await FileUpload.aggregate([
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
    return {
      ...result,
      totalSizeMB: (result.totalSize / (1024 * 1024)).toFixed(2),
    };
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
          files: { $push: '$$ROOT' },
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
