/**
 * Coded by Harith
 * Kampungcetak ®
 *  */
export interface ICatalogProduct {
    catalogId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    section?: string;
    rating?: number;
    originalPrice?: number;
    discount?: number;
    sizes: ICatalogSize[];
    printingOptions?: ICatalogPrintingOption[];
    matrixPricing?: ICatalogMatrixPricing;
}

export interface ICatalogSize {
    size: string;
    stock: number;
}

export interface ICatalogPrintingOption {
    name: string;
    isMultiSelect?: boolean;
    options: ICatalogOption[];
}

export interface ICatalogOption {
    label: string;
    priceAdd: number;
}

export interface ICatalogMatrixPricing {
    enabled: boolean;
    hideQuantityGrid?: boolean;
    pricingData: ICatalogMatrixRow[];
}

export interface ICatalogMatrixRow {
    material: string;
    laminate?: string;
    lamination?: string;
    design?: string;
    quantityPrices: Record<string, any>;
}