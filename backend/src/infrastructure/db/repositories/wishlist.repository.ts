import { Wishlist } from '../../../domain/entities/Wishlist';

class WishlistRepository {
  async add(userId: string, productId: string) {
    return Wishlist.findOneAndUpdate(
      { userId, productId },
      { userId, productId },
      { upsert: true, new: true }
    ).lean();
  }

  async remove(userId: string, productId: string) {
    return Wishlist.findOneAndDelete({ userId, productId });
  }

  async getByUser(userId: string) {
    return Wishlist.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async isFavorited(userId: string, productId: string): Promise<boolean> {
    const count = await Wishlist.countDocuments({ userId, productId });
    return count > 0;
  }
}

export default new WishlistRepository();
