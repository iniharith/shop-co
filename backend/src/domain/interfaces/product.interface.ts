/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Document } from "mongoose";

export interface IProduct {
    name: string;
    description: string;
    price: number;
    category: string;
    sections?: string[];
    sizes: ISize[];
    images: string[];
    createdAt: Date;
    updatedAt: Date;
    rating?: number;
    catalogId?: string;
    originalPrice?: number;
    discount?: number;
    printingOptions?: IProductPrintingOption[];
    matrixPricing?: IProductMatrixPricing;
    specifications?: IProductSpecifications;
    packageContents?: string[];
    installationInstructions?: string;
    productionTurnaround?: IProductionTurnaround;
    warrantyInfo?: string;
    customerPhotos?: string[];
    reviews?: IProductReview[];
}

export interface IProductSpecifications {
    material?: string;
    frame?: string;
    dimensions?: string;
    weight?: string;
    finish?: string;
    color?: string;
    customFields?: Record<string, string>;
}

export interface IProductionTurnaround {
    standardDays?: number;
    expressDays?: number;
    notes?: string;
}

export interface IProductReview {
    userId: string;
    userName?: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
    verifiedPurchase?: boolean;
    createdAt: Date;
    helpfulCount?: number;
}

export interface IProductPrintingOption {
    name: string;
    isMultiSelect?: boolean;
    options: IProductOptionValue[];
}

export interface IProductOptionValue {
    label: string;
    priceAdd: number;
}

export interface IProductMatrixPricing {
    enabled: boolean;
    hideQuantityGrid?: boolean;
    pricingData: IProductMatrixRow[];
}

export interface IProductMatrixRow {
    material: string;
    laminate?: string;
    lamination?: string;
    design?: string;
    quantityPrices: Record<string, any>;
}


export interface ISize {
    stock: number;
    size: string;
    lowStockThreshold?: number;
}


export interface IProductDocument extends IProduct, Document { }
