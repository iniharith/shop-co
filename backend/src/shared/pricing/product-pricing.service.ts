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

export class CartPriceChangedError extends Error {
    constructor() {
        super('Product price changed. Please review the updated cart total and confirm your order again.');
        this.name = 'CartPriceChangedError';
    }
}

export const cartPriceChanged = (previous: number | undefined, current: number): boolean =>
    previous === undefined || !Number.isFinite(previous) || Math.round(previous * 100) !== Math.round(current * 100);

const areaSubtotal = (product: IProduct, configuration: IProductConfiguration | undefined, quantity: number): number | null => {
    const rule = product.areaPricing;
    const area = configuration?.area;
    if (!rule?.enabled || !area) return null;
    const factor = area.unit === rule.unit ? 1 : area.unit === 'in' && rule.unit === 'ft' ? 1 / 144 : area.unit === 'm' && rule.unit === 'ft' ? 10.7639104167 : 1;
    const squareUnits = area.width * area.height * factor;
    if (!Number.isFinite(squareUnits) || squareUnits <= 0) throw new Error('A valid custom size is required');
    const billedArea = rule.rounding === 'ceil' ? Math.ceil(Math.max(squareUnits, rule.minimumArea || 0)) : Math.max(squareUnits, rule.minimumArea || 0);
    const matrixEnabled = Boolean(product.matrixPricing?.enabled);
    const rate = matrixEnabled
        ? resolveMatrixSubtotal(product, quantity, configuration) / quantity
        : Number(rule.pricePerSquareUnit ?? product.price);
    const dimensions = matrixEnabled ? matrixDimensionNames(product) : new Set<string>();
    const addons = sumAddons(product, configuration, (name) => !dimensions.has(name));
    return billedArea * (rate + addons.perUnit) * quantity + addons.fixed;
};

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

const matrixOption = (product: IProduct, field: 'material' | 'laminate' | 'lamination' | 'design', fallback: RegExp) =>
    product.printingOptions?.find((option) => option.matrixField === field) ||
    product.printingOptions?.find((option) => !option.matrixField && fallback.test(option.name));

const matrixDimensions = (product: IProduct) => [
    { field: 'material' as const, option: matrixOption(product, 'material', /material|format|package/i) },
    { field: 'laminate' as const, option: matrixOption(product, 'laminate', product.category === 'paper-bag' ? /^$/ : /lamination|sides|packaging/i) },
    { field: 'lamination' as const, option: matrixOption(product, 'lamination', product.category === 'paper-bag' ? /lamination|sides|packaging/i : /^$/) },
    { field: 'design' as const, option: matrixOption(product, 'design', product.category === 'paper-bag' ? /design|size/i : /^$/) },
].filter((dimension): dimension is { field: 'material' | 'laminate' | 'lamination' | 'design'; option: NonNullable<typeof dimension.option> } => Boolean(dimension.option));

const matrixDimensionNames = (product: IProduct): Set<string> => {
    return new Set(matrixDimensions(product).map(({ option }) => option.name));
};

const resolveMatrixSubtotal = (product: IProduct, quantity: number, configuration: IProductConfiguration | undefined): number => {
    const dimensions = matrixDimensions(product);
    const matrixRow = dimensions.length ? product.matrixPricing?.pricingData.find((row: any) =>
        dimensions.every(({ field, option }) => String(row[field] || '') === selectedValueForOption(configuration, option.name))
    ) : undefined;

    if (matrixRow) {
        const availableQuantities = Object.keys(matrixRow.quantityPrices || {}).map(Number).sort((a, b) => a - b);
        if (availableQuantities.length === 0) throw new Error('Selected product variation has no published price');
        const eligibleTiers = availableQuantities.filter((candidate: number) => candidate <= quantity);
        if (matrixRow.priceMode === 'perUnit' && eligibleTiers.length === 0) {
            throw new Error('Selected quantity is below the minimum published quantity');
        }
        if (matrixRow.priceMode !== 'perUnit' && !Object.prototype.hasOwnProperty.call(matrixRow.quantityPrices, quantity)) {
            throw new Error('Selected quantity has no published price');
        }
        const tierQuantity = matrixRow.priceMode === 'perUnit'
            ? eligibleTiers[eligibleTiers.length - 1]
            : quantity;
        const qPrices: any = matrixRow.quantityPrices[tierQuantity];
        let exactPrice = 0;
        if (qPrices && typeof qPrices === 'object') {
            const gridSize = (configuration?.pricingSize || configuration?.fulfillmentSize || '').trim();
            if (!Object.prototype.hasOwnProperty.call(qPrices, gridSize)) {
                throw new Error('Selected size has no published price');
            }
            exactPrice = qPrices[gridSize];
        } else {
            exactPrice = qPrices || 0;
        }
        return matrixRow.priceMode === 'perUnit' ? exactPrice * quantity : exactPrice;
    }
    if (dimensions.length) {
        throw new Error('Selected product variation is not available');
    }
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
    if (product.maximumQuantity !== undefined && qty > product.maximumQuantity) {
        throw new Error(`Orders above ${product.maximumQuantity} pieces require a manual quote`);
    }
    const fixedPrice = configuration?.design?.type === 'service' ? DESIGN_SERVICE_FEE : 0;
    let subtotal = 0;

    const customAreaSubtotal = areaSubtotal(product, configuration, qty);
    if (customAreaSubtotal !== null) {
        const lineTotal = customAreaSubtotal + fixedPrice;
        return { unitPrice: customAreaSubtotal / qty, fixedPrice, lineTotal, pricingVersion: PRICING_VERSION };
    }

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
