/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ITrackingEvent {
  status: string;
  description: string;
  location: string;
  timestamp: Date;
}

export interface IParcel extends Document {
  orderId: string;
  trackingNumber?: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  courier: string;
  service?: string;
  status: string;
  lastStatus: string;
  events: ITrackingEvent[];
  easyparcelShipmentId?: string;
  easyparcelOrderNumber?: string;
  serviceId?: string;
  awbUrl?: string;
  awbUrlsByFormat?: { A4?: string; A5?: string; A6?: string };
  trackingUrl?: string;
  bookingStatus?: 'submitted' | 'awb_pending' | 'booked' | 'failed';
  shipmentStatusCode?: number;
  providerStatusUpdatedAt?: Date;
  collectionDate?: Date;
  shippingPrice?: number;
  currency?: string;
  dimensions?: { width: number; length: number; height: number };
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
    trackingNumber: { type: String, unique: true, sparse: true, index: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    courier: { type: String, default: 'unknown' },
    service: { type: String },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'on_hold', 'drop_off', 'cancelled', 'failed'],
      default: 'pending',
    },
    lastStatus: { type: String, default: '' },
    events: { type: [TrackingEventSchema], default: [] },
    easyparcelShipmentId: { type: String, unique: true, sparse: true, index: true },
    easyparcelOrderNumber: { type: String, index: true },
    serviceId: { type: String },
    awbUrl: { type: String },
    awbUrlsByFormat: {
      A4: { type: String },
      A5: { type: String },
      A6: { type: String },
    },
    trackingUrl: { type: String },
    bookingStatus: { type: String, enum: ['submitted', 'awb_pending', 'booked', 'failed'] },
    shipmentStatusCode: { type: Number },
    providerStatusUpdatedAt: { type: Date },
    collectionDate: { type: Date },
    shippingPrice: { type: Number },
    currency: { type: String },
    dimensions: {
      width: { type: Number, default: 0 },
      length: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    weight: { type: Number, default: 1 },
    senderName: { type: String, default: 'Kampung Cetak' },
    senderPhone: { type: String, default: '' },
    senderAddress: { type: String, default: '' },
    recipientAddress: { type: String, default: '' },
    whatsappNotified: { type: Boolean, default: true },
  },
  { timestamps: true }
);
ParcelSchema.set('autoIndex', false);

export const Parcel = mongoose.model<IParcel>('Parcel', ParcelSchema);

export async function ensureParcelIndexes(): Promise<void> {
  try {
    await Parcel.createCollection();
  } catch (error: any) {
    if (error?.code !== 48 && error?.codeName !== 'NamespaceExists') throw error;
  }
  const indexes = await Parcel.collection.indexes();
  const trackingIndex = indexes.find((index) => index.name === 'trackingNumber_1');
  if (trackingIndex && (trackingIndex.unique !== true || trackingIndex.sparse !== true)) {
    await Parcel.collection.createIndex(
      { trackingNumber: 1 },
      { name: 'trackingNumber_sparse_unique_v2', unique: true, sparse: true }
    );
    try {
      await Parcel.collection.dropIndex('trackingNumber_1');
    } catch (error: any) {
      if (error?.code !== 27 && error?.codeName !== 'IndexNotFound') throw error;
    }
  }

  const currentNames = new Set((await Parcel.collection.indexes()).map((index) => index.name));
  if (!currentNames.has('orderId_1')) await Parcel.collection.createIndex({ orderId: 1 }, { name: 'orderId_1' });
  if (!currentNames.has('trackingNumber_1') && !currentNames.has('trackingNumber_sparse_unique_v2')) {
    await Parcel.collection.createIndex({ trackingNumber: 1 }, { name: 'trackingNumber_sparse_unique_v2', unique: true, sparse: true });
  }
  if (!currentNames.has('easyparcelShipmentId_1')) {
    await Parcel.collection.createIndex({ easyparcelShipmentId: 1 }, { name: 'easyparcelShipmentId_1', unique: true, sparse: true });
  }
  if (!currentNames.has('easyparcelOrderNumber_1')) {
    await Parcel.collection.createIndex({ easyparcelOrderNumber: 1 }, { name: 'easyparcelOrderNumber_1' });
  }
}
