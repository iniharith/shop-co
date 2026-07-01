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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const seed_1 = require("../../shared/scripts/seed");
const router = (0, express_1.Router)();
router.get("/seed", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const success = yield (0, seed_1.forceSeedProducts)();
    if (success)
        res.json({ message: "Seeded new printing products successfully" });
    else
        res.status(500).json({ message: "Failed to seed products" });
}));
router.get("/", product_controller_1.default.getAllProducts.bind(product_controller_1.default));
router.get("/search", product_controller_1.default.searchProducts.bind(product_controller_1.default));
router.get("/category/:category", product_controller_1.default.getProductByCategory.bind(product_controller_1.default));
router.get("/categories", product_controller_1.default.getAvailableCategories.bind(product_controller_1.default));
router.get("/filter", product_controller_1.default.filterProducts.bind(product_controller_1.default));
router.get("/:id", product_controller_1.default.getProductById.bind(product_controller_1.default));
exports.default = router;
