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
const dotenv_1 = require("dotenv");
const db_config_1 = __importDefault(require("../../config/db.config"));
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
const productSections_1 = require("../constants/productSections");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    (0, dotenv_1.config)();
    yield (0, db_config_1.default)();
    const products = yield product_model_1.default.find({}, { _id: 1, name: 1, category: 1, sections: 1 });
    let updated = 0;
    for (const product of products) {
        const sections = (0, productSections_1.getProductSections)(product.category);
        if (JSON.stringify(product.sections || []) === JSON.stringify(sections))
            continue;
        yield product_model_1.default.updateOne({ _id: product._id }, { $set: { sections } });
        updated += 1;
    }
    console.log(`Updated ${updated} of ${products.length} product section records.`);
    process.exit(0);
});
main().catch((error) => {
    console.error('Product section migration failed:', error);
    process.exit(1);
});
