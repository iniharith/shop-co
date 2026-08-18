import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import reviewController from '../controllers/review.controller';
import authMiddilware from '../middlewares/auth.middileware';

const router = Router();

router.post('/', authMiddilware, asyncHandler(reviewController.submitReview.bind(reviewController)));
router.get('/order/:orderId', authMiddilware, asyncHandler(reviewController.getOrderReview.bind(reviewController)));
router.get('/product/:productId', asyncHandler(reviewController.getProductReviews.bind(reviewController)));

export default router;
