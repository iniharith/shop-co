import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  userId: string;
  productId: string;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
}, { timestamps: true });

WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
