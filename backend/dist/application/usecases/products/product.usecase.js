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
exports.ProductUsecase = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const product_repository_1 = require("../../../infrastructure/db/repositories/product.repository");
const cart_repository_1 = require("../../../infrastructure/db/repositories/cart.repository");
const redis_1 = require("../../../infrastructure/redis/redis");
const redis_constant_1 = require("../../../shared/constants/redis.constant");
class ProductUsecase {
    constructor() {
        this.productRepository = new product_repository_1.ProductRepository();
        this.cartRepository = new cart_repository_1.CartRepository();
        this.redisService = new redis_1.RedisService();
    }
    getAllProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProducts = yield this.redisService.get(redis_constant_1.REDIS_KEYS.PRODUCTS);
            if (cachedProducts) {
                console.log("Products fetched from cache");
                return JSON.parse(cachedProducts);
            }
            const products = yield this.productRepository.findAll();
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.PRODUCTS, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    getProductById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProduct = yield this.redisService.get(redis_constant_1.REDIS_KEYS.PRODUCTS + id);
            if (cachedProduct) {
                return JSON.parse(cachedProduct);
            }
            const product = yield this.productRepository.findById(id);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.PRODUCTS + id, JSON.stringify(product), 60 * 60 * 24);
            return product;
        });
    }
    filterProducts(filter_1) {
        return __awaiter(this, arguments, void 0, function* (filter, limit = 10, page = 1) {
            const cachedProducts = yield this.redisService.get(redis_constant_1.REDIS_KEYS.PRODUCTS + filter.toString() + limit + page);
            if (cachedProducts) {
                return JSON.parse(cachedProducts);
            }
            const products = yield this.productRepository.filterProducts(filter, limit, page);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.PRODUCTS + filter.toString() + limit + page, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    searchProducts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProducts = yield this.redisService.get(redis_constant_1.REDIS_KEYS.PRODUCTS + query);
            if (cachedProducts) {
                return JSON.parse(cachedProducts);
            }
            const products = yield this.productRepository.searchProducts(query);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.PRODUCTS + query, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    getProductByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProducts = yield this.redisService.get(redis_constant_1.REDIS_KEYS.PRODUCTS + category);
            if (cachedProducts) {
                return JSON.parse(cachedProducts);
            }
            const products = yield this.productRepository.findByCategory(category);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.PRODUCTS + category, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    getAvailableCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedCategories = yield this.redisService.get(redis_constant_1.REDIS_KEYS.CATEGORIES);
            if (cachedCategories) {
                return JSON.parse(cachedCategories);
            }
            const categories = yield this.productRepository.getCategories();
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.CATEGORIES, JSON.stringify(categories), 60 * 60 * 24);
            return categories;
        });
    }
}
exports.ProductUsecase = ProductUsecase;
exports.default = new ProductUsecase();
