/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * One-time migration: turn a product's top-level gallery images into explicit
 * `variations[]` records so they are editable in the admin catalog editor and
 * rendered from the `variations` path on the storefront.
 *
 * The storefront only renders image-derived designs for Islamic Khat products
 * (product-details.tsx), so by default this migrates Islamic Khat products with
 * more than one image and no `variations[]` yet — exactly the products that
 * already show a design grid. Other categories are inert galleries; use
 * --category or --all-categories to opt them in deliberately.
 * Each variation is seeded with the same stock as the product's Standard size
 * so purchasing behaviour is preserved after the storefront switches from the
 * image-derived fallback to the per-variation stock model.
 *
 * Usage:
 *   npm run migrate:variations            # apply (Islamic Khat default)
 *   npm run migrate:variations -- --dry   # preview only
 *   npm run migrate:variations -- --category "ISLAMIC KHAT"
 *   npm run migrate:variations -- --all-categories
 *
 * Connection: uses MONGO_URI from backend/.env by default. Override locally
 * with a direct-connection string when the SRV host is unreachable:
 *   $env:MONGO_URI="mongodb://<user>:<pass>@<host>.mongodb.net:27017/?ssl=true&directConnection=true&authSource=admin"
 * NOTE: directConnection pins to one node; if it is a secondary, the writes
 * fail with "not primary". Prefer running via Railway where the full URI works.
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
import ProductModel from '../../infrastructure/db/models/product.model';

const variationLabelFromImage = (image: string, index: number) => {
  const pathParts = image.split('/').filter(Boolean);
  const folder = pathParts[pathParts.length - 2] || '';
  const filename = (pathParts[pathParts.length - 1] || `variation-${index + 1}`).replace(/\.[^.]+$/, '');
  const sequence = filename.match(/(\d+)$/)?.[1] || String(index + 1).padStart(2, '0');
  const productCode = folder
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
  return `${productCode || 'DESIGN'}-M${sequence.padStart(2, '0')}`;
};

const main = async () => {
  config();

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. Run from the backend directory or set MONGO_URI first.');
    process.exit(1);
  }
  if (uri.startsWith('mongodb+srv://')) {
    console.warn(
      '[WARN] Using SRV URI directly (no directConnection strip). If connection fails locally, override MONGO_URI with the direct-connection string.',
    );
  }
  await mongoose.connect(uri, {
    dbName: 'shop-co',
    authSource: 'admin',
    serverSelectionTimeoutMS: 15000,
  });

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry') || args.includes('--dry-run');
  const allCategories = args.includes('--all-categories');
  const categoryArg = args
    .find(arg => arg.startsWith('--category='))
    ?.split('=')[1]
    ?.trim();

  const filter: Record<string, unknown> = {
    isDelete: { $ne: true },
    'images.1': { $exists: true },
    $or: [{ variations: { $exists: false } }, { variations: { $size: 0 } }],
  };
  if (allCategories) {
    // migrate every category
  } else if (categoryArg) {
    filter.category = new RegExp(`^${categoryArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  } else {
    filter.category = new RegExp('^islamic khat$', 'i');
  }

  const products = await ProductModel.find(filter).lean();

  let wouldUpdate = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const images = (product.images || []).filter(Boolean);
    const standardSize =
      product.sizes?.find(size => String(size.size || '').trim().toLowerCase() === 'standard') ||
      product.sizes?.[0];
    const stockFromSize = Number(standardSize?.stock) || 0;
    const lowStockThreshold = standardSize?.lowStockThreshold ?? 10;

    const variations = images.map((image, index) => ({
      name: variationLabelFromImage(String(image), index),
      stock: stockFromSize,
      lowStockThreshold,
      images: [String(image)],
    }));

    if (dryRun) {
      wouldUpdate += 1;
      console.log(
        `[DRY] would seed ${variations.length} variations for "${String(product.name)}" (${product.category}) ` +
          `stock=${stockFromSize} labels=${variations.map(v => v.name).join(', ')}`,
      );
      continue;
    }

    const match = await ProductModel.updateOne(
      { _id: product._id, $or: [{ variations: { $exists: false } }, { variations: { $size: 0 } }] },
      { $set: { variations } },
    );

    if (match.modifiedCount > 0) {
      updated += 1;
      console.log(`[OK] seeded ${variations.length} variations for "${String(product.name)}" (${product.category})`);
    } else {
      skipped += 1;
      console.warn(
        `[SKIP] "${String(product.name)}" (${product.category}) already changed (variations now present).`,
      );
    }
  }

  console.log(
    `\nMigration ${dryRun ? 'dry-run' : 'complete'}: ${dryRun ? wouldUpdate : updated} product(s) ` +
      `seeded, ${skipped} skipped (${products.length} matched filter).`,
  );
  process.exit(0);
};

main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});