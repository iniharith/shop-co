/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Document, Types } from 'mongoose';
import { IProductDocument } from './product.interface';

export interface IProductConfiguration {
  version: number;
  fulfillmentSize: string;
  selections: Array<{
    name: string;
    values: Array<{
      label: string;
      priceAdd?: number;
    }>;
  }>;
  design?: {
    type: 'upload' | 'service' | 'variation';
    label: string;
    priceAdd?: number;
    variationIndex?: number;
    image?: string;
  };
}

export interface ICartItem {
  product: IProductDocument ; 
  size: string;
  quantity: number;
  artworkUrl?: string;
  configuration?: IProductConfiguration;
  configurationKey?: string;
  unitPrice?: number;
  fixedPrice?: number;
  lineTotal?: number;
  pricingVersion?: string;
}

export interface ICart {
  userId: Types.ObjectId; 
  items: ICartItem[];
  totalPrice: number;
}

export interface ICartDocument extends ICart, Document {}
