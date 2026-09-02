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
const product_pricing_service_1 = require("../../../shared/pricing/product-pricing.service");
const productConfiguration_1 = require("../../../shared/catalog/productConfiguration");
class CartUsecase {
    constructor() {
        this.cartRepository = new cart_repository_1.CartRepository();
        this.productRepository = new product_repository_1.ProductRepository();
    }
    addProductToCart(userId, productId, size, quantity, artworkUrl, configuration, _configurationKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Number.isInteger(quantity) || quantity < 1)
                throw new Error("Quantity must be a positive integer");
            if (typeof size !== 'string' || !size.trim())
                throw new Error("Size is required");
            const product = yield this.productRepository.findById(productId);
            if (!product) {
                throw new Error("Product not found");
            }
            if (product.catalogId && !configuration) {
                throw new Error("Product configuration is required");
            }
            const fulfillmentSize = (configuration === null || configuration === void 0 ? void 0 : configuration.fulfillmentSize) || size.split('|')[0].trim();
            if (!product.sizes.some((candidate) => candidate.size === fulfillmentSize)) {
                throw new Error("Selected size is not available for this product");
            }
            const normalizedConfiguration = configuration
                ? (0, productConfiguration_1.normalizeProductConfiguration)(product, configuration, fulfillmentSize)
                : undefined;
            const storedSize = normalizedConfiguration ? fulfillmentSize : size;
            const storedProductId = product._id.toString();
            const configurationKey = normalizedConfiguration ? JSON.stringify(normalizedConfiguration) : size;
            const pricing = (0, product_pricing_service_1.computeProductPricing)(product, quantity, normalizedConfiguration);
            const cart = yield this.cartRepository.getCartByUserId(userId);
            if (!cart) {
                return yield this.cartRepository.upsertCart(userId, storedProductId, storedSize, quantity, artworkUrl, normalizedConfiguration, configurationKey, pricing.unitPrice, pricing.fixedPrice, pricing.lineTotal, pricing.pricingVersion);
            }
            const productExist = cart.items.find((item) => item.product._id.toString() === storedProductId && (item.configurationKey || item.size) === configurationKey);
            if (productExist) {
                productExist.quantity = quantity;
                productExist.unitPrice = pricing.unitPrice;
                productExist.fixedPrice = pricing.fixedPrice;
                productExist.lineTotal = pricing.lineTotal;
                productExist.pricingVersion = pricing.pricingVersion;
            }
            else {
                cart.items.push({
                    product: storedProductId,
                    size: storedSize,
                    quantity,
                    artworkUrl,
                    configuration: normalizedConfiguration,
                    configurationKey,
                    unitPrice: pricing.unitPrice,
                    fixedPrice: pricing.fixedPrice,
                    lineTotal: pricing.lineTotal,
                    pricingVersion: pricing.pricingVersion,
                });
            }
            return yield cart.save();
        });
    }
    removeProductFromCart(userId, productId, size, configurationKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield this.cartRepository.getCartByUserId(userId);
            if (!cart) {
                throw new Error("Cart not found");
            }
            const product = yield this.productRepository.findById(productId);
            const storedProductId = product ? product._id.toString() : productId;
            cart.items = cart.items.filter((item) => item.product._id.toString() !== storedProductId || (configurationKey ? item.configurationKey !== configurationKey : item.size !== size));
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
    updateCartItem(userId, productId, size, quantity, configurationKey) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!Number.isInteger(quantity) || quantity < 1)
                throw new Error("Quantity must be a positive integer");
            const cart = yield this.cartRepository.getCartByUserId(userId);
            if (!cart) {
                throw new Error("Cart not found");
            }
            const product = yield this.productRepository.findById(productId);
            const storedProductId = product ? product._id.toString() : productId;
            const item = cart.items.find((candidate) => candidate.product._id.toString() === storedProductId && (configurationKey ? candidate.configurationKey === configurationKey : candidate.size === size));
            if (!item)
                throw new Error("Cart item not found");
            item.quantity = quantity;
            if (!product) {
                const fallbackUnitPrice = (_a = item.unitPrice) !== null && _a !== void 0 ? _a : 0;
                const fallbackFixedPrice = (_b = item.fixedPrice) !== null && _b !== void 0 ? _b : 0;
                item.unitPrice = fallbackUnitPrice;
                item.fixedPrice = fallbackFixedPrice;
                item.lineTotal = fallbackUnitPrice * quantity + fallbackFixedPrice;
                return yield cart.save();
            }
            const normalizedConfiguration = item.configuration
                ? (0, productConfiguration_1.normalizeProductConfiguration)(product, item.configuration, item.configuration.fulfillmentSize)
                : undefined;
            const pricing = (0, product_pricing_service_1.computeProductPricing)(product, quantity, normalizedConfiguration);
            item.configuration = normalizedConfiguration;
            if (normalizedConfiguration)
                item.configurationKey = JSON.stringify(normalizedConfiguration);
            item.unitPrice = pricing.unitPrice;
            item.fixedPrice = pricing.fixedPrice;
            item.lineTotal = pricing.lineTotal;
            item.pricingVersion = pricing.pricingVersion;
            return yield cart.save();
        });
    }
    getCartTotal(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield this.cartRepository.getCartByUserId(userId);
            return cart === null || cart === void 0 ? void 0 : cart.items.reduce((acc, item) => { var _a; return acc + ((_a = item.lineTotal) !== null && _a !== void 0 ? _a : item.quantity * item.product.price); }, 0);
        });
    }
}
exports.CartUsecase = CartUsecase;
exports.default = new CartUsecase();
