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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const product_repository_1 = require("../../infrastructure/db/repositories/product.repository");
const data = [
    { name: 'Yellow Jacket', description: 'Bold yellow jacket', price: 65, category: 'jacket', sizes: [{ size: 'L', stock: 4 }], images: ['/yellow-jacket.webp'], rating: 4 },
];
const initProduct = () => __awaiter(void 0, void 0, void 0, function* () {
    const productRepository = new product_repository_1.ProductRepository();
    if (yield productRepository.hasAny()) {
        console.log("🎉 Products already initialized");
        return;
    }
    const products = yield productRepository.createMany(data);
    console.log(products.length);
    console.log("🎉 Products initialized successfully");
});
exports.default = initProduct;
