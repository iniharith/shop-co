"use strict";
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
exports.ReviewController = void 0;
const api_constant_1 = require("../../shared/constants/api.constant");
const review_repository_1 = __importDefault(require("../../infrastructure/db/repositories/review.repository"));
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
class ReviewController {
    submitReview(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId, productId, rating, comment } = req.body;
                const userId = req.userId;
                if (!userId) {
                    res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
                    return;
                }
                if (!orderId || !productId || !rating) {
                    res.status(api_constant_1.statusCodes.BAD_REQUEST).json({ success: false, message: 'orderId, productId, and rating are required' });
                    return;
                }
                if (rating < 1 || rating > 5) {
                    res.status(api_constant_1.statusCodes.BAD_REQUEST).json({ success: false, message: 'Rating must be between 1 and 5' });
                    return;
                }
                const order = yield order_model_1.default.findOne({ _id: orderId, userId }).lean();
                if (!order) {
                    res.status(api_constant_1.statusCodes.NOT_FOUND).json({ success: false, message: 'Order not found' });
                    return;
                }
                if (order.orderStatus !== 'DELIVERED') {
                    res.status(api_constant_1.statusCodes.BAD_REQUEST).json({ success: false, message: 'Can only review delivered orders' });
                    return;
                }
                const alreadyReviewed = yield review_repository_1.default.hasUserReviewed(orderId, userId);
                if (alreadyReviewed) {
                    res.status(api_constant_1.statusCodes.BAD_REQUEST).json({ success: false, message: 'You have already reviewed this order' });
                    return;
                }
                const user = req.user;
                const review = yield review_repository_1.default.create({
                    orderId,
                    userId,
                    productId,
                    rating,
                    comment: comment || '',
                    userName: (user === null || user === void 0 ? void 0 : user.name) || 'Customer',
                });
                const { avgRating, count } = yield review_repository_1.default.getProductAggregate(productId);
                yield product_model_1.default.findByIdAndUpdate(productId, { averageRating: avgRating, reviewCount: count });
                res.status(api_constant_1.statusCodes.CREATED).json({ success: true, review });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getOrderReview(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const userId = req.userId;
                if (!userId) {
                    res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
                    return;
                }
                const review = yield review_repository_1.default.getByOrder(orderId);
                res.json({ success: true, review });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getProductReviews(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productId } = req.params;
                const page = Math.max(Number(req.query.page) || 1, 1);
                const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
                const result = yield review_repository_1.default.getByProduct(productId, page, limit);
                res.json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.ReviewController = ReviewController;
exports.default = new ReviewController();
