/**
 * Coded by Harith
 * Kampungcetak ®
 */
export interface IPrintingOption {
    name: string;
    isMultiSelect?: boolean;
    priceMode?: 'perUnit' | 'fixed';
    options: { label: string; priceAdd: number }[];
}

export interface IProduct {
    _id: string;
    name: string;
    description: string;
    price: number; // Base price
    maximumQuantity?: number;
    category: string;
    sizes: ISize[]; // Keep for legacy
    variations?: IVariation[];
    printingOptions?: IPrintingOption[];
    images: string[];
    createdAt: Date;
    updatedAt: Date;
    rating: number;
    discount: number;
    originalPrice: number;
    matrixPricing?: {
        enabled: boolean;
        hideQuantityGrid?: boolean;
        pricingData: {
            laminate?: string;
            lamination?: string;
            design?: string;
            material: string;
            priceMode?: 'total' | 'perUnit';
            quantityPrices: Record<number, number | Record<string, number>>;
        }[];
    };
    storefrontLabels?: { formatMaterialTitle?: string; variationTitle?: string };
    areaPricing?: { enabled: boolean; unit?: 'ft' | 'in' | 'm'; pricePerSquareUnit: number; minimumArea?: number; rounding?: 'none' | 'ceil' };
    catalogId?: string;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    sections?: string[];
    averageRating?: number;
    reviewCount?: number;
    specifications?: {
        material?: string;
        frame?: string;
        dimensions?: string;
        weight?: string;
        finish?: string;
        color?: string;
        customFields?: Record<string, string | number | boolean>;
    };
    packageContents?: string[];
    installationInstructions?: string;
    productionTurnaround?: {
        standardDays?: number;
        expressDays?: number;
        notes?: string;
    };
    warrantyInfo?: string;
    customerPhotos?: string[];
    reviews?: Array<{
        userId?: string;
        userName?: string;
        rating: number;
        title?: string;
        comment?: string;
        images?: string[];
        verifiedPurchase?: boolean;
        createdAt?: string | Date;
    }>;
}

export interface ISize {
    stock: number;
    size: string;
    images?: string[];
}

export interface IVariation {
    name: string;
    stock: number;
    lowStockThreshold?: number;
    images?: string[];
}
