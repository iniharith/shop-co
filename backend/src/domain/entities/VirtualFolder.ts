/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IVirtualFolder extends Document {
  name: string;
  userId?: string;
  taskId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VirtualFolderSchema = new Schema<IVirtualFolder>(
  {
    name: { type: String, required: true },
    userId: { type: String, index: true },
    taskId: { type: String, index: true },
  },
  { timestamps: true }
);

VirtualFolderSchema.index({ createdAt: -1 });

export const VirtualFolder = mongoose.models.VirtualFolder || mongoose.model<IVirtualFolder>('VirtualFolder', VirtualFolderSchema);
