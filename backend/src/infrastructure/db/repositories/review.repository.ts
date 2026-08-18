import { Review } from '../../../domain/entities/Review';

/* eslint-disable @typescript-eslint/no-explicit-any */
class ReviewRepository {
  async create(data: { orderId: string; userId: string; productId: string; rating: number; comment?: string; userName?: string }) {
    return Review.create(data);
  }

  async getByOrder(orderId: string): Promise<any> {
    return Review.findOne({ orderId }).lean();
  }

  async getByUser(userId: string): Promise<any[]> {
    return Review.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async getByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total, aggregate] = await Promise.all([
      Review.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments({ productId }),
      Review.aggregate([
        { $match: { productId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);
    return {
      reviews,
      total,
      avgRating: aggregate[0]?.avgRating || 0,
      count: aggregate[0]?.count || 0,
    };
  }

  async hasUserReviewed(orderId: string, userId: string): Promise<boolean> {
    const count = await Review.countDocuments({ orderId, userId });
    return count > 0;
  }

  async getProductAggregate(productId: string): Promise<{ avgRating: number; count: number }> {
    const result = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    return { avgRating: result[0]?.avgRating || 0, count: result[0]?.count || 0 };
  }
}

export default new ReviewRepository();
