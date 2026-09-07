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
exports.CartController = void 0;
const cart_usecase_1 = require("../../application/usecases/cart/cart.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
/** @Controller */
class CartController {
    constructor() {
        this.cartUsecase = new cart_usecase_1.CartUsecase();
    }
    /**
     * @description Add product to cart
     * @Method POST
     * @Access PRIVATE
     * @Route /api/cart/add
     * @Body productId: string, size: string, quantity: number
     * @Response 200 - Product added to cart successfully
     * @Response 400 - Product id, size and quantity are required
     * @Response 500 - Internal server error
     */
    addProductToCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    throw new Error('User ID is required');
                }
                const { productId, size, quantity, artworkUrl, configuration, configurationKey } = req.body;
                const cart = yield this.cartUsecase.addProductToCart(req.userId, productId, size, quantity, artworkUrl, configuration, configurationKey);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Product added to cart successfully", cart });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Remove product from cart
     * @Method DELETE
     * @Access PRIVATE
     * @Route /api/cart/remove
     * @Body productId: string, size: string
     * @Response 200 - Product removed from cart successfully
     * @Response 400 - Product id and size are required
     * @Response 500 - Internal server error
     */
    removeProductFromCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    throw new Error('User ID is required');
                }
                const { productId, size, configurationKey } = req.body;
                const cart = yield this.cartUsecase.removeProductFromCart(req.userId, productId, size, configurationKey);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Product removed from cart successfully", cart });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get cart
     * @Method GET
     * @Access PRIVATE
     * @Route /api/cart
     * @Response 200 - Cart retrieved successfully
     * @Response 400 - Internal server error
     */
    getCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    throw new Error('User ID is required');
                }
                const cart = yield this.cartUsecase.getCart(req.userId);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Cart retrieved successfully", cart });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Clear cart
     * @Method DELETE
     * @Access PRIVATE
     * @Route /api/cart/clear
     * @Response 200 - Cart cleared successfully
     * @Response 400 - Internal server error
     */
    clearCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    throw new Error('User ID is required');
                }
                const cart = yield this.cartUsecase.clearCart(req.userId);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Cart cleared successfully", cart });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Update cart item
     * @Method PUT
     * @Access PRIVATE
     * @Route /api/cart/update
     * @Body productId: string, size: string, quantity: number
     * @Response 200 - Cart item updated successfully
     * @Response 400 - Product id, size and quantity are required
     * @Response 500 - Internal server error
     */
    updateCartItem(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    throw new Error('User ID is required');
                }
                const { productId, size, quantity, configurationKey } = req.body;
                const cart = yield this.cartUsecase.updateCartItem(req.userId, productId, size, quantity, configurationKey);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Cart item updated successfully", cart });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get cart total
     * @Method GET
     * @Access PRIVATE
     * @Route /api/cart/total
     * @Response 200 - Cart total retrieved successfully
     * @Response 400 - Internal server error
     */
    getCartTotal(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    throw new Error('User ID is required');
                }
                const total = yield this.cartUsecase.getCartTotal(req.userId);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Cart total retrieved successfully", total });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.CartController = CartController;
