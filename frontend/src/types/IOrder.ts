/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { IProduct } from ".";

export interface IOrderedProduct {
    product: IProduct;
    size: string;
    quantity: number;
    price: number;
}


export interface IAddress {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    address: string;
}

export interface IOrder {
    _id: string;
    userId: string;
    products: IOrderedProduct[];
    totalAmount: number;
    paymentMethod: 'COD' | 'ONLINE';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
    orderStatus: 'PLACED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    easyparcelAwb?: string;
    trackingNumber?: string;
    deliveryBoy?: string;
    address: IAddress;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt: string;
}
