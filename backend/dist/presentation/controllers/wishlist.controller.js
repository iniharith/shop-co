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
exports.WishlistController = void 0;
const api_constant_1 = require("../../shared/constants/api.constant");
const wishlist_repository_1 = __importDefault(require("../../infrastructure/db/repositories/wishlist.repository"));
class WishlistController {
    addToWishlist(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
                    return;
                }
                const { productId } = req.params;
                if (!productId) {
                    res.status(api_constant_1.statusCodes.BAD_REQUEST).json({ success: false, message: 'productId is required' });
                    return;
                }
                yield wishlist_repository_1.default.add(userId, productId);
                res.json({ success: true, message: 'Added to wishlist' });
            }
            catch (error) {
                next(error);
            }
        });
    }
    removeFromWishlist(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
                    return;
                }
                const { productId } = req.params;
                yield wishlist_repository_1.default.remove(userId, productId);
                res.json({ success: true, message: 'Removed from wishlist' });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getWishlist(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
                    return;
                }
                const items = yield wishlist_repository_1.default.getByUser(userId);
                res.json({ success: true, data: items });
            }
            catch (error) {
                next(error);
            }
        });
    }
    checkWishlist(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
                    return;
                }
                const { productId } = req.params;
                const isFavorited = yield wishlist_repository_1.default.isFavorited(userId, productId);
                res.json({ success: true, isFavorited });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.WishlistController = WishlistController;
exports.default = new WishlistController();
