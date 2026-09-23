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
    storefrontLabels?: { formatMaterialTitle?: string; variationTitle?: string };
    areaPricing?: {
        enabled: boolean;
        unit?: 'ft' | 'in' | 'm';
        pricePerSquareUnit: number;
        minimumArea?: number;
        rounding?: 'none' | 'ceil';
    };
}

export interface ICatalogSize {
    size: string;
    stock: number;
    lowStockThreshold?: number;
}

export interface ICatalogPrintingOption {
    name: string;
    isMultiSelect?: boolean;
    priceMode?: 'perUnit' | 'fixed';
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
    priceMode?: 'total' | 'perUnit';
    quantityPrices: Record<string, any>;
}
