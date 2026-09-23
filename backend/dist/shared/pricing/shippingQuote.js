"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingQuoteChangedError = void 0;
exports.estimateCartWeight = estimateCartWeight;
exports.selectCheapestShippingQuote = selectCheapestShippingQuote;
exports.matchesQuotedShippingPrice = matchesQuotedShippingPrice;
// Keep in sync with the customer checkout estimate until parcel dimensions come from the catalog.
function estimateCartWeight(items) {
    var _a, _b;
    const sizes = { A3: 0.12474, A4: 0.06237, A5: 0.03108, A6: 0.01554 };
    let weight = 0.2;
    for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity < 1)
            throw new Error('Invalid cart quantity');
        const name = String(item.size || '').toUpperCase();
        const area = (_b = (_a = Object.entries(sizes).find(([size]) => name.includes(size))) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : 0.06237;
        weight += item.quantity * 128 * area / 1000;
    }
    return Math.max(1, Number(weight.toFixed(2)));
}
function selectCheapestShippingQuote(groups) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!Array.isArray(groups))
        return null;
    const quotes = groups.flatMap((group) => Array.isArray(group === null || group === void 0 ? void 0 : group.quotations) ? group.quotations : Array.isArray(group) ? group : [group]);
    let best = null;
    for (const quote of quotes) {
        const raw = (_f = (_e = (_d = (_b = (_a = quote === null || quote === void 0 ? void 0 : quote.pricing) === null || _a === void 0 ? void 0 : _a.total_amount) !== null && _b !== void 0 ? _b : (_c = quote === null || quote === void 0 ? void 0 : quote.pricing) === null || _c === void 0 ? void 0 : _c.shipment_price) !== null && _d !== void 0 ? _d : quote === null || quote === void 0 ? void 0 : quote.price) !== null && _e !== void 0 ? _e : quote === null || quote === void 0 ? void 0 : quote.total_amount) !== null && _f !== void 0 ? _f : quote === null || quote === void 0 ? void 0 : quote.shipping_price;
        if (typeof raw !== 'number' && (typeof raw !== 'string' || !raw.trim()))
            continue;
        const price = Number(raw);
        if (!Number.isFinite(price) || price < 0)
            continue;
        const courier = String(((_g = quote === null || quote === void 0 ? void 0 : quote.courier) === null || _g === void 0 ? void 0 : _g.courier_name) || ((_h = quote === null || quote === void 0 ? void 0 : quote.courier) === null || _h === void 0 ? void 0 : _h.service_name) || (quote === null || quote === void 0 ? void 0 : quote.courier_name) || '');
        if (!best || price < best.price)
            best = { price, courier };
    }
    return best;
}
function matchesQuotedShippingPrice(submitted, quoted) {
    return typeof submitted === 'number' && Number.isFinite(submitted)
        && Math.round(submitted * 100) === Math.round(quoted * 100);
}
class ShippingQuoteChangedError extends Error {
    constructor() {
        super('Shipping price changed. Please review the updated total and try again.');
        this.name = 'ShippingQuoteChangedError';
    }
}
exports.ShippingQuoteChangedError = ShippingQuoteChangedError;
