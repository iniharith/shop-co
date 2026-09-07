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
exports.CartRepository = void 0;
const cart_model_1 = __importDefault(require("../models/cart.model"));
class CartRepository {
    createCart(cart) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield cart_model_1.default.create(cart);
        });
    }
    upsertCart(userId_1, productId_1, size_1, quantity_1, artworkUrl_1, configuration_1, configurationKey_1, unitPrice_1) {
        return __awaiter(this, arguments, void 0, function* (userId, productId, size, quantity, artworkUrl, configuration, configurationKey, unitPrice, fixedPrice = 0, lineTotal, pricingVersion = 'catalog-v1') {
            const resolvedLineTotal = lineTotal !== null && lineTotal !== void 0 ? lineTotal : unitPrice * quantity;
            return yield cart_model_1.default.findOneAndUpdate({ userId }, { $push: { items: { product: productId, size, quantity, artworkUrl, configuration, configurationKey, unitPrice, fixedPrice, lineTotal: resolvedLineTotal, pricingVersion } } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }).populate('items.product');
        });
    }
    getCartByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield cart_model_1.default.findOne({ userId }).populate('items.product');
        });
    }
    clearCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield cart_model_1.default.findOneAndUpdate({ userId }, { items: [] }, { new: true }).populate('items.product');
        });
    }
}
exports.CartRepository = CartRepository;
exports.default = new CartRepository();
