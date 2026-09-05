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
 * One-time backfill: fill lifecycle fields for products that predate the
 * catalog editor. Assigns slug/status/archivedAt/viewCount safely.
 * Usage: npm run backfill:products
 */
const dotenv_1 = require("dotenv");
const db_config_1 = __importDefault(require("../../config/db.config"));
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    (0, dotenv_1.config)();
    const dryRun = process.env.DRY_RUN === '1';
    if (dryRun)
        console.log('DRY RUN: no writes will be made.');
    yield (0, db_config_1.default)();
    const products = yield product_model_1.default.find({}).select('_id name slug category status isDelete archivedAt viewCount updatedAt').lean();
    const usedSlugs = new Set(products.map(product => product.slug).filter(Boolean));
    let slugged = 0;
    let statused = 0;
    let archived = 0;
    let viewCounted = 0;
    for (const product of products) {
        const updates = {};
        if (!product.slug) {
            const base = slugify(product.name || `product-${product._id}`);
            let candidate = base;
            let suffix = 2;
            while (usedSlugs.has(candidate)) {
                candidate = `${base}-${suffix++}`;
            }
            usedSlugs.add(candidate);
            updates.slug = candidate;
            slugged += 1;
        }
        if (!product.status) {
            updates.status = 'published';
            statused += 1;
        }
        if (product.isDelete && !product.archivedAt) {
            updates.archivedAt = product.updatedAt || new Date();
            archived += 1;
        }
        if (product.viewCount == null) {
            updates.viewCount = 0;
            viewCounted += 1;
        }
        if (Object.keys(updates).length) {
            if (!dryRun)
                yield product_model_1.default.updateOne({ _id: product._id }, { $set: updates });
        }
    }
    console.log([
        `Slugs assigned: ${slugged}`,
        `Status set to published: ${statused}`,
        `Archived timestamps backfilled: ${archived}`,
        `View counts zeroed: ${viewCounted}`,
        `Products scanned: ${products.length}`,
    ].join('\n'));
    if (dryRun)
        console.log('DRY RUN completed — no data was changed.');
    process.exit(0);
});
main().catch((error) => {
    console.error('Product lifecycle backfill failed:', error);
    process.exit(1);
});
