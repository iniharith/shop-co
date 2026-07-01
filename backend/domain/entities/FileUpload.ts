/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IFileUpload extends Document {
  userId: string;
  orderId?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  uploadedAt: Date;
  notes?: string;
  adminReviewed: boolean;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileUploadSchema = new Schema<IFileUpload>(
  {
    userId: { type: String, required: true, index: true },
    orderId: { type: String, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    thumbnailPath: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    notes: { type: String },
    adminReviewed: { type: Boolean, default: false },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const FileUpload = mongoose.model<IFileUpload>('FileUpload', FileUploadSchema);
