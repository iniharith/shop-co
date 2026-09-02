/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Schema } from 'mongoose';
import { ICartDocument } from '../../../domain/interfaces/cart.interface';

const ConfigurationSchema = new Schema(
  {
    version: { type: Number, default: 1 },
    fulfillmentSize: { type: String, default: '' },
    selections: [{
      _id: false,
      name: { type: String, required: true },
      values: [{
        _id: false,
        label: { type: String, required: true },
        priceAdd: { type: Number, default: 0 },
      }],
    }],
    design: {
      _id: false,
      type: { type: String, enum: ['upload', 'service', 'variation'] },
      label: { type: String },
      priceAdd: { type: Number, default: 0 },
      variationIndex: { type: Number },
      image: { type: String },
    },
  },
  { _id: false }
);

const CartItemSchema = new Schema(
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
    artworkUrl: {
      type: String,
      default: '',
    },
    configuration: { type: ConfigurationSchema },
    configurationKey: { type: String, default: '' },
    unitPrice: { type: Number, min: 0 },
    fixedPrice: { type: Number, min: 0, default: 0 },
    lineTotal: { type: Number, min: 0 },
    pricingVersion: { type: String, default: '' },
  },
  { _id: false }
);

const CartSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, 
    },
    items: [CartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const CartModel = mongoose.model<ICartDocument>('Cart', CartSchema);

export default CartModel;
