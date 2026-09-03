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

const router = Router();
const redis = new RedisService();
const roles = authorizeRoles('admin', 'sysadmin', 'boss');
const cachePrefix = `${REDIS_KEYS.PRODUCTS}:`;

const invalidateCatalog = async () => {
  await redis.delByPrefix(cachePrefix);
  await redis.del(REDIS_KEYS.CATEGORIES);
};

const normalizeProduct = (body: any) => ({
  name: String(body.name || '').trim(),
  description: String(body.description || '').trim(),
  price: Number(body.price),
  originalPrice: body.originalPrice === '' || body.originalPrice == null ? Number(body.price) : Number(body.originalPrice),
  discount: body.discount === '' || body.discount == null ? 0 : Number(body.discount),
  category: String(body.category || '').trim(),
  images: Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : [],
  sizes: Array.isArray(body.sizes)
    ? body.sizes.map((item: any) => ({ size: String(item?.size || '').trim(), stock: Number(item?.stock) })).filter((item: any) => item.size)
    : [],
  printingOptions: Array.isArray(body.printingOptions) ? body.printingOptions : [],
  sections: Array.isArray(body.sections) ? body.sections.map(String).filter(Boolean) : [],
});

const validateProduct = (product: ReturnType<typeof normalizeProduct>) => {
  if (!product.name || !product.description || !product.category) return 'Name, description, and category are required.';
  if (!Number.isFinite(product.price) || product.price < 0) return 'Price must be a valid positive number.';
  if (!Number.isFinite(product.originalPrice) || product.originalPrice < 0) return 'Original price must be valid.';
  if (product.sizes.some((item: any) => !Number.isFinite(item.stock) || item.stock < 0)) return 'Stock must be zero or greater for every size.';
  return null;
};

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
    const updated = await ProductModel.findByIdAndUpdate(req.params.id, { $set: product }, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found.' });
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
