"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = require("express");
const crypto_1 = require("crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
const redis_1 = require("../../infrastructure/redis/redis");
const redis_constant_1 = require("../../shared/constants/redis.constant");
const s3_1 = require("../../infrastructure/config/s3");
const StockAdjustment_1 = require("../../domain/entities/StockAdjustment");
const product_repository_1 = __importDefault(require("../../infrastructure/db/repositories/product.repository"));
const productSections_1 = require("../../shared/constants/productSections");
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const router = (0, express_1.Router)();
const redis = new redis_1.RedisService();
const roles = (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss');
const cachePrefix = `${redis_constant_1.REDIS_KEYS.PRODUCTS}:`;
const ARCHIVE_RETENTION_DAYS = 30;
const invalidateCatalog = () => __awaiter(void 0, void 0, void 0, function* () {
    yield redis.delByPrefix(cachePrefix);
    yield redis.del(redis_constant_1.REDIS_KEYS.CATEGORIES);
});
const catalogImageProxyUrl = (req, key) => {
    const fileName = key.replace(/^catalog\//, '');
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'https';
    const host = req.get('host');
    return `${protocol}://${host}${req.baseUrl}/image/${encodeURIComponent(fileName)}`;
};
const catalogKeyFromImageUrl = (value) => {
    const imageUrl = String(value || '').trim();
    if (!imageUrl)
        return null;
    if (imageUrl.startsWith('catalog/'))
        return imageUrl;
    try {
        const parsed = new URL(imageUrl);
        const bucketHostPrefix = `${s3_1.S3_BUCKET_NAME.toLowerCase()}.s3.`;
        if (!parsed.hostname.toLowerCase().startsWith(bucketHostPrefix))
            return null;
        const decodedPath = decodeURIComponent(parsed.pathname);
        if (!decodedPath.startsWith('/catalog/'))
            return null;
        return decodedPath.slice(1);
    }
    catch (_a) {
        return null;
    }
};
const resolveCatalogImageUrl = (req, value) => {
    const key = catalogKeyFromImageUrl(value);
    return key ? catalogImageProxyUrl(req, key) : value;
};
const withResolvedCatalogImages = (req, product) => {
    const images = Array.isArray(product === null || product === void 0 ? void 0 : product.images)
        ? product.images.map((image) => resolveCatalogImageUrl(req, String(image))).filter(Boolean)
        : [];
    const mainImage = images[0] || '';
    const sizes = Array.isArray(product === null || product === void 0 ? void 0 : product.sizes)
        ? product.sizes.map((size) => {
            const variationImages = Array.isArray(size === null || size === void 0 ? void 0 : size.images)
                ? size.images.map((image) => resolveCatalogImageUrl(req, String(image))).filter(Boolean)
                : [];
            return Object.assign(Object.assign({}, size), { images: variationImages.length > 0 || !mainImage ? variationImages : [mainImage] });
        })
        : [];
    const variations = Array.isArray(product === null || product === void 0 ? void 0 : product.variations)
        ? product.variations.map((variation) => {
            const variationImages = Array.isArray(variation === null || variation === void 0 ? void 0 : variation.images)
                ? variation.images.map((image) => resolveCatalogImageUrl(req, String(image))).filter(Boolean)
                : [];
            return Object.assign(Object.assign({}, variation), { images: variationImages.length > 0 || !mainImage ? variationImages : [mainImage] });
        })
        : [];
    return Object.assign(Object.assign({}, product), { images, sizes, variations });
};
const normalizeProduct = (body) => {
    const images = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : [];
    const mainImage = images[0] || '';
    const sizes = Array.isArray(body.sizes)
        ? body.sizes
            .map((item) => {
            const variationImages = Array.isArray(item === null || item === void 0 ? void 0 : item.images)
                ? item.images.map(String).filter(Boolean)
                : [];
            return {
                size: String((item === null || item === void 0 ? void 0 : item.size) || '').trim(),
                stock: Number(item === null || item === void 0 ? void 0 : item.stock),
                lowStockThreshold: (item === null || item === void 0 ? void 0 : item.lowStockThreshold) === '' || (item === null || item === void 0 ? void 0 : item.lowStockThreshold) == null
                    ? 10
                    : Number(item.lowStockThreshold),
                images: variationImages.length > 0 || !mainImage ? variationImages : [mainImage],
            };
        })
            .filter((item) => item.size)
        : [];
    return {
        name: String(body.name || '').trim(),
        description: String(body.description || '').trim(),
        price: Number(body.price),
        originalPrice: body.originalPrice === '' || body.originalPrice == null
            ? Number(body.price)
            : Number(body.originalPrice),
        discount: body.discount === '' || body.discount == null ? 0 : Number(body.discount),
        category: String(body.category || '').trim(),
        slug: String(body.slug || '').trim().toLowerCase(),
        status: body.status === 'draft' ? 'draft' : 'published',
        seoTitle: String(body.seoTitle || '').trim(),
        seoDescription: String(body.seoDescription || '').trim(),
        images,
        sizes,
        variations: Array.isArray(body.variations)
            ? body.variations
                .map((item) => {
                const variationImages = Array.isArray(item === null || item === void 0 ? void 0 : item.images)
                    ? item.images.map(String).filter(Boolean)
                    : [];
                return {
                    name: String((item === null || item === void 0 ? void 0 : item.name) || '').trim(),
                    stock: Number(item === null || item === void 0 ? void 0 : item.stock),
                    lowStockThreshold: (item === null || item === void 0 ? void 0 : item.lowStockThreshold) === '' || (item === null || item === void 0 ? void 0 : item.lowStockThreshold) == null
                        ? 10
                        : Number(item.lowStockThreshold),
                    images: variationImages.length > 0 ? variationImages : [mainImage],
                };
            })
                .filter((item) => item.name)
            : [],
        printingOptions: Array.isArray(body.printingOptions) ? body.printingOptions : [],
        sections: (0, productSections_1.getProductSections)(String(body.category || '')),
        specifications: (() => {
            const specs = body.specifications && typeof body.specifications === 'object' ? body.specifications : {};
            const customFields = specs.customFields && typeof specs.customFields === 'object'
                ? Object.fromEntries(Object.entries(specs.customFields).filter(([, value]) => value !== '' && value != null))
                : undefined;
            return {
                material: String(specs.material || '').trim() || undefined,
                frame: String(specs.frame || '').trim() || undefined,
                dimensions: String(specs.dimensions || '').trim() || undefined,
                weight: String(specs.weight || '').trim() || undefined,
                finish: String(specs.finish || '').trim() || undefined,
                color: String(specs.color || '').trim() || undefined,
                customFields,
            };
        })(),
        packageContents: Array.isArray(body.packageContents)
            ? body.packageContents.map((item) => String(item)).filter(Boolean)
            : [],
        productionTurnaround: body.productionTurnaround && typeof body.productionTurnaround === 'object'
            ? {
                standardDays: body.productionTurnaround.standardDays === '' ||
                    body.productionTurnaround.standardDays == null
                    ? undefined
                    : Number(body.productionTurnaround.standardDays),
                expressDays: body.productionTurnaround.expressDays === '' ||
                    body.productionTurnaround.expressDays == null
                    ? undefined
                    : Number(body.productionTurnaround.expressDays),
                notes: String(body.productionTurnaround.notes || '').trim(),
            }
            : undefined,
        warrantyInfo: String(body.warrantyInfo || '').trim(),
    };
};
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const ensureUniqueSlug = (slug, name, productId) => __awaiter(void 0, void 0, void 0, function* () {
    const base = slugify(slug || name);
    if (!base)
        return null;
    let candidate = base;
    let suffix = 2;
    while (yield product_model_1.default.exists(Object.assign({ slug: candidate }, (productId ? { _id: { $ne: productId } } : {})))) {
        candidate = `${base}-${suffix++}`;
    }
    return candidate;
});
const validateProduct = (product) => {
    if (!product.name || !product.description || !product.category)
        return 'Name, description, and category are required.';
    if (!Number.isFinite(product.price) || product.price < 0)
        return 'Price must be a valid positive number.';
    if (!Number.isFinite(product.originalPrice) || product.originalPrice < 0)
        return 'Original price must be valid.';
    if (product.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug))
        return 'Slug may only contain lowercase letters, numbers, and hyphens.';
    if (product.seoTitle.length > 70)
        return 'SEO title must be 70 characters or fewer.';
    if (product.seoDescription.length > 160)
        return 'SEO description must be 160 characters or fewer.';
    if (new Set(product.sizes.map(item => item.size.toLowerCase())).size !== product.sizes.length)
        return 'Each size or format must have a unique name.';
    if (product.sizes.some((item) => !Number.isFinite(item.stock) || item.stock < 0))
        return 'Stock must be zero or greater for every size.';
    if (product.sizes.some((item) => !Number.isFinite(item.lowStockThreshold) || item.lowStockThreshold < 0))
        return 'Low-stock thresholds must be zero or greater.';
    return null;
};
const actor = (req) => {
    var _a, _b;
    return ({
        actorId: req.userId,
        actorName: String(((_a = req.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email) || 'Admin'),
    });
};
router.get('/image/:fileName', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const fileName = String(req.params.fileName || '');
        if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
            return res.status(400).json({ success: false, message: 'Invalid image path.' });
        }
        const object = yield s3_1.s3Client.send(new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: `catalog/${fileName}` }));
        if (!object.Body) {
            return res.status(404).json({ success: false, message: 'Image not found.' });
        }
        if (object.ContentType)
            res.type(object.ContentType);
        if (object.ETag)
            res.setHeader('ETag', object.ETag);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Disposition', 'inline');
        const body = object.Body;
        if (typeof body.pipe === 'function') {
            body.pipe(res);
            return;
        }
        if (typeof body.transformToByteArray === 'function') {
            const bytes = yield body.transformToByteArray();
            res.send(Buffer.from(bytes));
            return;
        }
        return res.status(500).json({ success: false, message: 'Image could not be streamed.' });
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.name) === 'NoSuchKey' || ((_a = error === null || error === void 0 ? void 0 : error.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) === 404) {
            return res.status(404).json({ success: false, message: 'Image not found.' });
        }
        next(error);
    }
}));
router.use(auth_middileware_1.default, roles);
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield product_model_1.default.find({}).sort({ isDelete: 1, updatedAt: -1 }).lean();
        res.json({
            success: true,
            products: products.map(product => withResolvedCatalogImages(req, product)),
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/analytics', (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeProducts = { isDelete: false, status: { $ne: 'draft' } };
        const [mostViewed, sales, lowStock, recentlyUpdated] = yield Promise.all([
            product_model_1.default.find(activeProducts)
                .sort({ viewCount: -1, updatedAt: -1 })
                .limit(10)
                .select('name category slug images viewCount updatedAt sizes')
                .lean(),
            order_model_1.default.aggregate([
                {
                    $match: {
                        isDeleted: { $ne: true },
                        orderStatus: { $nin: ['CANCELLED', 'FAILED', 'RETURNED'] },
                    },
                },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$products.product',
                        unitsSold: { $sum: '$products.quantity' },
                        revenue: { $sum: { $ifNull: ['$products.lineTotal', '$products.price'] } },
                    },
                },
                { $sort: { unitsSold: -1, revenue: -1 } },
                { $limit: 500 },
            ]),
            product_model_1.default.aggregate([
                { $match: activeProducts },
                { $unwind: '$sizes' },
                {
                    $match: {
                        $expr: {
                            $lte: ['$sizes.stock', { $ifNull: ['$sizes.lowStockThreshold', 10] }],
                        },
                    },
                },
                {
                    $project: {
                        name: 1,
                        category: 1,
                        slug: 1,
                        images: 1,
                        size: '$sizes.size',
                        stock: '$sizes.stock',
                        lowStockThreshold: { $ifNull: ['$sizes.lowStockThreshold', 10] },
                        updatedAt: 1,
                    },
                },
                { $sort: { stock: 1, updatedAt: -1 } },
                { $limit: 25 },
            ]),
            product_model_1.default.find(activeProducts)
                .sort({ updatedAt: -1 })
                .limit(10)
                .select('name category slug images updatedAt viewCount')
                .lean(),
        ]);
        const productById = new Map((yield product_model_1.default.find({ _id: { $in: sales.map(row => row._id) } })
            .select('name category slug images')
            .lean()).map(product => [String(product._id), product]));
        const bestSelling = sales
            .filter(row => productById.has(String(row._id)))
            .slice(0, 10)
            .map(row => (Object.assign(Object.assign({}, productById.get(String(row._id))), { unitsSold: row.unitsSold, revenue: row.revenue })));
        const soldIds = sales.map(row => row._id);
        const zeroSales = yield product_model_1.default.find(Object.assign(Object.assign({}, activeProducts), (soldIds.length ? { _id: { $nin: soldIds } } : {})))
            .sort({ updatedAt: -1 })
            .limit(10)
            .select('name category slug images updatedAt viewCount')
            .lean();
        res.json({ success: true, mostViewed, bestSelling, zeroSales, lowStock, recentlyUpdated });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id))
            return res.status(400).json({ success: false, message: 'Invalid product id.' });
        const product = yield product_model_1.default.findById(req.params.id).lean();
        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found.' });
        res.json({ success: true, product: withResolvedCatalogImages(req, product) });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/image-upload-url', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileName = String(req.body.fileName || 'image').replace(/[^a-zA-Z0-9._-]/g, '-');
        const contentType = String(req.body.contentType || 'image/jpeg');
        if (!contentType.startsWith('image/'))
            return res.status(400).json({ success: false, message: 'Only image files are supported.' });
        const key = `catalog/${(0, crypto_1.randomUUID)()}-${fileName}`;
        const uploadUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, new client_s3_1.PutObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key, ContentType: contentType }), { expiresIn: 900 });
        res.json({ success: true, uploadUrl, imageUrl: catalogImageProxyUrl(req, key) });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = normalizeProduct(req.body);
        const validationError = validateProduct(product);
        if (validationError)
            return res.status(400).json({ success: false, message: validationError });
        const slug = yield ensureUniqueSlug(product.slug, product.name);
        if (!slug)
            return res.status(400).json({ success: false, message: 'A product name or slug is required.' });
        const created = yield product_model_1.default.create(Object.assign(Object.assign({}, product), { slug, catalogId: req.body.catalogId || `admin-${(0, crypto_1.randomUUID)()}` }));
        const initialAdjustments = product.sizes
            .filter(item => item.stock > 0)
            .map(item => (Object.assign({ productId: created._id, productName: created.name, size: item.size, delta: item.stock, beforeStock: 0, afterStock: item.stock, reason: 'Initial inventory', source: 'initial' }, actor(req))));
        if (initialAdjustments.length)
            yield StockAdjustment_1.StockAdjustment.insertMany(initialAdjustments);
        yield invalidateCatalog();
        res.status(201).json({ success: true, product: created });
    }
    catch (error) {
        next(error);
    }
}));
router.patch('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id))
            return res.status(400).json({ success: false, message: 'Invalid product id.' });
        const product = normalizeProduct(req.body);
        const validationError = validateProduct(product);
        if (validationError)
            return res.status(400).json({ success: false, message: validationError });
        const existing = yield product_model_1.default.findById(req.params.id).lean();
        if (!existing)
            return res.status(404).json({ success: false, message: 'Product not found.' });
        const slug = yield ensureUniqueSlug(product.slug, product.name, req.params.id);
        if (!slug)
            return res.status(400).json({ success: false, message: 'A product name or slug is required.' });
        const removedWithStock = existing.sizes.find(existingSize => Number(existingSize.stock) > 0 &&
            !product.sizes.some(item => item.size === existingSize.size));
        if (removedWithStock)
            return res.status(409).json({
                success: false,
                message: `Adjust ${removedWithStock.size} stock to zero before removing or renaming it.`,
            });
        product.sizes.forEach(item => {
            const currentSize = existing.sizes.find(existingSize => existingSize.size === item.size);
            if (currentSize)
                item.stock = Number(currentSize.stock || 0);
        });
        const updated = yield product_model_1.default.findByIdAndUpdate(req.params.id, { $set: Object.assign(Object.assign({}, product), { slug }) }, { new: true, runValidators: true }).lean();
        if (!updated)
            return res.status(404).json({ success: false, message: 'Product not found.' });
        const beforeBySize = new Map(existing.sizes.map(item => [item.size, Number(item.stock || 0)]));
        const stockChanges = product.sizes.flatMap(item => {
            const beforeStock = beforeBySize.get(item.size) || 0;
            return beforeStock === item.stock
                ? []
                : [
                    Object.assign({ productId: updated._id, productName: updated.name, size: item.size, delta: item.stock - beforeStock, beforeStock, afterStock: item.stock, reason: 'Stock changed while editing product', source: 'admin' }, actor(req)),
                ];
        });
        if (stockChanges.length)
            yield StockAdjustment_1.StockAdjustment.insertMany(stockChanges);
        yield invalidateCatalog();
        res.json({ success: true, product: updated });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/:id/stock-adjustments', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id))
            return res.status(400).json({ success: false, message: 'Invalid product id.' });
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const [adjustments, total] = yield Promise.all([
            StockAdjustment_1.StockAdjustment.find({ productId: req.params.id })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            StockAdjustment_1.StockAdjustment.countDocuments({ productId: req.params.id }),
        ]);
        res.json({
            success: true,
            adjustments,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/:id/stock-adjustments', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id))
            return res.status(400).json({ success: false, message: 'Invalid product id.' });
        const size = String(req.body.size || '').trim();
        const stock = Number(req.body.stock);
        if (!size)
            return res.status(400).json({ success: false, message: 'Size or format is required.' });
        if (!Number.isInteger(stock) || stock < 0)
            return res.status(400).json({
                success: false,
                message: 'Desired stock must be a whole number that is zero or greater.',
            });
        const updated = yield product_repository_1.default.setProductStockBySize(req.params.id, size, stock, Object.assign({ source: 'admin', reason: `Stock set to ${stock}` }, actor(req)));
        if (!updated)
            return res.status(409).json({
                success: false,
                message: 'Stock changed before it could be saved. Please try again.',
            });
        yield invalidateCatalog();
        res.json({ success: true, product: updated });
    }
    catch (error) {
        next(error);
    }
}));
router.patch('/:id/archive', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id))
            return res.status(400).json({ success: false, message: 'Invalid product id.' });
        const archived = Boolean(req.body.archived);
        const updated = yield product_model_1.default.findByIdAndUpdate(req.params.id, { $set: { isDelete: archived, archivedAt: archived ? new Date() : null } }, { new: true }).lean();
        if (!updated)
            return res.status(404).json({ success: false, message: 'Product not found.' });
        yield invalidateCatalog();
        res.json({ success: true, product: updated });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/bulk/archive', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ids = Array.isArray(req.body.ids)
            ? req.body.ids.filter((id) => typeof id === 'string' && mongoose_1.default.isValidObjectId(id))
            : [];
        if (!ids.length)
            return res.status(400).json({ success: false, message: 'Select at least one product.' });
        const archived = Boolean(req.body.archived);
        const result = yield product_model_1.default.updateMany({ _id: { $in: ids } }, { $set: { isDelete: archived, archivedAt: archived ? new Date() : null } });
        yield invalidateCatalog();
        res.json({ success: true, modifiedCount: result.modifiedCount });
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/bulk', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ids = Array.isArray(req.body.ids)
            ? req.body.ids.filter((id) => typeof id === 'string' && mongoose_1.default.isValidObjectId(id))
            : [];
        if (!ids.length)
            return res.status(400).json({ success: false, message: 'Select at least one product.' });
        const confirmation = String(req.body.confirmation || '');
        const expectedConfirmation = `DELETE ${ids.length} ARCHIVED PRODUCTS`;
        if (confirmation !== expectedConfirmation)
            return res.status(400).json({
                success: false,
                message: `Type "${expectedConfirmation}" to permanently delete these products.`,
            });
        const retentionDate = new Date(Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        const eligibleCount = yield product_model_1.default.countDocuments({
            _id: { $in: ids },
            isDelete: true,
            archivedAt: { $lte: retentionDate },
        });
        if (eligibleCount !== ids.length)
            return res.status(409).json({
                success: false,
                message: `Products must stay archived for ${ARCHIVE_RETENTION_DAYS} days before permanent deletion.`,
            });
        const result = yield product_model_1.default.deleteMany({
            _id: { $in: ids },
            isDelete: true,
            archivedAt: { $lte: retentionDate },
        });
        yield invalidateCatalog();
        res.json({ success: true, deletedCount: result.deletedCount });
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id))
            return res.status(400).json({ success: false, message: 'Invalid product id.' });
        const product = yield product_model_1.default.findById(req.params.id).lean();
        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found.' });
        if (!product.isDelete ||
            !product.archivedAt ||
            product.archivedAt >
                new Date(Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000))
            return res.status(409).json({
                success: false,
                message: `Products must stay archived for ${ARCHIVE_RETENTION_DAYS} days before permanent deletion.`,
            });
        if (String(req.body.confirmationName || '') !== product.name)
            return res.status(400).json({
                success: false,
                message: 'Type the exact product name to permanently delete it.',
            });
        yield product_model_1.default.deleteOne({ _id: product._id });
        yield invalidateCatalog();
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
