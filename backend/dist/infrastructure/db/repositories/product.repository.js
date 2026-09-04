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
exports.ProductRepository = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const base_repository_1 = require("./base.repository");
const StockAdjustment_1 = require("../../../domain/entities/StockAdjustment");
class ProductRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(product_model_1.default);
    }
    createMany(products) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.insertMany(products);
        });
    }
    hasAny() {
        return __awaiter(this, void 0, void 0, function* () {
            return Boolean(yield this.model.exists({}));
        });
    }
    findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({ name, isDelete: false, status: { $ne: 'draft' } });
        });
    }
    findByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({ isDelete: false, status: { $ne: 'draft' }, $or: [{ category }, { sections: category }] });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof id === 'string' && /^prod-/i.test(id)) {
                return yield this.model.findOne({ catalogId: id, isDelete: false, status: { $ne: 'draft' } });
            }
            return yield this.model.findOne({ _id: id, isDelete: false, status: { $ne: 'draft' } });
        });
    }
    findBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({ slug, isDelete: false, status: { $ne: 'draft' } });
        });
    }
    incrementViewCount(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.updateOne({ _id: productId, isDelete: false, status: { $ne: 'draft' } }, { $inc: { viewCount: 1 } });
        });
    }
    findByCatalogId(catalogId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({ catalogId, isDelete: false, status: { $ne: 'draft' } });
        });
    }
    filterProducts(filter, limit, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find(Object.assign(Object.assign({}, filter), { isDelete: false, status: { $ne: 'draft' } })).limit(limit).skip(limit * (page - 1));
        });
    }
    searchProducts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({
                isDelete: false,
                status: { $ne: 'draft' },
                $or: [
                    { name: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                    { category: { $regex: query, $options: "i" } },
                ]
            });
        });
    }
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({ isDelete: false, status: { $ne: 'draft' } }).distinct("category");
        });
    }
    updateProductStockBySize(productId, size, quantityChange, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sizeCondition = quantityChange < 0
                ? { $elemMatch: { size, stock: { $gte: -quantityChange } } }
                : { $elemMatch: { size } };
            const product = yield this.model.findOneAndUpdate({
                _id: productId,
                sizes: sizeCondition,
            }, {
                $inc: { 'sizes.$.stock': quantityChange }
            }, {
                new: true
            });
            if (product && quantityChange !== 0 && context) {
                const afterStock = (_a = product.sizes.find(item => item.size === size)) === null || _a === void 0 ? void 0 : _a.stock;
                if (typeof afterStock === 'number') {
                    yield StockAdjustment_1.StockAdjustment.create(Object.assign({ productId: product._id, productName: product.name, size, delta: quantityChange, beforeStock: afterStock - quantityChange, afterStock }, context)).catch(error => console.error('Failed to record stock adjustment:', error));
                }
            }
            return product;
        });
    }
    setProductStockBySize(productId, size, stock, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const current = yield this.model.findOne({ _id: productId, sizes: { $elemMatch: { size } } }).select({ name: 1, sizes: 1 });
            const beforeStock = (_a = current === null || current === void 0 ? void 0 : current.sizes.find(item => item.size === size)) === null || _a === void 0 ? void 0 : _a.stock;
            if (typeof beforeStock !== 'number')
                return null;
            const product = yield this.model.findOneAndUpdate({ _id: productId, sizes: { $elemMatch: { size, stock: beforeStock } } }, { $set: { 'sizes.$.stock': stock } }, { new: true });
            if (!product)
                return null;
            if (stock !== beforeStock) {
                yield StockAdjustment_1.StockAdjustment.create(Object.assign({ productId: product._id, productName: product.name, size, delta: stock - beforeStock, beforeStock, afterStock: stock }, context)).catch(error => console.error('Failed to record stock adjustment:', error));
            }
            return product;
        });
    }
}
exports.ProductRepository = ProductRepository;
exports.default = new ProductRepository();
