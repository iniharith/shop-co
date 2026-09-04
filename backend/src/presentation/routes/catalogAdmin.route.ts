import { Router } from 'express';
import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mongoose from 'mongoose';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import ProductModel from '../../infrastructure/db/models/product.model';
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_KEYS } from '../../shared/constants/redis.constant';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';
import { StockAdjustment } from '../../domain/entities/StockAdjustment';
import productRepository from '../../infrastructure/db/repositories/product.repository';

const router = Router();
const redis = new RedisService();
const roles = authorizeRoles('admin', 'sysadmin', 'boss');
const cachePrefix = `${REDIS_KEYS.PRODUCTS}:`;
type NormalizedSize = { size: string; stock: number; lowStockThreshold: number };
type NormalizedProduct = {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  images: string[];
  sizes: NormalizedSize[];
  printingOptions: any[];
  sections: string[];
};

const invalidateCatalog = async () => {
  await redis.delByPrefix(cachePrefix);
  await redis.del(REDIS_KEYS.CATEGORIES);
};

const normalizeProduct = (body: any): NormalizedProduct => ({
  name: String(body.name || '').trim(),
  description: String(body.description || '').trim(),
  price: Number(body.price),
  originalPrice: body.originalPrice === '' || body.originalPrice == null ? Number(body.price) : Number(body.originalPrice),
  discount: body.discount === '' || body.discount == null ? 0 : Number(body.discount),
  category: String(body.category || '').trim(),
  images: Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : [],
  sizes: Array.isArray(body.sizes)
    ? body.sizes.map((item: any): NormalizedSize => ({
        size: String(item?.size || '').trim(),
        stock: Number(item?.stock),
        lowStockThreshold: item?.lowStockThreshold === '' || item?.lowStockThreshold == null ? 10 : Number(item.lowStockThreshold),
      })).filter((item: NormalizedSize) => item.size)
    : [] as NormalizedSize[],
  printingOptions: Array.isArray(body.printingOptions) ? body.printingOptions : [],
  sections: Array.isArray(body.sections) ? body.sections.map(String).filter(Boolean) : [],
});

const validateProduct = (product: ReturnType<typeof normalizeProduct>) => {
  if (!product.name || !product.description || !product.category) return 'Name, description, and category are required.';
  if (!Number.isFinite(product.price) || product.price < 0) return 'Price must be a valid positive number.';
  if (!Number.isFinite(product.originalPrice) || product.originalPrice < 0) return 'Original price must be valid.';
  if (new Set(product.sizes.map(item => item.size.toLowerCase())).size !== product.sizes.length) return 'Each size or format must have a unique name.';
  if (product.sizes.some((item: any) => !Number.isFinite(item.stock) || item.stock < 0)) return 'Stock must be zero or greater for every size.';
  if (product.sizes.some((item: any) => !Number.isFinite(item.lowStockThreshold) || item.lowStockThreshold < 0)) return 'Low-stock thresholds must be zero or greater.';
  return null;
};

const actor = (req: any) => ({
  actorId: req.userId,
  actorName: String(req.user?.name || req.user?.email || 'Admin'),
});

router.use(authMiddilware, roles);

router.get('/', async (_req, res, next) => {
  try {
    const products = await ProductModel.find({}).sort({ isDelete: 1, updatedAt: -1 }).lean();
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
});

router.post('/image-upload-url', async (req, res, next) => {
  try {
    const fileName = String(req.body.fileName || 'image').replace(/[^a-zA-Z0-9._-]/g, '-');
    const contentType = String(req.body.contentType || 'image/jpeg');
    if (!contentType.startsWith('image/')) return res.status(400).json({ success: false, message: 'Only image files are supported.' });
    const key = `catalog/${randomUUID()}-${fileName}`;
    const uploadUrl = await getSignedUrl(s3Client, new PutObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key, ContentType: contentType }), { expiresIn: 900 });
    const region = process.env.AWS_REGION || 'ap-southeast-5';
    res.json({ success: true, uploadUrl, imageUrl: `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}` });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const product = normalizeProduct(req.body);
    const validationError = validateProduct(product);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const created = await ProductModel.create({ ...product, catalogId: req.body.catalogId || `admin-${randomUUID()}` });
    const initialAdjustments = product.sizes.filter(item => item.stock > 0).map(item => ({
      productId: created._id,
      productName: created.name,
      size: item.size,
      delta: item.stock,
      beforeStock: 0,
      afterStock: item.stock,
      reason: 'Initial inventory',
      source: 'initial',
      ...actor(req),
    }));
    if (initialAdjustments.length) await StockAdjustment.insertMany(initialAdjustments);
    await invalidateCatalog();
    res.status(201).json({ success: true, product: created });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const product = normalizeProduct(req.body);
    const validationError = validateProduct(product);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const existing = await ProductModel.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found.' });
    const removedWithStock = existing.sizes.find(existingSize => Number(existingSize.stock) > 0 && !product.sizes.some(item => item.size === existingSize.size));
    if (removedWithStock) return res.status(409).json({ success: false, message: `Adjust ${removedWithStock.size} stock to zero before removing or renaming it.` });
    product.sizes.forEach(item => {
      const currentSize = existing.sizes.find(existingSize => existingSize.size === item.size);
      if (currentSize) item.stock = Number(currentSize.stock || 0);
    });
    const updated = await ProductModel.findByIdAndUpdate(req.params.id, { $set: product }, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found.' });
    const beforeBySize = new Map(existing.sizes.map(item => [item.size, Number(item.stock || 0)]));
    const stockChanges = product.sizes.flatMap(item => {
      const beforeStock = beforeBySize.get(item.size) || 0;
      return beforeStock === item.stock ? [] : [{
        productId: updated._id,
        productName: updated.name,
        size: item.size,
        delta: item.stock - beforeStock,
        beforeStock,
        afterStock: item.stock,
        reason: 'Stock changed while editing product',
        source: 'admin',
        ...actor(req),
      }];
    });
    if (stockChanges.length) await StockAdjustment.insertMany(stockChanges);
    await invalidateCatalog();
    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stock-adjustments', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const [adjustments, total] = await Promise.all([
      StockAdjustment.find({ productId: req.params.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StockAdjustment.countDocuments({ productId: req.params.id }),
    ]);
    res.json({ success: true, adjustments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stock-adjustments', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const size = String(req.body.size || '').trim();
    const delta = Number(req.body.delta);
    const reason = String(req.body.reason || '').trim();
    if (!size) return res.status(400).json({ success: false, message: 'Size or format is required.' });
    if (!Number.isInteger(delta) || delta === 0) return res.status(400).json({ success: false, message: 'Adjustment must be a non-zero whole number.' });
    if (reason.length < 3 || reason.length > 300) return res.status(400).json({ success: false, message: 'Provide a reason between 3 and 300 characters.' });

    const updated = await productRepository.updateProductStockBySize(req.params.id, size, delta, {
      source: 'admin',
      reason,
      ...actor(req),
    });
    if (!updated) return res.status(409).json({ success: false, message: 'Product or size was not found, or the adjustment would make stock negative.' });
    await invalidateCatalog();
    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const updated = await ProductModel.findByIdAndUpdate(req.params.id, { $set: { isDelete: Boolean(req.body.archived) } }, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found.' });
    await invalidateCatalog();
    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
});

router.post('/bulk/archive', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id: unknown) => typeof id === 'string' && mongoose.isValidObjectId(id)) : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Select at least one product.' });
    const result = await ProductModel.updateMany({ _id: { $in: ids } }, { $set: { isDelete: Boolean(req.body.archived) } });
    await invalidateCatalog();
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
});

router.delete('/bulk', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id: unknown) => typeof id === 'string' && mongoose.isValidObjectId(id)) : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Select at least one product.' });
    const result = await ProductModel.deleteMany({ _id: { $in: ids } });
    await invalidateCatalog();
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const result = await ProductModel.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Product not found.' });
    await invalidateCatalog();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
