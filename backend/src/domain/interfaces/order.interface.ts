// domain/interfaces/order.interface.ts
import { Document, Types } from 'mongoose';
import { IUser } from './user.interface';

export interface IOrderedProduct {
  product: Types.ObjectId;
  size: string;
  quantity: number;
  price: number;
  artworkUrl?: string;
}


export interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  address: string;
}

export interface IOrder {
  userId: Types.ObjectId | IUser | string;
  customerName: string;
  orderNotes?: string;
  products: IOrderedProduct[];
  totalAmount: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: 'PLACED' | 'IN_PROGRESS' | 'PENDING_ARTWORK' | 'ARTWORK_REVIEWED' | 'ARTWORK_REJECTED' | 'IN_DESIGN' | 'PEMBETULAN' | 'DONE_DESIGN' | 'IN_PRODUCTION' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
  platform?: 'WEB' | 'TIKTOK' | 'SHOPEE';
  address: IAddress;
  isDeleted?: boolean;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}
