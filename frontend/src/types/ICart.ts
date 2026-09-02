/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { IProduct } from "./IProduct";

export interface IProductConfiguration {
    version: number;
    fulfillmentSize: string;
    selections: Array<{
        name: string;
        values: Array<{ label: string; priceAdd?: number }>;
    }>;
    design?: {
        type: "upload" | "service" | "variation";
        label: string;
        priceAdd?: number;
        variationIndex?: number;
        image?: string;
    };
}

export interface ICartItem {
    product: IProduct;
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
    userId: string;
    items: ICartItem[];
    totalPrice: number;
}
