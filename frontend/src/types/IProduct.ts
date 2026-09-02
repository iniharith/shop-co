/**
 * Coded by Harith
 * Kampungcetak ®
 */
export interface IPrintingOption {
    name: string;
    isMultiSelect?: boolean;
    options: { label: string; priceAdd: number }[];
}

export interface IProduct {
    _id: string;
    name: string;
    description: string;
    price: number; // Base price
    category: string;
    sizes: ISize[]; // Keep for legacy
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
            laminate: string;
            material: string;
            quantityPrices: Record<number, number>;
        }[];
    };
    catalogId?: string;
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
}
