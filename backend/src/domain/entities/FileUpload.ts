import mongoose, { Document, Schema } from 'mongoose';

export interface IFileUpload extends Document {
  userId: string;
  orderId?: string;
  taskId?: string;
  category?: string;
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
  shareSlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileUploadSchema = new Schema<IFileUpload>(
  {
    userId: { type: String, required: true, index: true },
    orderId: { type: String, index: true },
    taskId: { type: String, index: true },
    category: { type: String },
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
    // The exact share-link slug this file was uploaded through, if any.
    // This is the single source of truth linking an upload back to its
    // folder — independent of userId/orderId/taskId matching.
    shareSlug: { type: String, index: true },
  },
  { timestamps: true }
);

export const FileUpload = mongoose.model<IFileUpload>('FileUpload', FileUploadSchema);
