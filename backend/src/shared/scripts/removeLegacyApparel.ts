import { config } from 'dotenv';
import connectDB from '../../config/db.config';
import ProductModel from '../../infrastructure/db/models/product.model';

const names = [
  'Brown Shirt',
  'Green Shirt',
  'Jacket',
  'Liquid - TShirt',
  'Black Skull Pant',
  'Gray Skull Pant',
  'Pink Shirt',
  'Salty - TShirt',
];

const main = async () => {
  config();
  await connectDB();
  const result = await ProductModel.updateMany({ name: { $in: names } }, { $set: { isDelete: true } });
  console.log(`Soft-deleted ${result.modifiedCount} legacy products.`);
  process.exit(0);
};

main().catch((error) => {
  console.error('Legacy product removal failed:', error);
  process.exit(1);
});
