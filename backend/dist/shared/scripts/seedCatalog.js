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
const dotenv_1 = require("dotenv");
const db_config_1 = __importDefault(require("../../config/db.config"));
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
const productSections_1 = require("../constants/productSections");
const catalogProducts_1 = require("../catalog/catalogProducts");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    (0, dotenv_1.config)();
    yield (0, db_config_1.default)();
    let created = 0;
    let updated = 0;
    for (const product of catalogProducts_1.catalogProducts) {
        const patch = {
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            images: product.images || [],
            sizes: product.sizes || [],
            rating: (_a = product.rating) !== null && _a !== void 0 ? _a : 0,
            originalPrice: (_b = product.originalPrice) !== null && _b !== void 0 ? _b : product.price,
            discount: (_c = product.discount) !== null && _c !== void 0 ? _c : 0,
            printingOptions: (_d = product.printingOptions) !== null && _d !== void 0 ? _d : [],
            matrixPricing: (_e = product.matrixPricing) !== null && _e !== void 0 ? _e : { enabled: false },
            catalogId: product.catalogId,
            sections: (0, productSections_1.getProductSections)(product.category),
        };
        const existing = yield product_model_1.default.findOne({ catalogId: product.catalogId });
        if (existing) {
            yield product_model_1.default.updateOne({ _id: existing._id }, { $set: patch });
            updated += 1;
        }
        else {
            yield product_model_1.default.create(patch);
            created += 1;
        }
    }
    console.log(`Catalog seeded: ${created} created, ${updated} updated (${catalogProducts_1.catalogProducts.length} total).`);
    process.exit(0);
});
main().catch((error) => {
    console.error('Catalog seed failed:', error);
    process.exit(1);
});
