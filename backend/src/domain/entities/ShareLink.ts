/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from 'mongoose';

export type ShareAudience = 'CUSTOMER' | 'SUPPLIER';

export interface IShareLink extends Document {
  slug: string;
  folderName: string;
  taskId?: string;
  orderId?: string;
  userId?: string;
  folderId?: string;
  audience: ShareAudience;
  createdAt: Date;
  updatedAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    folderName: { type: String, required: true },
    taskId: { type: String, index: true },
    orderId: { type: String, index: true },
    userId: { type: String, index: true },
    folderId: { type: String, index: true },
    audience: { type: String, enum: ['CUSTOMER', 'SUPPLIER'], default: 'CUSTOMER', required: true, index: true },
  },
  { timestamps: true }
);

export const ShareLink = mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);
