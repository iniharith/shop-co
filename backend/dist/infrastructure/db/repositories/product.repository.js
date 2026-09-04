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
            return yield this.model.findOne({ name, isDelete: false });
        });
    }
    findByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({ isDelete: false, $or: [{ category }, { sections: category }] });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof id === 'string' && /^prod-/i.test(id)) {
                return yield this.model.findOne({ catalogId: id, isDelete: false });
            }
            return yield this.model.findOne({ _id: id, isDelete: false });
        });
    }
    findByCatalogId(catalogId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({ catalogId, isDelete: false });
        });
    }
    filterProducts(filter, limit, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find(Object.assign(Object.assign({}, filter), { isDelete: false })).limit(limit).skip(limit * (page - 1));
        });
    }
    searchProducts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({
                isDelete: false,
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
            return yield this.model.find({ isDelete: false }).distinct("category");
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
}
exports.ProductRepository = ProductRepository;
exports.default = new ProductRepository();
