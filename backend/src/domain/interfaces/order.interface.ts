/**
 * Coded by Harith
 * Kampungcetak ®
 */
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
  state?: string;
  postalCode: string;
  country: string;
  address: string;
}

export interface IOrder {
  userId: Types.ObjectId | IUser | string;
  trackingNumber?: string;
  easyparcelOrderNo?: string;
  easyparcelAwb?: string;
  easyparcelShipmentId?: string;
  easyparcelBookingStatus?: 'submitted' | 'awb_pending' | 'booked' | 'failed';
  awbUrl?: string;
  awbUrlsByFormat?: { A4?: string; A5?: string; A6?: string };
  trackingUrl?: string;
  courier?: string;
  shippingPrice?: number;
  easyparcelServiceId?: string;
  shippingWeight?: number;
  shippingDimensions?: { width: number; length: number; height: number };
  shippingCollectionDate?: Date;
  shippingCustomerPhone?: string;
  shippingCustomerEmail?: string;
  easyparcelShipmentStatusCode?: number;
  easyparcelStatusUpdatedAt?: Date;
  easyparcelTrackingEvents?: Array<{
    status: string;
    description: string;
    location: string;
    timestamp: Date;
  }>;
  customerName: string;
  orderNotes?: string;
  products: IOrderedProduct[];
  totalAmount: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: 'PLACED' | 'IN_PROGRESS' | 'PENDING_ARTWORK' | 'ARTWORK_REVIEWED' | 'ARTWORK_REJECTED' | 'IN_DESIGN' | 'PEMBETULAN' | 'DONE_DESIGN' | 'IN_PRODUCTION' | 'HOLD_PRINTING' | 'DONE_PRINTING' | 'PACKAGING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED' | 'FAILED';
  platform?: 'WEB' | 'TIKTOK' | 'SHOPEE';
  address: IAddress;
  isDeleted?: boolean;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}
