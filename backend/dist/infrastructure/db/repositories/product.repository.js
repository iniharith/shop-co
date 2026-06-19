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
class ProductRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(product_model_1.default);
    }
    createMany(products) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.insertMany(products);
        });
    }
    findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({ name });
        });
    }
    findByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({ category });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findById(id);
        });
    }
    filterProducts(filter, limit, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find(filter).limit(limit).skip(limit * (page - 1));
        });
    }
    searchProducts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({
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
            return yield this.model.find({}).distinct("category");
        });
    }
    updateProductStockBySize(productId, size, quantityChange) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOneAndUpdate({
                _id: productId,
                'sizes.size': size
            }, {
                $inc: { 'sizes.$.stock': quantityChange }
            }, {
                new: true
            });
        });
    }
}
exports.ProductRepository = ProductRepository;
exports.default = new ProductRepository();
