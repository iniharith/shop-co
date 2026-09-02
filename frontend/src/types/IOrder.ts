/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { IProduct } from ".";
import { IProductConfiguration } from "./ICart";

export interface IOrderedProduct {
    product: IProduct;
    size: string;
    quantity: number;
    price: number;
    unitPrice?: number;
    fixedPrice?: number;
    lineTotal?: number;
    pricingVersion?: string;
    configuration?: IProductConfiguration;
    configurationKey?: string;
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
