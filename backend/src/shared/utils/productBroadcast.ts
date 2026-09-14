import { REDIS_CHANNELS } from '../constants/redis.constant';
import { RedisService } from '../../infrastructure/redis/redis';
import { getAdminNamespace, getClientNamespace } from '../../infrastructure/socket/socketRegistry';

const redisService = new RedisService();

export const emitProductUpdated = async (product: any, action: 'created' | 'updated' | 'archived' = 'updated') => {
  const message = {
    action,
    product,
    productId: product?._id ? String(product._id) : undefined,
    slug: product?.slug ? String(product.slug) : undefined,
  };

  for (const namespace of [getClientNamespace(), getAdminNamespace()]) {
    if (!namespace) continue;
    try {
      namespace.emit('product_updated', message);
    } catch (error) {
      console.error('Failed to emit product socket event locally:', error);
    }
  }

  try {
    await redisService.publish(REDIS_CHANNELS.PRODUCT_UPDATED, JSON.stringify(message));
  } catch (error) {
    console.error('Failed to publish product socket event:', error);
  }
};
