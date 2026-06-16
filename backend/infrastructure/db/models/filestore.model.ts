import mongoose, { Schema, Document } from 'mongoose';

export interface IFileEntry {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface IFileStoreDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  uploadToken: string;
  customerName: string;
  customerEmail: string;
  files: IFileEntry[];
  tokenExpiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileEntrySchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FileStoreSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    uploadToken: { type: String, required: true, unique: true },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    files: [FileEntrySchema],
    tokenExpiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FileStoreModel = mongoose.model<IFileStoreDocument>('FileStore', FileStoreSchema);
export default FileStoreModel;
