"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const router = (0, express_1.Router)();
router.get("/", product_controller_1.default.getAllProducts.bind(product_controller_1.default));
router.get("/search", product_controller_1.default.searchProducts.bind(product_controller_1.default));
router.get("/category/:category", product_controller_1.default.getProductByCategory.bind(product_controller_1.default));
router.get("/categories", product_controller_1.default.getAvailableCategories.bind(product_controller_1.default));
router.get("/filter", product_controller_1.default.filterProducts.bind(product_controller_1.default));
router.get("/:id", product_controller_1.default.getProductById.bind(product_controller_1.default));
exports.default = router;
