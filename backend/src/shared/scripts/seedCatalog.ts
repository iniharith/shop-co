/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { config } from 'dotenv';
import connectDB from '../../config/db.config';
import ProductModel from '../../infrastructure/db/models/product.model';
import { getProductSections } from '../constants/productSections';
import { catalogProducts } from '../catalog/catalogProducts';

const main = async () => {
  config();
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const product of catalogProducts) {
    const patch: Record<string, any> = {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images || [],
      sizes: product.sizes || [],
      rating: product.rating ?? 0,
      originalPrice: product.originalPrice ?? product.price,
      discount: product.discount ?? 0,
      printingOptions: product.printingOptions ?? [],
      matrixPricing: product.matrixPricing ?? { enabled: false },
      areaPricing: product.areaPricing ?? { enabled: false },
      catalogId: product.catalogId,
      sections: getProductSections(product.category),
    };

    const existing = await ProductModel.findOne({ catalogId: product.catalogId });
    if (existing) {
      // Once created, the product database and admin publishing flow own prices.
      // Re-running bootstrap must not overwrite a staff-approved catalog record.
      skipped += 1;
    } else {
      await ProductModel.create(patch);
      created += 1;
    }
  }

  console.log(`Catalog seeded: ${created} created, ${skipped} existing products skipped (${catalogProducts.length} total).`);
  process.exit(0);
};

main().catch((error) => {
  console.error('Catalog seed failed:', error);
  process.exit(1);
});
