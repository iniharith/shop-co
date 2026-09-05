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
const PRODUCT_CACHE_PREFIX = `${redis_constant_1.REDIS_KEYS.PRODUCTS}:catalog-v5:`;
const CATALOG_CACHE_KEY = `${PRODUCT_CACHE_PREFIX}all`;
const CATEGORIES_CACHE_KEY = `${PRODUCT_CACHE_PREFIX}categories`;
class ProductUsecase {
    constructor() {
        this.productRepository = new product_repository_1.ProductRepository();
        this.cartRepository = new cart_repository_1.CartRepository();
        this.redisService = new redis_1.RedisService();
    }
    getAllProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProducts = yield this.redisService.get(CATALOG_CACHE_KEY);
            if (cachedProducts) {
                console.log("Products fetched from cache");
                return JSON.parse(cachedProducts).filter((product) => !product.isDelete && product.status !== 'draft');
            }
            const products = (yield this.productRepository.findAll()).filter((product) => !product.isDelete && product.status !== 'draft');
            yield this.redisService.set(CATALOG_CACHE_KEY, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    getProductById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProduct = yield this.redisService.get(PRODUCT_CACHE_PREFIX + `id:${id}`);
            if (cachedProduct) {
                const product = JSON.parse(cachedProduct);
                if ((product === null || product === void 0 ? void 0 : product.isDelete) || (product === null || product === void 0 ? void 0 : product.status) === 'draft')
                    return null;
                void this.productRepository.incrementViewCount(String(product._id));
                return product;
            }
            const product = yield this.productRepository.findById(id);
            if (product)
                void this.productRepository.incrementViewCount(String(product._id));
            yield this.redisService.set(PRODUCT_CACHE_PREFIX + `id:${id}`, JSON.stringify(product), 60 * 60 * 24);
            return product;
        });
    }
    getProductBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = PRODUCT_CACHE_PREFIX + `slug:${slug}`;
            const cachedProduct = yield this.redisService.get(cacheKey);
            if (cachedProduct) {
                const product = JSON.parse(cachedProduct);
                if ((product === null || product === void 0 ? void 0 : product.isDelete) || (product === null || product === void 0 ? void 0 : product.status) === 'draft')
                    return null;
                void this.productRepository.incrementViewCount(String(product._id));
                return product;
            }
            let product = yield this.productRepository.findBySlug(slug);
            if (!product && /^prod-/i.test(slug)) {
                product = yield this.productRepository.findByCatalogId(slug);
            }
            if (product)
                void this.productRepository.incrementViewCount(String(product._id));
            yield this.redisService.set(cacheKey, JSON.stringify(product), 60 * 60 * 24);
            return product;
        });
    }
    filterProducts(filter_1) {
        return __awaiter(this, arguments, void 0, function* (filter, limit = 10, page = 1) {
            const cachedProducts = yield this.redisService.get(PRODUCT_CACHE_PREFIX + `filter:${filter.toString()}${limit}${page}`);
            if (cachedProducts) {
                return JSON.parse(cachedProducts);
            }
            const products = yield this.productRepository.filterProducts(filter, limit, page);
            yield this.redisService.set(PRODUCT_CACHE_PREFIX + `filter:${filter.toString()}${limit}${page}`, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    searchProducts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProducts = yield this.redisService.get(PRODUCT_CACHE_PREFIX + `search:${query}`);
            if (cachedProducts) {
                return JSON.parse(cachedProducts);
            }
            const products = yield this.productRepository.searchProducts(query);
            yield this.redisService.set(PRODUCT_CACHE_PREFIX + `search:${query}`, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    getProductByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedProducts = yield this.redisService.get(PRODUCT_CACHE_PREFIX + `category:${category}`);
            if (cachedProducts) {
                return JSON.parse(cachedProducts);
            }
            const products = yield this.productRepository.findByCategory(category);
            yield this.redisService.set(PRODUCT_CACHE_PREFIX + `category:${category}`, JSON.stringify(products), 60 * 60 * 24);
            return products;
        });
    }
    getAvailableCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedCategories = yield this.redisService.get(CATEGORIES_CACHE_KEY);
            if (cachedCategories) {
                return JSON.parse(cachedCategories);
            }
            const categories = yield this.productRepository.getCategories();
            yield this.redisService.set(CATEGORIES_CACHE_KEY, JSON.stringify(categories), 60 * 60 * 24);
            return categories;
        });
    }
}
exports.ProductUsecase = ProductUsecase;
exports.default = new ProductUsecase();
