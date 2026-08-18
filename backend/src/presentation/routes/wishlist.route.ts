import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import wishlistController from '../controllers/wishlist.controller';
import authMiddilware from '../middlewares/auth.middileware';

const router = Router();

router.post('/:productId', authMiddilware, asyncHandler(wishlistController.addToWishlist.bind(wishlistController)));
router.delete('/:productId', authMiddilware, asyncHandler(wishlistController.removeFromWishlist.bind(wishlistController)));
router.get('/', authMiddilware, asyncHandler(wishlistController.getWishlist.bind(wishlistController)));
router.get('/check/:productId', authMiddilware, asyncHandler(wishlistController.checkWishlist.bind(wishlistController)));

export default router;
