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
}

export interface ISize {
    stock: number;
    size: string;
}