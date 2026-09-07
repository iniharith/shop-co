import { Router } from 'express';
import { randomUUID } from 'crypto';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mongoose from 'mongoose';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import ProductModel from '../../infrastructure/db/models/product.model';
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_KEYS } from '../../shared/constants/redis.constant';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';
import { StockAdjustment } from '../../domain/entities/StockAdjustment';
import productRepository from '../../infrastructure/db/repositories/product.repository';
import { getProductSections } from '../../shared/constants/productSections';
import OrderModel from '../../infrastructure/db/models/order.model';

const router = Router();
const redis = new RedisService();
const roles = authorizeRoles('admin', 'sysadmin', 'boss');
const cachePrefix = `${REDIS_KEYS.PRODUCTS}:`;
const ARCHIVE_RETENTION_DAYS = 30;
type NormalizedSize = { size: string; stock: number; lowStockThreshold: number; images: string[] };
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
  slug: string;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDescription: string;
  specifications?: {
    material?: string;
    frame?: string;
    dimensions?: string;
    weight?: string;
    finish?: string;
    color?: string;
    customFields?: Record<string, string>;
  };
  packageContents: string[];
  productionTurnaround?: { standardDays?: number; expressDays?: number; notes?: string };
  warrantyInfo: string;
};

const invalidateCatalog = async () => {
  await redis.delByPrefix(cachePrefix);
  await redis.del(REDIS_KEYS.CATEGORIES);
};

const catalogImageProxyUrl = (req: any, key: string) => {
  const fileName = key.replace(/^catalog\//, '');
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = req.get('host');
  return `${protocol}://${host}${req.baseUrl}/image/${encodeURIComponent(fileName)}`;
};

const catalogKeyFromImageUrl = (value: string) => {
  const imageUrl = String(value || '').trim();
  if (!imageUrl) return null;
  if (imageUrl.startsWith('catalog/')) return imageUrl;

  try {
    const parsed = new URL(imageUrl);
    const bucketHostPrefix = `${S3_BUCKET_NAME.toLowerCase()}.s3.`;
    if (!parsed.hostname.toLowerCase().startsWith(bucketHostPrefix)) return null;

    const decodedPath = decodeURIComponent(parsed.pathname);
    if (!decodedPath.startsWith('/catalog/')) return null;
    return decodedPath.slice(1);
  } catch {
    return null;
  }
};

const resolveCatalogImageUrl = (req: any, value: string) => {
  const key = catalogKeyFromImageUrl(value);
  return key ? catalogImageProxyUrl(req, key) : value;
};

const withResolvedCatalogImages = (req: any, product: any) => {
  const images = Array.isArray(product?.images)
    ? product.images.map((image: unknown) => resolveCatalogImageUrl(req, String(image))).filter(Boolean)
    : [];
  const mainImage = images[0] || '';
  const sizes = Array.isArray(product?.sizes)
    ? product.sizes.map((size: any) => {
        const variationImages = Array.isArray(size?.images)
          ? size.images.map((image: unknown) => resolveCatalogImageUrl(req, String(image))).filter(Boolean)
          : [];
        return {
          ...size,
          images: variationImages.length > 0 || !mainImage ? variationImages : [mainImage],
        };
      })
    : [];

  return { ...product, images, sizes };
};

const normalizeProduct = (body: any): NormalizedProduct => {
  const images = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : [];
  const mainImage = images[0] || '';
  const sizes = Array.isArray(body.sizes)
    ? body.sizes
        .map((item: any): NormalizedSize => {
          const variationImages = Array.isArray(item?.images)
            ? item.images.map(String).filter(Boolean)
            : [];
          return {
            size: String(item?.size || '').trim(),
            stock: Number(item?.stock),
            lowStockThreshold:
              item?.lowStockThreshold === '' || item?.lowStockThreshold == null
                ? 10
                : Number(item.lowStockThreshold),
            images: variationImages.length > 0 || !mainImage ? variationImages : [mainImage],
          };
        })
        .filter((item: NormalizedSize) => item.size)
    : ([] as NormalizedSize[]);

  return {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    price: Number(body.price),
    originalPrice:
      body.originalPrice === '' || body.originalPrice == null
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
    printingOptions: Array.isArray(body.printingOptions) ? body.printingOptions : [],
    sections: getProductSections(String(body.category || '')),
    specifications: (() => {
      const specs = body.specifications && typeof body.specifications === 'object' ? body.specifications : {};
      const customFields =
        specs.customFields && typeof specs.customFields === 'object'
          ? (Object.fromEntries(
              Object.entries(specs.customFields).filter(([, value]) => value !== '' && value != null),
            ) as Record<string, string>)
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
      ? body.packageContents.map((item: any) => String(item)).filter(Boolean)
      : [],
    productionTurnaround:
      body.productionTurnaround && typeof body.productionTurnaround === 'object'
        ? {
            standardDays:
              body.productionTurnaround.standardDays === '' ||
              body.productionTurnaround.standardDays == null
                ? undefined
                : Number(body.productionTurnaround.standardDays),
            expressDays:
              body.productionTurnaround.expressDays === '' ||
              body.productionTurnaround.expressDays == null
                ? undefined
                : Number(body.productionTurnaround.expressDays),
            notes: String(body.productionTurnaround.notes || '').trim(),
          }
        : undefined,
    warrantyInfo: String(body.warrantyInfo || '').trim(),
  };
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const ensureUniqueSlug = async (slug: string, name: string, productId?: string) => {
  const base = slugify(slug || name);
  if (!base) return null;
  let candidate = base;
  let suffix = 2;
  while (
    await ProductModel.exists({
      slug: candidate,
      ...(productId ? { _id: { $ne: productId } } : {}),
    })
  ) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};

const validateProduct = (product: ReturnType<typeof normalizeProduct>) => {
  if (!product.name || !product.description || !product.category)
    return 'Name, description, and category are required.';
  if (!Number.isFinite(product.price) || product.price < 0)
    return 'Price must be a valid positive number.';
  if (!Number.isFinite(product.originalPrice) || product.originalPrice < 0)
    return 'Original price must be valid.';
  if (product.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug))
    return 'Slug may only contain lowercase letters, numbers, and hyphens.';
  if (product.seoTitle.length > 70) return 'SEO title must be 70 characters or fewer.';
  if (product.seoDescription.length > 160)
    return 'SEO description must be 160 characters or fewer.';
  if (new Set(product.sizes.map(item => item.size.toLowerCase())).size !== product.sizes.length)
    return 'Each size or format must have a unique name.';
  if (product.sizes.some((item: any) => !Number.isFinite(item.stock) || item.stock < 0))
    return 'Stock must be zero or greater for every size.';
  if (
    product.sizes.some(
      (item: any) => !Number.isFinite(item.lowStockThreshold) || item.lowStockThreshold < 0,
    )
  )
    return 'Low-stock thresholds must be zero or greater.';
  return null;
};

const actor = (req: any) => ({
  actorId: req.userId,
  actorName: String(req.user?.name || req.user?.email || 'Admin'),
});

router.get('/image/:fileName', async (req, res, next) => {
  try {
    const fileName = String(req.params.fileName || '');
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      return res.status(400).json({ success: false, message: 'Invalid image path.' });
    }

    const object = await s3Client.send(
      new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: `catalog/${fileName}` }),
    );

    if (!object.Body) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    if (object.ContentType) res.type(object.ContentType);
    if (object.ETag) res.setHeader('ETag', object.ETag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', 'inline');

    const body = object.Body as any;
    if (typeof body.pipe === 'function') {
      body.pipe(res);
      return;
    }

    if (typeof body.transformToByteArray === 'function') {
      const bytes = await body.transformToByteArray();
      res.send(Buffer.from(bytes));
      return;
    }

    return res.status(500).json({ success: false, message: 'Image could not be streamed.' });
  } catch (error: any) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }
    next(error);
  }
});

router.use(authMiddilware, roles);

router.get('/', async (req, res, next) => {
  try {
    const products = await ProductModel.find({}).sort({ isDelete: 1, updatedAt: -1 }).lean();
    res.json({
      success: true,
      products: products.map(product => withResolvedCatalogImages(req, product)),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics', async (_req, res, next) => {
  try {
    const activeProducts = { isDelete: false, status: { $ne: 'draft' } };
    const [mostViewed, sales, lowStock, recentlyUpdated] = await Promise.all([
      ProductModel.find(activeProducts)
        .sort({ viewCount: -1, updatedAt: -1 })
        .limit(10)
        .select('name category slug images viewCount updatedAt sizes')
        .lean(),
      OrderModel.aggregate([
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
      ProductModel.aggregate([
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
      ProductModel.find(activeProducts)
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('name category slug images updatedAt viewCount')
        .lean(),
    ]);
    const productById = new Map(
      (
        await ProductModel.find({ _id: { $in: sales.map(row => row._id) } })
          .select('name category slug images')
          .lean()
      ).map(product => [String(product._id), product]),
    );
    const bestSelling = sales
      .filter(row => productById.has(String(row._id)))
      .slice(0, 10)
      .map(row => ({
        ...productById.get(String(row._id)),
        unitsSold: row.unitsSold,
        revenue: row.revenue,
      }));
    const soldIds = sales.map(row => row._id);
    const zeroSales = await ProductModel.find({
      ...activeProducts,
      ...(soldIds.length ? { _id: { $nin: soldIds } } : {}),
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('name category slug images updatedAt viewCount')
      .lean();
    res.json({ success: true, mostViewed, bestSelling, zeroSales, lowStock, recentlyUpdated });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const product = await ProductModel.findById(req.params.id).lean();
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: withResolvedCatalogImages(req, product) });
  } catch (error) {
    next(error);
  }
});

router.post('/image-upload-url', async (req, res, next) => {
  try {
    const fileName = String(req.body.fileName || 'image').replace(/[^a-zA-Z0-9._-]/g, '-');
    const contentType = String(req.body.contentType || 'image/jpeg');
    if (!contentType.startsWith('image/'))
      return res.status(400).json({ success: false, message: 'Only image files are supported.' });
    const key = `catalog/${randomUUID()}-${fileName}`;
    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key, ContentType: contentType }),
      { expiresIn: 900 },
    );
    res.json({ success: true, uploadUrl, imageUrl: catalogImageProxyUrl(req, key) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const product = normalizeProduct(req.body);
    const validationError = validateProduct(product);
    if (validationError)
      return res.status(400).json({ success: false, message: validationError });
    const slug = await ensureUniqueSlug(product.slug, product.name);
    if (!slug)
      return res.status(400).json({ success: false, message: 'A product name or slug is required.' });
    const created = await ProductModel.create({
      ...product,
      slug,
      catalogId: req.body.catalogId || `admin-${randomUUID()}`,
    });
    const initialAdjustments = product.sizes
      .filter(item => item.stock > 0)
      .map(item => ({
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
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const product = normalizeProduct(req.body);
    const validationError = validateProduct(product);
    if (validationError)
      return res.status(400).json({ success: false, message: validationError });
    const existing = await ProductModel.findById(req.params.id).lean();
    if (!existing)
      return res.status(404).json({ success: false, message: 'Product not found.' });
    const slug = await ensureUniqueSlug(product.slug, product.name, req.params.id);
    if (!slug)
      return res.status(400).json({ success: false, message: 'A product name or slug is required.' });
    const removedWithStock = existing.sizes.find(
      existingSize =>
        Number(existingSize.stock) > 0 &&
        !product.sizes.some(item => item.size === existingSize.size),
    );
    if (removedWithStock)
      return res.status(409).json({
        success: false,
        message: `Adjust ${removedWithStock.size} stock to zero before removing or renaming it.`,
      });
    product.sizes.forEach(item => {
      const currentSize = existing.sizes.find(existingSize => existingSize.size === item.size);
      if (currentSize) item.stock = Number(currentSize.stock || 0);
    });
    const updated = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { $set: { ...product, slug } },
      { new: true, runValidators: true },
    ).lean();
    if (!updated)
      return res.status(404).json({ success: false, message: 'Product not found.' });
    const beforeBySize = new Map(
      existing.sizes.map(item => [item.size, Number(item.stock || 0)]),
    );
    const stockChanges = product.sizes.flatMap(item => {
      const beforeStock = beforeBySize.get(item.size) || 0;
      return beforeStock === item.stock
        ? []
        : [
            {
              productId: updated._id,
              productName: updated.name,
              size: item.size,
              delta: item.stock - beforeStock,
              beforeStock,
              afterStock: item.stock,
              reason: 'Stock changed while editing product',
              source: 'admin',
              ...actor(req),
            },
          ];
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
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const [adjustments, total] = await Promise.all([
      StockAdjustment.find({ productId: req.params.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      StockAdjustment.countDocuments({ productId: req.params.id }),
    ]);
    res.json({
      success: true,
      adjustments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stock-adjustments', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
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

    const updated = await productRepository.setProductStockBySize(req.params.id, size, stock, {
      source: 'admin',
      reason: `Stock set to ${stock}`,
      ...actor(req),
    });
    if (!updated)
      return res.status(409).json({
        success: false,
        message: 'Stock changed before it could be saved. Please try again.',
      });
    await invalidateCatalog();
    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const archived = Boolean(req.body.archived);
    const updated = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { $set: { isDelete: archived, archivedAt: archived ? new Date() : null } },
      { new: true },
    ).lean();
    if (!updated)
      return res.status(404).json({ success: false, message: 'Product not found.' });
    await invalidateCatalog();
    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
});

router.post('/bulk/archive', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.filter(
          (id: unknown) => typeof id === 'string' && mongoose.isValidObjectId(id),
        )
      : [];
    if (!ids.length)
      return res.status(400).json({ success: false, message: 'Select at least one product.' });
    const archived = Boolean(req.body.archived);
    const result = await ProductModel.updateMany(
      { _id: { $in: ids } },
      { $set: { isDelete: archived, archivedAt: archived ? new Date() : null } },
    );
    await invalidateCatalog();
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
});

router.delete('/bulk', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.filter(
          (id: unknown) => typeof id === 'string' && mongoose.isValidObjectId(id),
        )
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
    const retentionDate = new Date(
      Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const eligibleCount = await ProductModel.countDocuments({
      _id: { $in: ids },
      isDelete: true,
      archivedAt: { $lte: retentionDate },
    });
    if (eligibleCount !== ids.length)
      return res.status(409).json({
        success: false,
        message: `Products must stay archived for ${ARCHIVE_RETENTION_DAYS} days before permanent deletion.`,
      });
    const result = await ProductModel.deleteMany({
      _id: { $in: ids },
      isDelete: true,
      archivedAt: { $lte: retentionDate },
    });
    await invalidateCatalog();
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const product = await ProductModel.findById(req.params.id).lean();
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found.' });
    if (
      !product.isDelete ||
      !product.archivedAt ||
      product.archivedAt >
        new Date(Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    )
      return res.status(409).json({
        success: false,
        message: `Products must stay archived for ${ARCHIVE_RETENTION_DAYS} days before permanent deletion.`,
      });
    if (String(req.body.confirmationName || '') !== product.name)
      return res.status(400).json({
        success: false,
        message: 'Type the exact product name to permanently delete it.',
      });
    await ProductModel.deleteOne({ _id: product._id });
    await invalidateCatalog();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
