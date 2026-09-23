"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeProductPricing = exports.cartPriceChanged = exports.CartPriceChangedError = exports.DESIGN_SERVICE_FEE = void 0;
/**
 * Server-side product pricing engine.
 * Mirrors the storefront pricing rules (frontend/src/components/page-sections/shop/product-details.tsx)
 * so the backend — not the client — decides cart and order line prices.
 */
exports.DESIGN_SERVICE_FEE = 100;
const PRICING_VERSION = 'catalog-v1';
class CartPriceChangedError extends Error {
    constructor() {
        super('Product price changed. Please review the updated cart total and confirm your order again.');
        this.name = 'CartPriceChangedError';
    }
}
exports.CartPriceChangedError = CartPriceChangedError;
const cartPriceChanged = (previous, current) => previous === undefined || !Number.isFinite(previous) || Math.round(previous * 100) !== Math.round(current * 100);
exports.cartPriceChanged = cartPriceChanged;
const areaSubtotal = (product, configuration, quantity) => {
    var _a, _b;
    const rule = product.areaPricing;
    const area = configuration === null || configuration === void 0 ? void 0 : configuration.area;
    if (!(rule === null || rule === void 0 ? void 0 : rule.enabled) || !area)
        return null;
    const factor = area.unit === rule.unit ? 1 : area.unit === 'in' && rule.unit === 'ft' ? 1 / 144 : area.unit === 'm' && rule.unit === 'ft' ? 10.7639104167 : 1;
    const squareUnits = area.width * area.height * factor;
    if (!Number.isFinite(squareUnits) || squareUnits <= 0)
        throw new Error('A valid custom size is required');
    const billedArea = rule.rounding === 'ceil' ? Math.ceil(Math.max(squareUnits, rule.minimumArea || 0)) : Math.max(squareUnits, rule.minimumArea || 0);
    const matrixEnabled = Boolean((_a = product.matrixPricing) === null || _a === void 0 ? void 0 : _a.enabled);
    const rate = matrixEnabled
        ? resolveMatrixSubtotal(product, quantity, configuration) / quantity
        : Number((_b = rule.pricePerSquareUnit) !== null && _b !== void 0 ? _b : product.price);
    const dimensions = matrixEnabled ? matrixDimensionNames(product) : new Set();
    const addons = sumAddons(product, configuration, (name) => !dimensions.has(name));
    return billedArea * (rate + addons.perUnit) * quantity + addons.fixed;
};
// Price add-ons only from the server-side product definition. Client prices are ignored.
const sumAddons = (product, configuration, filter) => {
    var _a, _b;
    const optionNames = new Set((product.printingOptions || []).map((option) => option.name));
    let perUnit = 0;
    let fixed = 0;
    for (const selection of (configuration === null || configuration === void 0 ? void 0 : configuration.selections) || []) {
        if (!optionNames.has(selection.name))
            continue;
        if (filter && !filter(selection.name))
            continue;
        const option = (_a = product.printingOptions) === null || _a === void 0 ? void 0 : _a.find((candidate) => candidate.name === selection.name);
        for (const value of selection.values || []) {
            if (value.label === undefined || value.label === null)
                continue;
            const match = (_b = option === null || option === void 0 ? void 0 : option.options) === null || _b === void 0 ? void 0 : _b.find((candidate) => candidate.label === value.label);
            const amount = match ? (Number(match.priceAdd) || 0) : 0;
            if ((option === null || option === void 0 ? void 0 : option.priceMode) === 'fixed')
                fixed += amount;
            else
                perUnit += amount;
        }
    }
    return { perUnit, fixed };
};
const selectedValueForOption = (configuration, optionName) => {
    var _a, _b;
    if (!optionName)
        return '';
    const entry = ((configuration === null || configuration === void 0 ? void 0 : configuration.selections) || []).find((selection) => selection.name === optionName);
    return ((_b = (_a = entry === null || entry === void 0 ? void 0 : entry.values) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.label) !== undefined ? String(entry.values[0].label).trim() : '';
};
const matrixDimensionNames = (product) => {
    var _a, _b, _c;
    const options = product.printingOptions || [];
    const names = new Set();
    const material = (_a = options.find((option) => /material|format|package/i.test(option.name))) === null || _a === void 0 ? void 0 : _a.name;
    const lamination = (_b = options.find((option) => /lamination|sides|packaging/i.test(option.name))) === null || _b === void 0 ? void 0 : _b.name;
    if (material)
        names.add(material);
    if (lamination)
        names.add(lamination);
    if (product.category === 'paper-bag') {
        const design = (_c = options.find((option) => /design|size/i.test(option.name))) === null || _c === void 0 ? void 0 : _c.name;
        if (design)
            names.add(design);
    }
    return names;
};
const resolveMatrixSubtotal = (product, quantity, configuration) => {
    var _a, _b, _c, _d, _e;
    const options = product.printingOptions || [];
    const materialOptName = (_a = options.find((option) => /material|format|package/i.test(option.name))) === null || _a === void 0 ? void 0 : _a.name;
    const laminationOptName = (_b = options.find((option) => /lamination|sides|packaging/i.test(option.name))) === null || _b === void 0 ? void 0 : _b.name;
    const selectedMaterial = selectedValueForOption(configuration, materialOptName);
    const selectedLamination = selectedValueForOption(configuration, laminationOptName);
    let matrixRow = null;
    if (product.category === 'paper-bag') {
        const designOptName = (_c = options.find((option) => /design|size/i.test(option.name))) === null || _c === void 0 ? void 0 : _c.name;
        const selectedDesign = selectedValueForOption(configuration, designOptName);
        matrixRow = (_d = product.matrixPricing) === null || _d === void 0 ? void 0 : _d.pricingData.find((row) => row.material === selectedMaterial && row.lamination === selectedLamination && row.design === selectedDesign);
    }
    else {
        matrixRow = (_e = product.matrixPricing) === null || _e === void 0 ? void 0 : _e.pricingData.find((row) => row.material === selectedMaterial && row.laminate === selectedLamination);
    }
    if (matrixRow) {
        const availableQuantities = Object.keys(matrixRow.quantityPrices || {}).map(Number).sort((a, b) => a - b);
        if (availableQuantities.length === 0)
            throw new Error('Selected product variation has no published price');
        const eligibleTiers = availableQuantities.filter((candidate) => candidate <= quantity);
        if (matrixRow.priceMode === 'perUnit' && eligibleTiers.length === 0) {
            throw new Error('Selected quantity is below the minimum published quantity');
        }
        if (matrixRow.priceMode !== 'perUnit' && !Object.prototype.hasOwnProperty.call(matrixRow.quantityPrices, quantity)) {
            throw new Error('Selected quantity has no published price');
        }
        const tierQuantity = matrixRow.priceMode === 'perUnit'
            ? eligibleTiers[eligibleTiers.length - 1]
            : quantity;
        const qPrices = matrixRow.quantityPrices[tierQuantity];
        let exactPrice = 0;
        if (qPrices && typeof qPrices === 'object') {
            const gridSize = ((configuration === null || configuration === void 0 ? void 0 : configuration.pricingSize) || (configuration === null || configuration === void 0 ? void 0 : configuration.fulfillmentSize) || '').trim();
            if (!Object.prototype.hasOwnProperty.call(qPrices, gridSize)) {
                throw new Error('Selected size has no published price');
            }
            exactPrice = qPrices[gridSize];
        }
        else {
            exactPrice = qPrices || 0;
        }
        return matrixRow.priceMode === 'perUnit' ? exactPrice * quantity : exactPrice;
    }
    if (materialOptName || laminationOptName) {
        throw new Error('Selected product variation is not available');
    }
    return product.price * quantity;
};
/**
 * Computes the authoritative line pricing for a product + configuration + quantity.
 * unitPrice is the per-unit equivalent (lineTotal-fixedPrice)/quantity so cart/order
 * displays stay consistent with the storefront summary.
 */
const computeProductPricing = (product, quantity, configuration) => {
    var _a, _b;
    const qty = Number.isInteger(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;
    if (product.maximumQuantity !== undefined && qty > product.maximumQuantity) {
        throw new Error(`Orders above ${product.maximumQuantity} pieces require a manual quote`);
    }
    const fixedPrice = ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.design) === null || _a === void 0 ? void 0 : _a.type) === 'service' ? exports.DESIGN_SERVICE_FEE : 0;
    let subtotal = 0;
    const customAreaSubtotal = areaSubtotal(product, configuration, qty);
    if (customAreaSubtotal !== null) {
        const lineTotal = customAreaSubtotal + fixedPrice;
        return { unitPrice: customAreaSubtotal / qty, fixedPrice, lineTotal, pricingVersion: PRICING_VERSION };
    }
    if ((_b = product.matrixPricing) === null || _b === void 0 ? void 0 : _b.enabled) {
        const dimensions = matrixDimensionNames(product);
        const addons = sumAddons(product, configuration, (name) => !dimensions.has(name));
        subtotal = resolveMatrixSubtotal(product, qty, configuration) + addons.perUnit * qty + addons.fixed;
    }
    else {
        const addons = sumAddons(product, configuration);
        subtotal = (product.price + addons.perUnit) * qty + addons.fixed;
    }
    const lineTotal = subtotal + fixedPrice;
    const unitPrice = qty > 0 ? subtotal / qty : 0;
    return { unitPrice, fixedPrice, lineTotal, pricingVersion: PRICING_VERSION };
};
exports.computeProductPricing = computeProductPricing;
