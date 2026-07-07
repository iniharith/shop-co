/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { FileUpload, IFileUpload } from '../../domain/entities/FileUpload';

export class FileUploadRepository {
  async create(data: Partial<IFileUpload>): Promise<IFileUpload> {
    return FileUpload.create(data);
  }

  async findByUserId(userId: string): Promise<IFileUpload[]> {
    return FileUpload.find({ userId }).sort({ uploadedAt: -1 });
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

  async findById(id: string): Promise<IFileUpload | null> {
    return FileUpload.findById(id);
  }

  async updateFilename(id: string, originalName: string): Promise<IFileUpload | null> {
    return FileUpload.findByIdAndUpdate(
      id,
      { $set: { originalName } },
      { new: true }
    );
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
    return FileUpload.findByIdAndUpdate(id, { $set: update }, { new: true });
  }

  async updateAdminReview(
    id: string,
    reviewed: boolean,
    notes?: string
  ): Promise<IFileUpload | null> {
    return FileUpload.findByIdAndUpdate(
      id,
      { $set: { adminReviewed: reviewed, adminNotes: notes } },
      { new: true }
    );
  }

  async delete(id: string): Promise<void> {
    await FileUpload.findByIdAndDelete(id);
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
