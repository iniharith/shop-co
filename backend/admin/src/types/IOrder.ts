/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { IProduct } from "./IProduct";
import { IUser } from "./api";

export interface IOrderedProduct {
    product: IProduct;
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
    _id: string;
    userId: IUser;
    customerName: string;
    orderNotes?: string;
    products: IOrderedProduct[];
    totalAmount: number;
    paymentMethod: 'COD' | 'ONLINE';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
    orderStatus: 'PLACED' | 'IN_PROGRESS' | 'PENDING_ARTWORK' | 'ARTWORK_REVIEWED' | 'ARTWORK_REJECTED' | 'IN_DESIGN' | 'PEMBETULAN' | 'DONE_DESIGN' | 'IN_PRODUCTION' | 'PRINT_AWB' | 'DONE_PRINTING' | 'PACKAGING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED' | 'FAILED';
    easyparcelOrderNo?: string;
    easyparcelAwb?: string;
    easyparcelShipmentId?: string;
    easyparcelBookingStatus?: 'submitted' | 'awb_pending' | 'booked' | 'failed';
    trackingNumber?: string;
    awbUrl?: string;
    awbUrlsByFormat?: { A4?: string; A5?: string; A6?: string };
    trackingUrl?: string;
    courier?: string;
    shippingPrice?: number;
    easyparcelServiceId?: string;
    shippingWeight?: number;
    shippingDimensions?: { width: number; length: number; height: number };
    shippingCollectionDate?: string;
    shippingCustomerPhone?: string;
    shippingCustomerEmail?: string;
    deliveryBoy?: string;
    address: IAddress;
    isDeleted?: boolean;
    isArchived?: boolean;
    createdAt: string;
    updatedAt: string;
}
