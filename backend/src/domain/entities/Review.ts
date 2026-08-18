import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  orderId: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000, default: '' },
  userName: { type: String, default: 'Customer' },
}, { timestamps: true });

ReviewSchema.index({ orderId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
