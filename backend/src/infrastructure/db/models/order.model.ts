/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Schema } from 'mongoose';
import { IOrderDocument } from '../../../domain/interfaces/order.interface';

const OrderedProductSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    artworkUrl: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    address: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    customerName: {
      type: String,
      required: true,
    },
    orderNotes: {
      type: String,
      default: '',
    },
    products: [OrderedProductSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'],
      default: 'PLACED',
    },
    platform: {
      type: String,
      enum: ['WEB', 'TIKTOK', 'SHOPEE'],
      default: 'WEB',
    },

    address: AddressSchema,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    easyparcelOrderNo: {
      type: String,
      default: '',
    },
    easyparcelAwb: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });

const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);

export default OrderModel;
