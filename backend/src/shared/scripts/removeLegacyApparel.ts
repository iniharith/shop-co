import { config } from 'dotenv';
import connectDB from '../../config/db.config';
import ProductModel from '../../infrastructure/db/models/product.model';
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_KEYS } from '../constants/redis.constant';

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
  const redis = new RedisService();
  await redis.delByPrefix(REDIS_KEYS.PRODUCTS);
  await redis.del(REDIS_KEYS.CATEGORIES);
  console.log(`Soft-deleted ${result.modifiedCount} legacy products.`);
  process.exit(0);
};

main().catch((error) => {
  console.error('Legacy product removal failed:', error);
  process.exit(1);
});
