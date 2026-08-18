import { Request, Response, NextFunction } from 'express';
import { statusCodes } from '../../shared/constants/api.constant';
import reviewRepository from '../../infrastructure/db/repositories/review.repository';
import orderSchema from '../../infrastructure/db/models/order.model';
import productSchema from '../../infrastructure/db/models/product.model';
import { AuthRequest } from '../../domain/types/api';

export class ReviewController {
  async submitReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId, productId, rating, comment } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!orderId || !productId || !rating) {
        res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'orderId, productId, and rating are required' });
        return;
      }

      if (rating < 1 || rating > 5) {
        res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'Rating must be between 1 and 5' });
        return;
      }

      const order = await orderSchema.findOne({ _id: orderId, userId }).lean();
      if (!order) {
        res.status(statusCodes.NOT_FOUND).json({ success: false, message: 'Order not found' });
        return;
      }

      if (order.orderStatus !== 'DELIVERED') {
        res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'Can only review delivered orders' });
        return;
      }

      const alreadyReviewed = await reviewRepository.hasUserReviewed(orderId, userId);
      if (alreadyReviewed) {
        res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'You have already reviewed this order' });
        return;
      }

      const user = (req as any).user;
      const review = await reviewRepository.create({
        orderId,
        userId,
        productId,
        rating,
        comment: comment || '',
        userName: user?.name || 'Customer',
      });

      const { avgRating, count } = await reviewRepository.getProductAggregate(productId);
      await productSchema.findByIdAndUpdate(productId, { averageRating: avgRating, reviewCount: count });

      res.status(statusCodes.CREATED).json({ success: true, review });
    } catch (error) {
      next(error);
    }
  }

  async getOrderReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.userId;
      if (!userId) {
        res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const review = await reviewRepository.getByOrder(orderId);
      res.json({ success: true, review });
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
      const result = await reviewRepository.getByProduct(productId, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
