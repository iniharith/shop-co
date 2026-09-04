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
exports.ProductController = void 0;
const product_usecase_1 = require("../../application/usecases/products/product.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
/** @Controller */
class ProductController {
    constructor() {
        this.productUsecase = new product_usecase_1.ProductUsecase();
    }
    /**
     * @description Get all products
     * @Route /api/products
     * @Method GET
     * @Response 200 - Products fetched successfully
     * @Response 500 - Internal server error
     */
    getAllProducts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield this.productUsecase.getAllProducts();
                res.status(api_constant_1.statusCodes.OK).json({ message: "Products fetched successfully", products });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get product by id
     * @Route /api/products/:id
     * @Method GET
     * @Response 200 - Product fetched successfully
     * @Response 500 - Internal server error
     */
    getProductById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.productUsecase.getProductById(req.params.id);
                if (!product) {
                    return res.status(api_constant_1.statusCodes.NOT_FOUND).json({ message: "Product not found" });
                }
                res.status(api_constant_1.statusCodes.OK).json({ message: "Product fetched successfully", product });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getProductBySlug(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.productUsecase.getProductBySlug(req.params.slug);
                if (!product)
                    return res.status(api_constant_1.statusCodes.NOT_FOUND).json({ message: "Product not found" });
                res.status(api_constant_1.statusCodes.OK).json({ message: "Product fetched successfully", product });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Search products
     * @Route /api/products/search
     * @Method GET
     * @Response 200 - Products fetched successfully
     * @Response 500 - Internal server error
     */
    searchProducts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield this.productUsecase.searchProducts(req.query.query);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Products fetched successfully", products });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get product by category
     * @Route /api/products/category/:category
     * @Method GET
     * @Response 200 - Products fetched successfully
     * @Response 500 - Internal server error
     */
    getProductByCategory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield this.productUsecase.getProductByCategory(req.params.category);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Products fetched successfully", products });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get available categories
     * @Route /api/products/categories
     * @Method GET
     * @Response 200 - Categories fetched successfully
     * @Response 500 - Internal server error
     */
    getAvailableCategories(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const categories = yield this.productUsecase.getAvailableCategories();
                res.status(api_constant_1.statusCodes.OK).json({ message: "Categories fetched successfully", categories });
            }
            catch (error) {
                console.log("error on categories", error);
                next(error);
            }
        });
    }
    /**
     * @description filter products
     * @Route /api/products/filter
     * @Method GET
     * @Response 200 - Products fetched successfully
     * @Response 500 - Internal server error
     */
    filterProducts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const minPrice = Number(req.query.minPrice) || 0;
                const maxPrice = Number(req.query.maxPrice) || 1000000;
                const category = req.query.category;
                const size = req.query.size;
                const limit = Number(req.query.limit) || 10;
                const page = Number(req.query.page) || 1;
                const filter = {
                    price: { $gte: minPrice, $lte: maxPrice },
                    isDelete: false,
                    status: { $ne: 'draft' },
                };
                if (category) {
                    // support comma-separated categories
                    const categories = Array.isArray(category) ? category : (typeof category === 'string' ? category.split(',') : []);
                    filter.$or = [
                        { category: { $in: categories } },
                        { sections: { $in: categories } },
                    ];
                }
                if (size) {
                    filter.sizes = {
                        $elemMatch: {
                            size: { $in: Array.isArray(size) ? size : (typeof size === 'string' ? size.split(',') : []) },
                        }
                    };
                }
                const products = yield product_model_1.default.find(filter, {
                    _id: 1,
                    name: 1,
                    price: 1,
                    sizes: 1,
                    category: 1,
                    sections: 1,
                    description: 1,
                    images: 1,
                    rating: 1,
                    isDelete: 1,
                    slug: 1,
                    createdAt: 1,
                    updatedAt: 1,
                })
                    .limit(limit)
                    .skip((page - 1) * limit);
                res.status(200).json({
                    message: "Products fetched successfully",
                    products,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.ProductController = ProductController;
exports.default = new ProductController();
