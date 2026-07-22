/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IFileUpload extends Document {
  userId: string;
  orderId?: string;
  taskId?: string;
  category?: string;
  tag?: 'attachment' | 'draft' | 'for_print';
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
  botNotified: boolean;
  shareSlug?: string;
  folderId?: string;
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
    uploadedAt: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    adminReviewed: { type: Boolean, default: false },
    adminNotes: { type: String },
    botNotified: { type: Boolean, default: false },
    // Tag to classify files uploaded from task board
    tag: { type: String, enum: ['attachment', 'draft', 'for_print'] },
    // The exact share-link slug this file was uploaded through, if any.
    // This is the single source of truth linking an upload back to its
    // folder — independent of userId/orderId/taskId matching.
    shareSlug: { type: String, index: true },
    folderId: { type: String, index: true },
  },
  { timestamps: true }
);

FileUploadSchema.index({ createdAt: -1 });
FileUploadSchema.index({ taskId: 1, uploadedAt: -1 });
FileUploadSchema.index({ orderId: 1, uploadedAt: -1 });
FileUploadSchema.index({ userId: 1, uploadedAt: -1 });
FileUploadSchema.index({ shareSlug: 1, uploadedAt: -1 });

export const FileUpload = mongoose.model<IFileUpload>('FileUpload', FileUploadSchema);
