import mongoose, { Document, Schema } from 'mongoose';

export interface ITrackingEvent {
  status: string;
  description: string;
  location: string;
  timestamp: Date;
}

export interface IParcel extends Document {
  orderId: string;
  trackingNumber: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  courier: string;
  status: string;
  lastStatus: string;
  events: ITrackingEvent[];
  easyparcelShipmentId?: string;
  awbUrl?: string;
  weight: number;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  recipientAddress: string;
  whatsappNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>({
  status: { type: String, default: '' },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

const ParcelSchema = new Schema<IParcel>(
  {
    orderId: { type: String, required: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    courier: { type: String, default: 'unknown' },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
      default: 'pending',
    },
    lastStatus: { type: String, default: '' },
    events: { type: [TrackingEventSchema], default: [] },
    easyparcelShipmentId: { type: String },
    awbUrl: { type: String },
    weight: { type: Number, default: 1 },
    senderName: { type: String, default: 'Kampung Cetak' },
    senderPhone: { type: String, default: '' },
    senderAddress: { type: String, default: '' },
    recipientAddress: { type: String, default: '' },
    whatsappNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Parcel = mongoose.model<IParcel>('Parcel', ParcelSchema);
