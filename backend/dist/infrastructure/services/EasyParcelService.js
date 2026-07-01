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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const axios_1 = __importDefault(require("axios"));
// ─── EasyParcel Marketplace OAuth2 Configuration ─────────────────────────────
// Uses Client Credentials grant — token is obtained server-to-server.
// No user login or redirect needed.
const CLIENT_ID = process.env.EASYPARCEL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.EASYPARCEL_CLIENT_SECRET || '';
const BASE_URL = process.env.EASYPARCEL_BASE_URL || 'https://connect.easyparcel.my';
const TOKEN_URL = `${BASE_URL}/oauth/token`;
class EasyParcelService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        this.http = axios_1.default.create({ baseURL: BASE_URL, timeout: 15000 });
    }
    // ─── OAuth2: Client Credentials Token ──────────────────
    // Automatically called before every API request.
    // Caches the token in memory and refreshes when it expires.
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            // Return cached token if still valid (with 60s buffer)
            if (this.accessToken && now < this.tokenExpiresAt - 60000) {
                return this.accessToken;
            }
            if (!CLIENT_ID || !CLIENT_SECRET) {
                throw new Error('EASYPARCEL_CLIENT_ID and EASYPARCEL_CLIENT_SECRET must be set in environment variables');
            }
            console.log('[EasyParcel] 🔑 Fetching new OAuth2 access token...');
            const response = yield axios_1.default.post(TOKEN_URL, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000,
            });
            const { access_token, expires_in } = response.data;
            this.accessToken = access_token;
            // expires_in is in seconds; store as ms timestamp
            this.tokenExpiresAt = now + (expires_in !== null && expires_in !== void 0 ? expires_in : 3600) * 1000;
            console.log(`[EasyParcel] ✅ Token acquired, expires in ${expires_in}s`);
            return this.accessToken;
        });
    }
    // ─── Helper: authorized POST request ───────────────────
    post(action, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getAccessToken();
            const response = yield this.http.post(`/?ac=${action}`, body, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        });
    }
    // ─── Track Parcel ───────────────────────────────────────
    trackParcel(trackingNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const data = yield this.post('EPParcelStatusBulk', {
                    bulk: [{ tracking_no: trackingNumber }],
                });
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
                    courier: result.courier_name || 'Unknown',
                    events,
                };
            }
            catch (error) {
                console.error('[EasyParcel] trackParcel error:', error === null || error === void 0 ? void 0 : error.message);
                return null;
            }
        });
    }
    // ─── Get Shipping Rates ─────────────────────────────────
    getRates(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const data = yield this.post('EPRateCheckingBulk', {
                    bulk: [
                        {
                            pick_code: params.fromPostcode,
                            pick_state: params.fromState,
                            pick_country: 'MY',
                            send_code: params.toPostcode,
                            send_state: params.toState,
                            send_country: 'MY',
                            weight: params.weight,
                        },
                    ],
                });
                return ((_b = (_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.rates) || [];
            }
            catch (error) {
                console.error('[EasyParcel] getRates error:', error === null || error === void 0 ? void 0 : error.message);
                return [];
            }
        });
    }
    // ─── Create Shipment ────────────────────────────────────
    createShipment(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const data = yield this.post('EPSubmitOrderBulk', {
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
                });
                return ((_b = (_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.order_id) || null;
            }
            catch (error) {
                console.error('[EasyParcel] createShipment error:', error === null || error === void 0 ? void 0 : error.message);
                return null;
            }
        });
    }
    // ─── Get AWB PDF URL ────────────────────────────────────
    getAWB(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const data = yield this.post('EPGetOrderAWBBulk', {
                    bulk: [{ order_id: orderId }],
                });
                return ((_b = (_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.awb_url) || null;
            }
            catch (error) {
                console.error('[EasyParcel] getAWB error:', error === null || error === void 0 ? void 0 : error.message);
                return null;
            }
        });
    }
    // ─── Normalize Status ───────────────────────────────────
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
        if (s.includes('fail') ||
            s.includes('return') ||
            s.includes('exception') ||
            s.includes('undeliver'))
            return 'failed';
        return 'pending';
    }
}
exports.easyParcelService = new EasyParcelService();
