/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { IProduct } from "../../domain/interfaces/product.interface";
import { IProductConfiguration } from "../../domain/interfaces/cart.interface";

/**
 * Server-side product pricing engine.
 * Mirrors the storefront pricing rules (frontend/src/components/page-sections/shop/product-details.tsx)
 * so the backend — not the client — decides cart and order line prices.
 */

export const DESIGN_SERVICE_FEE = 100;
const PRICING_VERSION = 'catalog-v1';

const PHOTOBOOK_PRICES: Record<string, Record<string, Record<string, number>>> = {
    "HARDCOVER": {
        "6X6": { "40 PAGES": 109, "60 PAGES": 119, "100 PAGES": 129 },
        "8X6": { "40 PAGES": 129, "60 PAGES": 139, "100 PAGES": 149 }
    },
    "SOFTCOVER": {
        "6X6": { "40 PAGES": 49, "60 PAGES": 59, "100 PAGES": 69 },
        "8X6": { "40 PAGES": 55, "60 PAGES": 65, "100 PAGES": 75 }
    }
};

const TSHIRT_PRICES: Record<string, Record<string, number>> = {
    "Round Neck": { "1": 39, "10": 29, "20": 25, "30": 24, "50": 22, "100": 20 },
    "Muslimah": { "1": 49, "10": 39, "20": 35, "30": 34, "50": 32, "100": 30 },
    "Kids": { "1": 39, "10": 29, "20": 25, "30": 24, "50": 22, "100": 20 },
    "Sweater Lycra": { "1": 119, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
    "Baseball Lycra": { "1": 119, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
    "Versity Lycra": { "1": 150, "10": 120, "20": 110, "30": 99, "50": 95, "100": 79 },
    "Korporat Shortsleeve": { "1": 120, "10": 99, "20": 89, "30": 79, "50": 75, "100": 65 },
    "Korporat Longsleeve": { "1": 130, "10": 109, "20": 99, "30": 89, "50": 85, "100": 75 }
};
const TSHIRT_TIERS = [100, 50, 30, 20, 10, 1];

export interface ProductPricingResult {
    unitPrice: number;
    fixedPrice: number;
    lineTotal: number;
    pricingVersion: string;
}

interface SelectedValue {
    label: string;
    priceAdd: number;
}

const selectedValues = (configuration: IProductConfiguration | undefined, matcher: RegExp): SelectedValue[] => {
    const entry = (configuration?.selections || []).find((selection) => matcher.test(selection.name));
    if (!entry) return [];
    return (entry.values || []).map((value) => ({
        label: String(value.label || '').trim(),
        priceAdd: Number(value.priceAdd) || 0,
    }));
};

const selectedLabel = (configuration: IProductConfiguration | undefined, matcher: RegExp): string => {
    const values = selectedValues(configuration, matcher);
    return values.length > 0 ? values[0].label : '';
};

// Price add-ons only from the server-side product definition. Client prices are ignored.
const sumAddons = (product: IProduct, configuration: IProductConfiguration | undefined, filter?: (name: string) => boolean): number => {
    const optionNames = new Set((product.printingOptions || []).map((option) => option.name));
    let total = 0;
    for (const selection of configuration?.selections || []) {
        if (!optionNames.has(selection.name)) continue;
        if (filter && !filter(selection.name)) continue;
        const option = product.printingOptions?.find((candidate) => candidate.name === selection.name);
        for (const value of selection.values || []) {
            if (value.label === undefined || value.label === null) continue;
            const match = option?.options?.find((candidate) => candidate.label === value.label);
            total += match ? (Number(match.priceAdd) || 0) : 0;
        }
    }
    return total;
};

const selectedValueForOption = (configuration: IProductConfiguration | undefined, optionName: string | undefined): string => {
    if (!optionName) return '';
    const entry = (configuration?.selections || []).find((selection) => selection.name === optionName);
    return entry?.values?.[0]?.label !== undefined ? String(entry.values[0].label).trim() : '';
};

const resolveMatrixSubtotal = (product: IProduct, quantity: number, configuration: IProductConfiguration | undefined): number => {
    const options = product.printingOptions || [];
    const materialOptName = options.find((option) => /material|format|package/i.test(option.name))?.name;
    const laminationOptName = options.find((option) => /lamination|sides|packaging/i.test(option.name))?.name;

    const selectedMaterial = selectedValueForOption(configuration, materialOptName);
    const selectedLamination = selectedValueForOption(configuration, laminationOptName);

    let matrixRow: any = null;
    if (product.category === 'paper-bag') {
        const designOptName = options.find((option) => /design|size/i.test(option.name))?.name;
        const selectedDesign = selectedValueForOption(configuration, designOptName);
        matrixRow = product.matrixPricing?.pricingData.find((row: any) =>
            row.material === selectedMaterial && row.lamination === selectedLamination && row.design === selectedDesign
        );
    } else {
        matrixRow = product.matrixPricing?.pricingData.find((row: any) =>
            row.material === selectedMaterial && row.laminate === selectedLamination
        );
    }

    if (matrixRow) {
        const availableQuantities = Object.keys(matrixRow.quantityPrices || {}).map(Number).sort((a, b) => a - b);
        const qPrices: any = matrixRow.quantityPrices[quantity] ?? matrixRow.quantityPrices[availableQuantities[0]];
        let exactPrice = 0;
        if (qPrices && typeof qPrices === 'object') {
            const gridSize = (configuration?.fulfillmentSize || '').trim();
            exactPrice = qPrices[gridSize] || Object.values(qPrices)[0] || 0;
        } else {
            exactPrice = qPrices || 0;
        }
        return exactPrice;
    }
    // fallback if no combination exists (matches storefront behavior)
    return product.price * quantity;
};

/**
 * Computes the authoritative line pricing for a product + configuration + quantity.
 * unitPrice is the per-unit equivalent (lineTotal-fixedPrice)/quantity so cart/order
 * displays stay consistent with the storefront summary.
 */
export const computeProductPricing = (
    product: IProduct,
    quantity: number,
    configuration?: IProductConfiguration
): ProductPricingResult => {
    const qty = Number.isInteger(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;
    const fixedPrice = configuration?.design?.type === 'service' ? DESIGN_SERVICE_FEE : 0;
    const category = (product.category || '').toLowerCase();
    let subtotal = 0;

    if (category === 'photobook') {
        const unitPrice = PHOTOBOOK_PRICES[selectedLabel(configuration, /material/i)]?.[selectedLabel(configuration, /size/i)]?.[selectedLabel(configuration, /pages/i)] || 0;
        subtotal = unitPrice * qty;
    } else if (category === 'sublimation-tshirt') {
        const type = selectedLabel(configuration, /type/i) || 'Round Neck';
        let tier = 1;
        for (const candidate of TSHIRT_TIERS) {
            if (qty >= candidate) { tier = candidate; break; }
        }
        const basePrice = TSHIRT_PRICES[type]?.[String(tier)] ?? TSHIRT_PRICES['Round Neck']['1'];
        const addons = sumAddons(product, configuration, (name) => /add on/i.test(name));
        subtotal = (basePrice + addons) * qty;
    } else if (product.matrixPricing?.enabled) {
        subtotal = resolveMatrixSubtotal(product, qty, configuration);
    } else {
        const addons = sumAddons(product, configuration);
        subtotal = (product.price + addons) * qty;
    }

    const lineTotal = subtotal + fixedPrice;
    const unitPrice = qty > 0 ? subtotal / qty : 0;
    return { unitPrice, fixedPrice, lineTotal, pricingVersion: PRICING_VERSION };
};
