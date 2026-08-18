import { Request, Response, NextFunction } from 'express';
import { statusCodes } from '../../shared/constants/api.constant';
import wishlistRepository from '../../infrastructure/db/repositories/wishlist.repository';
import { AuthRequest } from '../../domain/types/api';

export class WishlistController {
  async addToWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { productId } = req.params;
      if (!productId) {
        res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'productId is required' });
        return;
      }
      await wishlistRepository.add(userId, productId);
      res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
      next(error);
    }
  }

  async removeFromWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { productId } = req.params;
      await wishlistRepository.remove(userId, productId);
      res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
      next(error);
    }
  }

  async getWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const items = await wishlistRepository.getByUser(userId);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async checkWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { productId } = req.params;
      const isFavorited = await wishlistRepository.isFavorited(userId, productId);
      res.json({ success: true, isFavorited });
    } catch (error) {
      next(error);
    }
  }
}

export default new WishlistController();
