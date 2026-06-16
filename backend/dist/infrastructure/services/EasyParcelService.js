"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.easyParcelService = void 0;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = process.env.EASYPARCEL_BASE_URL || 'https://api.easyparcel.com';
const API_KEY = process.env.EASYPARCEL_API_KEY || '';
class EasyParcelService {
    /**
     * Track parcel by tracking number using EasyParcel v3 API
     */
    trackParcel(trackingNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${BASE_URL}/v3.0/submitted/parcel-tracking/`, {
                    api_key: API_KEY,
                    bulk: [{ tracking_no: trackingNumber }],
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
                const data = response.data;
                if (!((_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a[0]))
                    return null;
                const result = data.result[0];
                const events = (result.tracking_history || []).map((h) => ({
                    status: h.status || '',
                    description: h.content || h.description || '',
                    location: h.location || '',
                    timestamp: new Date(h.date_time || Date.now()),
                }));
                return {
                    trackingNumber,
                    status: this.normalizeStatus(result.status || 'pending'),
                    courier: result.courier_name || 'Unknown Courier',
                    events,
                };
            }
            catch (error) {
                console.error('[EasyParcel] trackParcel error:', error === null || error === void 0 ? void 0 : error.message);
                return null;
            }
        });
    }
    /**
     * Get AWB PDF URL for a booked shipment
     */
    getAWB(shipmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.post(`${BASE_URL}/v3.0/submitted/shipment/awb/`, {
                    api_key: API_KEY,
                    bulk: [{ shipment_id: shipmentId }],
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
                const data = response.data;
                return ((_b = (_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.awb_url) || null;
            }
            catch (error) {
                console.error('[EasyParcel] getAWB error:', error === null || error === void 0 ? void 0 : error.message);
                return null;
            }
        });
    }
    /**
     * Book a new shipment on EasyParcel, returns shipment ID
     */
    createShipment(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.post(`${BASE_URL}/v3.0/submitted/make-shipment/`, {
                    api_key: API_KEY,
                    bulk: [
                        {
                            service_id: input.courier,
                            sender_name: input.senderName,
                            sender_phone: input.senderPhone,
                            sender_address: input.senderAddress,
                            sender_city: input.senderCity,
                            sender_state: input.senderState,
                            sender_postcode: input.senderPostcode,
                            receiver_name: input.recipientName,
                            receiver_phone: input.recipientPhone,
                            receiver_address: input.recipientAddress,
                            receiver_city: input.recipientCity,
                            receiver_state: input.recipientState,
                            receiver_postcode: input.recipientPostcode,
                            weight: input.weight,
                            content: 'Printed Products',
                            value: 10,
                            send_date: new Date().toISOString().split('T')[0],
                        },
                    ],
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
                const data = response.data;
                return ((_b = (_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.shipment_id) || null;
            }
            catch (error) {
                console.error('[EasyParcel] createShipment error:', error === null || error === void 0 ? void 0 : error.message);
                return null;
            }
        });
    }
    /**
     * Get available courier rates for a shipment
     */
    getRates(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const response = yield axios_1.default.post(`${BASE_URL}/v3.0/submitted/get-rates/`, {
                    api_key: API_KEY,
                    bulk: [
                        {
                            pick_code: params.fromPostcode,
                            send_code: params.toPostcode,
                            weight: params.weight,
                        },
                    ],
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
                return ((_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.rates) || [];
            }
            catch (error) {
                console.error('[EasyParcel] getRates error:', error === null || error === void 0 ? void 0 : error.message);
                return [];
            }
        });
    }
    /**
     * Normalize raw EasyParcel status strings to our standard statuses
     */
    normalizeStatus(rawStatus) {
        const s = rawStatus.toLowerCase();
        if (s.includes('deliver') && s.includes('out'))
            return 'out_for_delivery';
        if (s.includes('deliver') || s.includes('completed') || s.includes('success'))
            return 'delivered';
        if (s.includes('transit') || s.includes('sort') || s.includes('hub') || s.includes('arrival'))
            return 'in_transit';
        if (s.includes('pick') || s.includes('collect') || s.includes('pickup'))
            return 'picked_up';
        if (s.includes('fail') || s.includes('return') || s.includes('exception') || s.includes('undeliver'))
            return 'failed';
        return 'pending';
    }
}
exports.easyParcelService = new EasyParcelService();
