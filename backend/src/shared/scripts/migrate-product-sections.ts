import { config } from 'dotenv';
import connectDB from '../../config/db.config';
import ProductModel from '../../infrastructure/db/models/product.model';
import { getProductSections } from '../constants/productSections';

const main = async () => {
  config();
  await connectDB();

  const products = await ProductModel.find({}, { _id: 1, name: 1, category: 1, sections: 1 });
  let updated = 0;

  for (const product of products) {
    const sections = getProductSections(product.category);
    if (JSON.stringify(product.sections || []) === JSON.stringify(sections)) continue;
    await ProductModel.updateOne({ _id: product._id }, { $set: { sections } });
    updated += 1;
  }

  console.log(`Updated ${updated} of ${products.length} product section records.`);
  process.exit(0);
};

main().catch((error) => {
  console.error('Product section migration failed:', error);
  process.exit(1);
});
