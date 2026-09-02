"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeProductPricing = exports.DESIGN_SERVICE_FEE = void 0;
/**
 * Server-side product pricing engine.
 * Mirrors the storefront pricing rules (frontend/src/components/page-sections/shop/product-details.tsx)
 * so the backend — not the client — decides cart and order line prices.
 */
exports.DESIGN_SERVICE_FEE = 100;
const PRICING_VERSION = 'catalog-v1';
const PHOTOBOOK_PRICES = {
    "HARDCOVER": {
        "6X6": { "40 PAGES": 109, "60 PAGES": 119, "100 PAGES": 129 },
        "8X6": { "40 PAGES": 129, "60 PAGES": 139, "100 PAGES": 149 }
    },
    "SOFTCOVER": {
        "6X6": { "40 PAGES": 49, "60 PAGES": 59, "100 PAGES": 69 },
        "8X6": { "40 PAGES": 55, "60 PAGES": 65, "100 PAGES": 75 }
    }
};
const TSHIRT_PRICES = {
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
const selectedValues = (configuration, matcher) => {
    const entry = ((configuration === null || configuration === void 0 ? void 0 : configuration.selections) || []).find((selection) => matcher.test(selection.name));
    if (!entry)
        return [];
    return (entry.values || []).map((value) => ({
        label: String(value.label || '').trim(),
        priceAdd: Number(value.priceAdd) || 0,
    }));
};
const selectedLabel = (configuration, matcher) => {
    const values = selectedValues(configuration, matcher);
    return values.length > 0 ? values[0].label : '';
};
// Price add-ons only from the server-side product definition. Client prices are ignored.
const sumAddons = (product, configuration, filter) => {
    var _a, _b;
    const optionNames = new Set((product.printingOptions || []).map((option) => option.name));
    let total = 0;
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
            total += match ? (Number(match.priceAdd) || 0) : 0;
        }
    }
    return total;
};
const selectedValueForOption = (configuration, optionName) => {
    var _a, _b;
    if (!optionName)
        return '';
    const entry = ((configuration === null || configuration === void 0 ? void 0 : configuration.selections) || []).find((selection) => selection.name === optionName);
    return ((_b = (_a = entry === null || entry === void 0 ? void 0 : entry.values) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.label) !== undefined ? String(entry.values[0].label).trim() : '';
};
const resolveMatrixSubtotal = (product, quantity, configuration) => {
    var _a, _b, _c, _d, _e, _f;
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
        const qPrices = (_f = matrixRow.quantityPrices[quantity]) !== null && _f !== void 0 ? _f : matrixRow.quantityPrices[availableQuantities[0]];
        let exactPrice = 0;
        if (qPrices && typeof qPrices === 'object') {
            const gridSize = ((configuration === null || configuration === void 0 ? void 0 : configuration.fulfillmentSize) || '').trim();
            exactPrice = qPrices[gridSize] || Object.values(qPrices)[0] || 0;
        }
        else {
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
const computeProductPricing = (product, quantity, configuration) => {
    var _a, _b, _c, _d, _e, _f;
    const qty = Number.isInteger(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;
    const fixedPrice = ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.design) === null || _a === void 0 ? void 0 : _a.type) === 'service' ? exports.DESIGN_SERVICE_FEE : 0;
    const category = (product.category || '').toLowerCase();
    let subtotal = 0;
    if (category === 'photobook') {
        const unitPrice = ((_c = (_b = PHOTOBOOK_PRICES[selectedLabel(configuration, /material/i)]) === null || _b === void 0 ? void 0 : _b[selectedLabel(configuration, /size/i)]) === null || _c === void 0 ? void 0 : _c[selectedLabel(configuration, /pages/i)]) || 0;
        subtotal = unitPrice * qty;
    }
    else if (category === 'sublimation-tshirt') {
        const type = selectedLabel(configuration, /type/i) || 'Round Neck';
        let tier = 1;
        for (const candidate of TSHIRT_TIERS) {
            if (qty >= candidate) {
                tier = candidate;
                break;
            }
        }
        const basePrice = (_e = (_d = TSHIRT_PRICES[type]) === null || _d === void 0 ? void 0 : _d[String(tier)]) !== null && _e !== void 0 ? _e : TSHIRT_PRICES['Round Neck']['1'];
        const addons = sumAddons(product, configuration, (name) => /add on/i.test(name));
        subtotal = (basePrice + addons) * qty;
    }
    else if ((_f = product.matrixPricing) === null || _f === void 0 ? void 0 : _f.enabled) {
        subtotal = resolveMatrixSubtotal(product, qty, configuration);
    }
    else {
        const addons = sumAddons(product, configuration);
        subtotal = (product.price + addons) * qty;
    }
    const lineTotal = subtotal + fixedPrice;
    const unitPrice = qty > 0 ? subtotal / qty : 0;
    return { unitPrice, fixedPrice, lineTotal, pricingVersion: PRICING_VERSION };
};
exports.computeProductPricing = computeProductPricing;
