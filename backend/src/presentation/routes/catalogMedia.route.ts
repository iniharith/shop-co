import { Router } from 'express';
import mongoose from 'mongoose';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import ProductModel from '../../infrastructure/db/models/product.model';
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_KEYS } from '../../shared/constants/redis.constant';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';

const router = Router();
const roles = authorizeRoles('admin', 'sysadmin', 'boss');
const redis = new RedisService();
const cachePrefix = `${REDIS_KEYS.PRODUCTS}:`;

const invalidateCatalog = async () => {
  await redis.delByPrefix(cachePrefix);
  await redis.del(REDIS_KEYS.CATEGORIES);
};

const cleanObjectKey = (value: string) => {
  const key = decodeURIComponent(String(value || '')).replace(/^\/+/, '').trim();
  if (!key || key.length > 1024 || key.includes('..') || key.includes('\\')) return null;
  return key;
};

const keyFromStoredImage = (value: string) => {
  const source = String(value || '').trim();
  if (!source) return null;

  if (!source.includes('://')) {
    if (source.startsWith('catalog/') || source.startsWith('uploads/') || source.startsWith('products/')) {
      return cleanObjectKey(source);
    }
  }

  if (source.startsWith('s3://')) {
    const withoutScheme = source.slice(5);
    const slash = withoutScheme.indexOf('/');
    if (slash < 0) return null;
    const bucket = withoutScheme.slice(0, slash);
    if (bucket !== S3_BUCKET_NAME) return null;
    return cleanObjectKey(withoutScheme.slice(slash + 1));
  }

  try {
    const parsed = new URL(source);
    const path = decodeURIComponent(parsed.pathname || '');
    const host = parsed.hostname.toLowerCase();
    const bucket = S3_BUCKET_NAME.toLowerCase();

    const catalogProxyMarker = '/api/admin/catalog/image/';
    const proxyIndex = path.indexOf(catalogProxyMarker);
    if (proxyIndex >= 0) {
      const token = path.slice(proxyIndex + catalogProxyMarker.length);
      const decodedToken = cleanObjectKey(token);
      if (!decodedToken) return null;
      return decodedToken.includes('/') ? decodedToken : `catalog/${decodedToken}`;
    }

    if (host === `${bucket}.s3.amazonaws.com` || host.startsWith(`${bucket}.s3.`) || host.startsWith(`${bucket}.s3-`)) {
      return cleanObjectKey(path);
    }

    if ((host === 's3.amazonaws.com' || host.startsWith('s3.') || host.startsWith('s3-')) && host.endsWith('amazonaws.com')) {
      const prefix = `/${S3_BUCKET_NAME}/`;
      if (path.startsWith(prefix)) return cleanObjectKey(path.slice(prefix.length));
    }

    return null;
  } catch {
    return null;
  }
};

// Public image bridge. <img> elements cannot attach the admin Bearer token, so
// this endpoint intentionally sits before auth and only permits objects from
// the configured S3 bucket.
router.get('/image', async (req, res, next) => {
  try {
    const key = keyFromStoredImage(String(req.query.src || ''));
    if (!key) {
      return res.status(400).json({ success: false, message: 'Unsupported catalog image URL.' });
    }

    const object = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      }),
    );

    if (!object.Body) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    if (object.ContentType) res.type(object.ContentType);
    if (object.ContentLength != null) res.setHeader('Content-Length', String(object.ContentLength));
    if (object.ETag) res.setHeader('ETag', object.ETag);
    res.setHeader('Cache-Control', 'public, max-age=86400');
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

router.patch('/:id/sync', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    }

    const existing = await ProductModel.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const images = Array.isArray(req.body.images)
      ? req.body.images.map((image: unknown) => String(image || '').trim()).filter(Boolean)
      : [];
    const mainImage = images[0] || '';
    const incomingSizes = Array.isArray(req.body.sizes) ? req.body.sizes : [];

    const incomingNames = new Set(
      incomingSizes.map((item: any) => String(item?.size || '').trim()).filter(Boolean),
    );
    const removedWithStock = existing.sizes.find(
      item => Number(item.stock || 0) > 0 && !incomingNames.has(String(item.size || '').trim()),
    );
    if (removedWithStock) {
      return res.status(409).json({
        success: false,
        message: `Adjust ${removedWithStock.size} stock to zero before removing or renaming it.`,
      });
    }

    const existingBySize = new Map(
      existing.sizes.map(item => [String(item.size || '').trim(), item]),
    );
    const sizes = incomingSizes
      .map((item: any) => {
        const size = String(item?.size || '').trim();
        if (!size) return null;
        const current = existingBySize.get(size);
        const variationImages = Array.isArray(item?.images)
          ? item.images.map((image: unknown) => String(image || '').trim()).filter(Boolean)
          : [];
        const linkedImages = mainImage && !variationImages.includes(mainImage)
          ? [mainImage, ...variationImages]
          : variationImages;

        return {
          size,
          stock: current ? Number(current.stock || 0) : Math.max(0, Number(item?.stock) || 0),
          lowStockThreshold:
            item?.lowStockThreshold === '' || item?.lowStockThreshold == null
              ? Number(current?.lowStockThreshold ?? 10)
              : Math.max(0, Number(item.lowStockThreshold) || 0),
          images: linkedImages.slice(0, 8),
          sku: String(item?.sku || '').trim(),
          active: item?.active !== false,
        };
      })
      .filter(Boolean);

    if (new Set(sizes.map((item: any) => item.size.toLowerCase())).size !== sizes.length) {
      return res.status(400).json({
        success: false,
        message: 'Each size or format must have a unique name.',
      });
    }

    const updated = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { $set: { images, sizes, updatedAt: new Date() } },
      { new: true, runValidators: true },
    ).lean();

    await invalidateCatalog();
    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
