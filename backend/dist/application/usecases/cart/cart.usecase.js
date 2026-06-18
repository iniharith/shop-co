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
exports.CartUsecase = void 0;
const cart_repository_1 = require("../../../infrastructure/db/repositories/cart.repository");
const product_repository_1 = require("../../../infrastructure/db/repositories/product.repository");
class CartUsecase {
    constructor() {
        this.cartRepository = new cart_repository_1.CartRepository();
        this.productRepository = new product_repository_1.ProductRepository();
    }
    addProductToCart(userId, productId, size, quantity, artworkUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield this.productRepository.findById(productId);
            if (!product) {
                throw new Error("Product not found");
            }
            const cart = yield this.cartRepository.getCartByUserId(userId);
            if (!cart) {
                return yield this.cartRepository.upsertCart(userId, productId.toString(), size, quantity, artworkUrl);
            }
            const productExist = cart.items.find((item) => item.product._id.toString() === productId.toString() && item.size === size);
            if (productExist) {
                return yield this.updateCartItem(userId, productId, size, quantity);
            }
            else {
                cart.items.push({ product: productId, size, quantity, artworkUrl });
            }
            return yield cart.save();
        });
    }
    removeProductFromCart(userId, productId, size) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield this.cartRepository.getCartByUserId(userId);
            if (!cart) {
                throw new Error("Cart not found");
            }
            cart.items = cart.items.filter((item) => item.product._id.toString() !== productId.toString() || item.size !== size);
            return yield cart.save();
        });
    }
    getCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.cartRepository.getCartByUserId(userId);
        });
    }
    clearCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.cartRepository.clearCart(userId);
        });
    }
    updateCartItem(userId, productId, size, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield this.cartRepository.getCartByUserId(userId);
            if (!cart) {
                throw new Error("Cart not found");
            }
            cart.items = cart.items.map((item) => item.product._id.toString() === productId.toString() && item.size === size ? Object.assign(Object.assign({}, item), { quantity }) : item);
            return yield cart.save();
        });
    }
    getCartTotal(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield this.cartRepository.getCartByUserId(userId);
            return cart === null || cart === void 0 ? void 0 : cart.items.reduce((acc, item) => acc + item.quantity * item.product.price, 0);
        });
    }
}
exports.CartUsecase = CartUsecase;
exports.default = new CartUsecase();
