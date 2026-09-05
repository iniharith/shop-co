/**
 * Coded by Harith
 * Kampungcetak ®
 * One-time backfill: fill lifecycle fields for products that predate the
 * catalog editor. Assigns slug/status/archivedAt/viewCount safely.
 * Usage: npm run backfill:products
 */
import { config } from 'dotenv';
import connectDB from '../../config/db.config';
import ProductModel from '../../infrastructure/db/models/product.model';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const main = async () => {
  config();
  const dryRun = process.env.DRY_RUN === '1';
  if (dryRun) console.log('DRY RUN: no writes will be made.');
  await connectDB();

  const products = await ProductModel.find({}).select('_id name slug category status isDelete archivedAt viewCount updatedAt').lean();
  const usedSlugs = new Set(products.map(product => product.slug).filter(Boolean));

  let slugged = 0;
  let statused = 0;
  let archived = 0;
  let viewCounted = 0;

  for (const product of products) {
    const updates: Record<string, unknown> = {};

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
      if (!dryRun) await ProductModel.updateOne({ _id: product._id }, { $set: updates });
    }
  }

  console.log([
    `Slugs assigned: ${slugged}`,
    `Status set to published: ${statused}`,
    `Archived timestamps backfilled: ${archived}`,
    `View counts zeroed: ${viewCounted}`,
    `Products scanned: ${products.length}`,
  ].join('\n'));
  if (dryRun) console.log('DRY RUN completed — no data was changed.');
  process.exit(0);
};

main().catch((error) => {
  console.error('Product lifecycle backfill failed:', error);
  process.exit(1);
});