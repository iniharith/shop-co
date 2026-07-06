"use strict";
/**
 * Calculates the estimated weight (in KG) of an ordered item.
 * Formula for paper: Quantity × GSM × Area (m²) ÷ 1000
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOrderTotalWeight = exports.calculateItemWeight = void 0;
const sizeMap = {
    'A3': { area: 0.12474 },
    'A4': { area: 0.06237 },
    'A5': { area: 0.03108 },
    'A6': { area: 0.01554 },
    'Business Card (90x54mm)': { area: 0.00486 },
};
// Default GSM if we can't extract it from the product/options
const DEFAULT_GSM = 128;
const PACKAGING_WEIGHT_KG = 0.2; // 200g box/packaging overhead
const calculateItemWeight = (quantity, sizeName, materialName) => {
    // Try to parse GSM from material string (e.g. "128gsm Art Paper")
    let gsm = DEFAULT_GSM;
    if (materialName) {
        const gsmMatch = materialName.match(/(\d+)\s*gsm/i);
        if (gsmMatch && gsmMatch[1]) {
            gsm = parseInt(gsmMatch[1], 10);
        }
    }
    // Determine Area
    let area = 0.1; // fallback 0.1 m^2
    // Exact match from map
    for (const [key, info] of Object.entries(sizeMap)) {
        if (sizeName.toUpperCase().includes(key.toUpperCase())) {
            area = info.area;
            break;
        }
    }
    // If sizeName is in mm/cm/m, try to parse (e.g., "210mm x 297mm", "2.8 Meters")
    const mmMatch = sizeName.match(/([\d.]+)\s*mm\s*[xX*]\s*([\d.]+)\s*mm/i);
    if (mmMatch) {
        area = (parseFloat(mmMatch[1]) / 1000) * (parseFloat(mmMatch[2]) / 1000);
    }
    const weightKg = (quantity * gsm * area) / 1000;
    // For non-paper products (Display items), we can add static weights if needed, 
    // but for now this formula serves as a good proxy or we return minimum 1kg
    return weightKg;
};
exports.calculateItemWeight = calculateItemWeight;
const calculateOrderTotalWeight = (products) => {
    let totalWeight = 0;
    for (const item of products) {
        // We assume item.size contains the size string.
        // If the order stores material in some custom field, we'd pass it. For now, pass size and guess.
        const w = (0, exports.calculateItemWeight)(item.quantity || 1, item.size || 'A4', item.material || '');
        totalWeight += w;
    }
    // Add packaging overhead, minimum 1 KG total for easyparcel
    totalWeight += PACKAGING_WEIGHT_KG;
    if (totalWeight < 1)
        totalWeight = 1;
    return Number(totalWeight.toFixed(2));
};
exports.calculateOrderTotalWeight = calculateOrderTotalWeight;
