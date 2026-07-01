/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IStatusHistory {
  status: string;
  description: string;
  timestamp: Date;
}

export interface IParcelDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  awbNumber: string;
  courier: string;
  status: string;
  statusHistory: IStatusHistory[];
  awbPdfUrl: string;
  easyparcelOrderId: string;
  uploadToken: string;
  lastWhatsappSentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    description: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ParcelSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    awbNumber: { type: String, required: true, unique: true },
    courier: { type: String, default: '' },
    status: { type: String, default: 'PENDING' },
    statusHistory: [StatusHistorySchema],
    awbPdfUrl: { type: String, default: '' },
    easyparcelOrderId: { type: String, default: '' },
    uploadToken: { type: String, default: '' },
    lastWhatsappSentStatus: { type: String, default: '' },
  },
  { timestamps: true }
);

const ParcelModel = mongoose.model<IParcelDocument>('Parcel', ParcelSchema);
export default ParcelModel;
