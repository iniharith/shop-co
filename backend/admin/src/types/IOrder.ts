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
    orderStatus: 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    deliveryBoy?: string;
    address: IAddress;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt: string;
}
