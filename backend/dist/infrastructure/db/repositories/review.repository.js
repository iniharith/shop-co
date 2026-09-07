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
Object.defineProperty(exports, "__esModule", { value: true });
const Review_1 = require("../../../domain/entities/Review");
/* eslint-disable @typescript-eslint/no-explicit-any */
class ReviewRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Review_1.Review.create(data);
        });
    }
    getByOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Review_1.Review.findOne({ orderId }).lean();
        });
    }
    getByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Review_1.Review.find({ userId }).sort({ createdAt: -1 }).lean();
        });
    }
    getByProduct(productId_1) {
        return __awaiter(this, arguments, void 0, function* (productId, page = 1, limit = 10) {
            var _a, _b;
            const skip = (page - 1) * limit;
            const [reviews, total, aggregate] = yield Promise.all([
                Review_1.Review.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                Review_1.Review.countDocuments({ productId }),
                Review_1.Review.aggregate([
                    { $match: { productId } },
                    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
                ]),
            ]);
            return {
                reviews,
                total,
                avgRating: ((_a = aggregate[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0,
                count: ((_b = aggregate[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
            };
        });
    }
    hasUserReviewed(orderId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield Review_1.Review.countDocuments({ orderId, userId });
            return count > 0;
        });
    }
    getProductAggregate(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const result = yield Review_1.Review.aggregate([
                { $match: { productId } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
            ]);
            return { avgRating: ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0, count: ((_b = result[0]) === null || _b === void 0 ? void 0 : _b.count) || 0 };
        });
    }
}
exports.default = new ReviewRepository();
