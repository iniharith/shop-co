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

export interface ProductPricingResult {
    unitPrice: number;
    fixedPrice: number;
    lineTotal: number;
    pricingVersion: string;
}

// Price add-ons only from the server-side product definition. Client prices are ignored.
const sumAddons = (product: IProduct, configuration: IProductConfiguration | undefined, filter?: (name: string) => boolean): { perUnit: number; fixed: number } => {
    const optionNames = new Set((product.printingOptions || []).map((option) => option.name));
    let perUnit = 0;
    let fixed = 0;
    for (const selection of configuration?.selections || []) {
        if (!optionNames.has(selection.name)) continue;
        if (filter && !filter(selection.name)) continue;
        const option = product.printingOptions?.find((candidate) => candidate.name === selection.name);
        for (const value of selection.values || []) {
            if (value.label === undefined || value.label === null) continue;
            const match = option?.options?.find((candidate) => candidate.label === value.label);
            const amount = match ? (Number(match.priceAdd) || 0) : 0;
            if (option?.priceMode === 'fixed') fixed += amount;
            else perUnit += amount;
        }
    }
    return { perUnit, fixed };
};

const selectedValueForOption = (configuration: IProductConfiguration | undefined, optionName: string | undefined): string => {
    if (!optionName) return '';
    const entry = (configuration?.selections || []).find((selection) => selection.name === optionName);
    return entry?.values?.[0]?.label !== undefined ? String(entry.values[0].label).trim() : '';
};

const matrixDimensionNames = (product: IProduct): Set<string> => {
    const options = product.printingOptions || [];
    const names = new Set<string>();
    const material = options.find((option) => /material|format|package/i.test(option.name))?.name;
    const lamination = options.find((option) => /lamination|sides|packaging/i.test(option.name))?.name;
    if (material) names.add(material);
    if (lamination) names.add(lamination);
    if (product.category === 'paper-bag') {
        const design = options.find((option) => /design|size/i.test(option.name))?.name;
        if (design) names.add(design);
    }
    return names;
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
        const eligibleTiers = availableQuantities.filter((candidate: number) => candidate <= quantity);
        const tierQuantity = matrixRow.priceMode === 'perUnit'
            ? eligibleTiers[eligibleTiers.length - 1] ?? availableQuantities[0]
            : quantity;
        const qPrices: any = matrixRow.quantityPrices[tierQuantity] ?? matrixRow.quantityPrices[availableQuantities[0]];
        let exactPrice = 0;
        if (qPrices && typeof qPrices === 'object') {
            const gridSize = (configuration?.fulfillmentSize || '').trim();
            exactPrice = qPrices[gridSize] || Object.values(qPrices)[0] || 0;
        } else {
            exactPrice = qPrices || 0;
        }
        return matrixRow.priceMode === 'perUnit' ? exactPrice * quantity : exactPrice;
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
    let subtotal = 0;

    if (product.matrixPricing?.enabled) {
        const dimensions = matrixDimensionNames(product);
        const addons = sumAddons(product, configuration, (name) => !dimensions.has(name));
        subtotal = resolveMatrixSubtotal(product, qty, configuration) + addons.perUnit * qty + addons.fixed;
    } else {
        const addons = sumAddons(product, configuration);
        subtotal = (product.price + addons.perUnit) * qty + addons.fixed;
    }

    const lineTotal = subtotal + fixedPrice;
    const unitPrice = qty > 0 ? subtotal / qty : 0;
    return { unitPrice, fixedPrice, lineTotal, pricingVersion: PRICING_VERSION };
};
