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
exports.easyParcelService = exports.EasyParcelApiError = void 0;
exports.mapEasyParcelStatus = mapEasyParcelStatus;
exports.mapEasyParcelOrderStatus = mapEasyParcelOrderStatus;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const easyParcelConnection_model_1 = require("../db/models/easyParcelConnection.model");
const API_BASE_URL = 'https://api.easyparcel.com/open_api/2026-06';
const SHIPMENT_DETAILS_BASE_URL = 'https://api.easyparcel.com/open_api/2026-03';
const OAUTH_LOGIN_URL = 'https://api.easyparcel.com/oauth/login';
const OAUTH_TOKEN_URL = 'https://api.easyparcel.com/oauth/token';
const REQUEST_TIMEOUT_MS = 20000;
const TOKEN_EXPIRY_SKEW_MS = 60000;
class EasyParcelApiError extends Error {
    constructor(message, ambiguous) {
        super(message);
        this.ambiguous = ambiguous;
        this.name = 'EasyParcelApiError';
    }
}
exports.EasyParcelApiError = EasyParcelApiError;
function requiredEnv(name) {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value)
        throw new Error(`EasyParcel configuration is missing ${name}`);
    return value;
}
function encryptionKey() {
    return crypto_1.default.createHash('sha256').update(requiredEnv('EASYPARCEL_TOKEN_ENCRYPTION_KEY')).digest();
}
function encrypt(value) {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}
function decrypt(value) {
    const [iv, tag, ciphertext] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
    if (!iv || !tag || !ciphertext)
        throw new Error('Stored EasyParcel token is invalid');
    const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
function oauthConfiguration() {
    return {
        clientId: requiredEnv('EASYPARCEL_CLIENT_ID'),
        clientSecret: requiredEnv('EASYPARCEL_CLIENT_SECRET'),
        redirectUri: requiredEnv('EASYPARCEL_REDIRECT_URI'),
    };
}
function safeApiMessage(data, fallback) {
    var _a;
    const message = (data === null || data === void 0 ? void 0 : data.message) || (data === null || data === void 0 ? void 0 : data.msg) || (data === null || data === void 0 ? void 0 : data.error_description) || ((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.message);
    if (typeof message === 'string' && message.length <= 300)
        return message;
    if (Array.isArray(data === null || data === void 0 ? void 0 : data.errors)) {
        const errors = data.errors.filter((value) => typeof value === 'string').join('; ');
        if (errors && errors.length <= 300)
            return errors;
    }
    return fallback;
}
function assertNoItemErrors(payload) {
    const queue = [payload];
    while (queue.length) {
        const value = queue.shift();
        if (!value || typeof value !== 'object')
            continue;
        if (String(value.status || '').toLowerCase() === 'error') {
            throw new EasyParcelApiError(safeApiMessage(value, 'EasyParcel rejected a shipment item'), false);
        }
        if (Array.isArray(value))
            queue.push(...value);
        else {
            for (const key of ['data', 'shipments', 'shipment', 'results', 'result']) {
                if (value[key])
                    queue.push(value[key]);
            }
        }
    }
}
function submitPartyPayload(party) {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ name: party.name }, (party.company ? { company: party.company } : {})), { phone_number_country_code: party.phone.countryCode, phone_number: party.phone.number }), (party.email ? { email: party.email } : {})), { address_1: party.address1 }), (party.address2 ? { address_2: party.address2 } : {})), { postcode: party.postcode, city: party.city, subdivision_code: party.subdivisionCode, country_code: party.countryCode });
}
function quotationShipmentPayload(shipment) {
    return Object.assign(Object.assign({ sender: {
            postcode: shipment.sender.postcode,
            subdivision_code: shipment.sender.subdivisionCode,
            country: shipment.sender.countryCode,
        }, receiver: {
            postcode: shipment.receiver.postcode,
            subdivision_code: shipment.receiver.subdivisionCode,
            country: shipment.receiver.countryCode,
        } }, (shipment.parcelValue === undefined ? {} : { parcel_value: shipment.parcelValue })), { weight: shipment.weight, width: shipment.width, length: shipment.length, height: shipment.height });
}
function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== '');
}
function awbUrls(value) {
    var _a;
    const source = (value === null || value === void 0 ? void 0 : value.awb_urls)
        || (value === null || value === void 0 ? void 0 : value.awbUrls)
        || (value === null || value === void 0 ? void 0 : value.awb_urls_by_format)
        || (value === null || value === void 0 ? void 0 : value.awb_url_by_format)
        || (typeof (value === null || value === void 0 ? void 0 : value.awb_url) === 'object' ? value.awb_url : undefined)
        || (typeof ((_a = value === null || value === void 0 ? void 0 : value.awb) === null || _a === void 0 ? void 0 : _a.url) === 'object' ? value.awb.url : undefined)
        || {};
    const result = {
        A4: firstDefined(source.A4, source.a4),
        A5: firstDefined(source.A5, source.a5),
        A6: firstDefined(source.A6, source.a6),
    };
    return result.A4 || result.A5 || result.A6 ? result : undefined;
}
function awbNumber(value) {
    var _a;
    const number = firstDefined(value === null || value === void 0 ? void 0 : value.awb_number, (_a = value === null || value === void 0 ? void 0 : value.awb) === null || _a === void 0 ? void 0 : _a.number, value === null || value === void 0 ? void 0 : value.tracking_number, typeof (value === null || value === void 0 ? void 0 : value.awb) === 'string' ? value.awb : undefined);
    return number ? String(number) : null;
}
function primaryAwbUrl(value) {
    var _a, _b;
    const direct = firstDefined(typeof (value === null || value === void 0 ? void 0 : value.awb_url) === 'string' ? value.awb_url : undefined, typeof ((_a = value === null || value === void 0 ? void 0 : value.awb) === null || _a === void 0 ? void 0 : _a.url) === 'string' ? value.awb.url : undefined, (_b = awbUrls(value)) === null || _b === void 0 ? void 0 : _b.A4);
    return direct ? String(direct) : undefined;
}
function mapEasyParcelStatus(code) {
    switch (code) {
        case 0: return 'cancelled';
        case 3: return 'picked_up';
        case 4: return 'in_transit';
        case 5: return 'delivered';
        case 6: return 'returned';
        case 8: return 'on_hold';
        case 11: return 'drop_off';
        case 2:
        case 7:
        default: return 'pending';
    }
}
function mapEasyParcelOrderStatus(code) {
    if (code === 0)
        return 'CANCELLED';
    if (code === 3 || code === 11)
        return 'SHIPPED';
    if (code === 4)
        return 'IN_TRANSIT';
    if (code === 5)
        return 'DELIVERED';
    if (code === 6)
        return 'RETURNED';
    return undefined;
}
class EasyParcelService {
    constructor() {
        this.refreshPromise = null;
    }
    isConfigured() {
        return ['EASYPARCEL_CLIENT_ID', 'EASYPARCEL_CLIENT_SECRET', 'EASYPARCEL_REDIRECT_URI', 'EASYPARCEL_TOKEN_ENCRYPTION_KEY']
            .every((name) => { var _a; return Boolean((_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim()); });
    }
    missingShippingConfiguration() {
        return [
            'EASYPARCEL_SENDER_NAME',
            'EASYPARCEL_SENDER_PHONE',
            'EASYPARCEL_SENDER_ADDRESS_1',
            'EASYPARCEL_SENDER_POSTCODE',
            'EASYPARCEL_SENDER_CITY',
            'EASYPARCEL_SENDER_SUBDIVISION_CODE',
        ].filter((name) => { var _a; return !((_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim()); });
    }
    getConnectionStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const connection = yield easyParcelConnection_model_1.EasyParcelConnection.findOne({ key: 'singleton' }).lean();
            const configured = this.isConfigured();
            const missingShippingConfiguration = this.missingShippingConfiguration();
            const refreshExpired = Boolean((connection === null || connection === void 0 ? void 0 : connection.refreshTokenExpiresAt) && connection.refreshTokenExpiresAt <= new Date());
            const invalidated = Boolean(connection === null || connection === void 0 ? void 0 : connection.invalidatedAt);
            let tokensReadable = Boolean((connection === null || connection === void 0 ? void 0 : connection.accessTokenEncrypted) && (connection === null || connection === void 0 ? void 0 : connection.refreshTokenEncrypted));
            if (configured && tokensReadable) {
                try {
                    decrypt(connection.accessTokenEncrypted);
                    decrypt(connection.refreshTokenEncrypted);
                }
                catch (_b) {
                    tokensReadable = false;
                }
            }
            return {
                configured,
                shippingConfigured: missingShippingConfiguration.length === 0,
                missingShippingConfiguration,
                connected: configured && tokensReadable && !refreshExpired && !invalidated,
                needsReconnect: Boolean(connection === null || connection === void 0 ? void 0 : connection.accessTokenEncrypted) && (!configured || !tokensReadable || refreshExpired || invalidated),
                environment: (connection === null || connection === void 0 ? void 0 : connection.environment) || ((_a = process.env.EASYPARCEL_ENV) === null || _a === void 0 ? void 0 : _a.trim()) || 'sandbox',
                expiresAt: (connection === null || connection === void 0 ? void 0 : connection.accessTokenExpiresAt) || null,
            };
        });
    }
    createAuthorizationUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { clientId, redirectUri } = oauthConfiguration();
            requiredEnv('EASYPARCEL_TOKEN_ENCRYPTION_KEY');
            const state = crypto_1.default.randomBytes(32).toString('base64url');
            const stateHash = crypto_1.default.createHash('sha256').update(state).digest('hex');
            const environment = ((_a = process.env.EASYPARCEL_ENV) === null || _a === void 0 ? void 0 : _a.trim()) || 'sandbox';
            yield easyParcelConnection_model_1.EasyParcelConnection.findOneAndUpdate({ key: 'singleton' }, {
                $set: {
                    environment,
                    oauthStateHash: stateHash,
                    oauthStateExpiresAt: new Date(Date.now() + 10 * 60000),
                },
                $setOnInsert: { key: 'singleton' },
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            const query = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state });
            return `${OAUTH_LOGIN_URL}?${query.toString()}`;
        });
    }
    handleAuthorizationCallback(code, state) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!code || !state)
                throw new Error('Missing OAuth callback parameters');
            const connection = yield easyParcelConnection_model_1.EasyParcelConnection.findOne({ key: 'singleton' });
            const receivedHash = crypto_1.default.createHash('sha256').update(state).digest();
            const expectedHash = (connection === null || connection === void 0 ? void 0 : connection.oauthStateHash) ? Buffer.from(connection.oauthStateHash, 'hex') : Buffer.alloc(0);
            const stateValid = expectedHash.length === receivedHash.length && crypto_1.default.timingSafeEqual(receivedHash, expectedHash);
            if (!connection || !stateValid || !connection.oauthStateExpiresAt || connection.oauthStateExpiresAt <= new Date()) {
                throw new Error('Invalid or expired OAuth state');
            }
            yield easyParcelConnection_model_1.EasyParcelConnection.updateOne({ _id: connection._id }, { $unset: { oauthStateHash: 1, oauthStateExpiresAt: 1 } });
            const config = oauthConfiguration();
            const response = yield axios_1.default.post(OAUTH_TOKEN_URL, new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri }).toString(), {
                timeout: REQUEST_TIMEOUT_MS,
                headers: {
                    Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            yield this.persistTokens(response.data, connection.refreshTokenEncrypted);
        });
    }
    getWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({ method: 'GET', url: '/wallet' });
        });
    }
    getQuotations(shipments) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!shipments.length)
                throw new Error('At least one shipment is required');
            const response = yield this.request({
                method: 'POST',
                url: '/shipment/quotations',
                data: { shipment: shipments.map(quotationShipmentPayload) },
            });
            return Array.isArray(response === null || response === void 0 ? void 0 : response.data) ? response.data : ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.quotations) || (response === null || response === void 0 ? void 0 : response.quotations) || [];
        });
    }
    submitOrder(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const response = yield this.request({
                method: 'POST',
                url: '/shipment/submit_orders',
                data: {
                    shipment: [{
                            reference: input.reference,
                            service_id: input.serviceId,
                            collection_date: input.collectionDate,
                            weight: input.weight,
                            height: input.height,
                            length: input.length,
                            width: input.width,
                            item: [{
                                    content: input.itemDescription,
                                    weight: input.weight,
                                    height: input.height,
                                    length: input.length,
                                    width: input.width,
                                    currency_code: input.currency || 'MYR',
                                    value: input.itemValue,
                                    quantity: 1,
                                }],
                            sender: submitPartyPayload(input.sender),
                            receiver: submitPartyPayload(input.receiver),
                            feature: {
                                sms_tracking: false,
                                email_tracking: false,
                                whatsapp_tracking: false,
                                awb_branding: { enable: false },
                            },
                        }],
                },
            });
            const dataItem = Array.isArray(response === null || response === void 0 ? void 0 : response.data) ? response.data[0] : response === null || response === void 0 ? void 0 : response.data;
            const order = (dataItem === null || dataItem === void 0 ? void 0 : dataItem.order_details) || {};
            const shipment = (Array.isArray(dataItem === null || dataItem === void 0 ? void 0 : dataItem.shipments) ? dataItem.shipments[0] : dataItem === null || dataItem === void 0 ? void 0 : dataItem.shipments) || {};
            const orderNumber = firstDefined(order.order_number, order.order_no, order.number);
            const shipmentNumber = firstDefined(shipment.shipment_number, shipment.number);
            if (!orderNumber || !shipmentNumber)
                throw new Error('EasyParcel response omitted order or shipment number');
            const urls = awbUrls(shipment);
            return {
                orderNumber: String(orderNumber),
                shipmentNumber: String(shipmentNumber),
                awbNumber: awbNumber(shipment),
                awbUrl: primaryAwbUrl(shipment),
                awbUrlsByFormat: urls,
                trackingUrl: firstDefined(shipment.tracking_url, shipment.trackingUrl),
                courier: firstDefined(shipment.courier_name, (_a = shipment.courier) === null || _a === void 0 ? void 0 : _a.name, shipment.courier),
                service: firstDefined(shipment.courier_service, shipment.service_name, (_b = shipment.service) === null || _b === void 0 ? void 0 : _b.name, shipment.service),
                shippingPrice: Number(firstDefined((_c = dataItem === null || dataItem === void 0 ? void 0 : dataItem.pricing_breakdown) === null || _c === void 0 ? void 0 : _c.total_paid_amount, (_d = dataItem === null || dataItem === void 0 ? void 0 : dataItem.pricing_breakdown) === null || _d === void 0 ? void 0 : _d.total_order_amount, (_e = shipment.pricing_breakdown) === null || _e === void 0 ? void 0 : _e.total_paid_amount, (_f = shipment.pricing_breakdown) === null || _f === void 0 ? void 0 : _f.shipment_price, shipment.shipping_price)) || undefined,
                currency: firstDefined((_g = shipment.pricing_breakdown) === null || _g === void 0 ? void 0 : _g.currency_code, (_h = dataItem === null || dataItem === void 0 ? void 0 : dataItem.pricing_breakdown) === null || _h === void 0 ? void 0 : _h.currency_code, 'MYR'),
                rawShipment: shipment,
            };
        });
    }
    trackParcels(awbNumbers) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const unique = [...new Set(awbNumbers.filter(Boolean))];
            const results = [];
            for (let index = 0; index < unique.length; index += 100) {
                const batch = unique.slice(index, index + 100);
                const response = yield this.request({
                    method: 'POST',
                    url: '/shipment/tracking_status',
                    data: { awb_numbers: batch },
                });
                const rows = Array.isArray(response === null || response === void 0 ? void 0 : response.data) ? response.data : ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.results) || (response === null || response === void 0 ? void 0 : response.results) || [];
                for (const row of rows) {
                    if (String(row.status || '').toLowerCase() !== 'success')
                        continue;
                    const code = Number(firstDefined(row.latest_shipment_status_code, row.status_code, row.shipment_status_code, (_b = row.status) === null || _b === void 0 ? void 0 : _b.code, 2));
                    const events = (row.status_log || row.events || row.tracking_events || row.trackings || []).map((event) => ({
                        status: String(firstDefined(event.shipment_status_code, event.status, event.status_name, event.status_code, '')),
                        description: String(firstDefined(event.tracking_status, event.description, event.message, event.details, '')),
                        location: String(firstDefined(event.location, event.city, '')),
                        timestamp: new Date(firstDefined(event.event_date, event.timestamp, event.datetime, event.date_time, Date.now())),
                    }));
                    results.push({
                        trackingNumber: awbNumber(row) || '',
                        shipmentNumber: firstDefined(row.shipment_number, row.number),
                        statusCode: code,
                        status: mapEasyParcelStatus(code),
                        courier: String(firstDefined(row.courier_name, (_c = row.courier) === null || _c === void 0 ? void 0 : _c.name, row.courier, 'unknown')),
                        events,
                    });
                }
            }
            return results;
        });
    }
    listShipments() {
        return __awaiter(this, arguments, void 0, function* (limit = 250) {
            return (yield this.listShipmentPage(limit)).shipments;
        });
    }
    findShipmentsByNumbers(shipmentNumbers) {
        return __awaiter(this, void 0, void 0, function* () {
            const wanted = new Set(shipmentNumbers.filter(Boolean));
            const found = new Map();
            let beforeShipmentNumber;
            for (let page = 0; page < 20 && found.size < wanted.size; page++) {
                const result = yield this.listShipmentPage(250, beforeShipmentNumber);
                for (const shipment of result.shipments) {
                    if (wanted.has(shipment.shipmentNumber))
                        found.set(shipment.shipmentNumber, shipment);
                }
                if (!result.hasMore || !result.nextShipmentNumber || result.nextShipmentNumber === beforeShipmentNumber)
                    break;
                beforeShipmentNumber = result.nextShipmentNumber;
            }
            return [...found.values()];
        });
    }
    getShipmentDetails(shipmentNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const response = yield this.request({
                method: 'POST',
                baseURL: SHIPMENT_DETAILS_BASE_URL,
                url: '/shipment/details',
                data: { shipment_number: shipmentNumber },
            });
            const row = Array.isArray(response === null || response === void 0 ? void 0 : response.data) ? response.data[0] : response === null || response === void 0 ? void 0 : response.data;
            if (!(row === null || row === void 0 ? void 0 : row.shipment_number))
                throw new Error('EasyParcel shipment details were not found');
            const details = row.shipment_details || {};
            return {
                shipmentNumber: String(row.shipment_number),
                awbNumber: awbNumber(details),
                awbUrl: primaryAwbUrl(details),
                awbUrlsByFormat: awbUrls(details),
                trackingUrl: firstDefined(details.tracking_url, details.trackingUrl),
                courier: firstDefined((_a = row.courier) === null || _a === void 0 ? void 0 : _a.courier_name, (_b = row.courier) === null || _b === void 0 ? void 0 : _b.name),
                service: firstDefined((_c = row.courier) === null || _c === void 0 ? void 0 : _c.service_types, (_d = row.courier) === null || _d === void 0 ? void 0 : _d.service_name),
                statusCode: details.shipment_status_code !== undefined && details.shipment_status_code !== null && Number.isFinite(Number(details.shipment_status_code))
                    ? Number(details.shipment_status_code)
                    : undefined,
                raw: row,
            };
        });
    }
    listShipmentPage() {
        return __awaiter(this, arguments, void 0, function* (limit = 250, beforeShipmentNumber) {
            var _a, _b, _c, _d;
            const response = yield this.request({
                method: 'POST',
                url: '/shipment/list',
                data: Object.assign({ limit: Math.max(1, Math.min(250, Math.floor(limit))) }, (beforeShipmentNumber ? { before_shipment_number: beforeShipmentNumber } : {})),
            });
            const rows = Array.isArray(response === null || response === void 0 ? void 0 : response.data) ? response.data : ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.shipments) || (response === null || response === void 0 ? void 0 : response.shipments) || [];
            const shipments = rows.map((row) => {
                var _a, _b, _c, _d, _e;
                return ({
                    shipmentNumber: String(firstDefined(row.shipment_number, row.number, '')),
                    awbNumber: awbNumber(row),
                    awbUrl: primaryAwbUrl(row),
                    awbUrlsByFormat: awbUrls(row),
                    trackingUrl: firstDefined(row.tracking_url, row.trackingUrl),
                    courier: firstDefined(row.courier_name, (_a = row.courier) === null || _a === void 0 ? void 0 : _a.courier_name, (_b = row.courier) === null || _b === void 0 ? void 0 : _b.courier_short_name, (_c = row.courier) === null || _c === void 0 ? void 0 : _c.name, row.courier),
                    service: firstDefined(row.service_name, (_d = row.courier) === null || _d === void 0 ? void 0 : _d.service_type, (_e = row.service) === null || _e === void 0 ? void 0 : _e.name, row.service),
                    statusCode: Number.isFinite(Number(firstDefined(row.status_code, row.shipment_status_code)))
                        ? Number(firstDefined(row.status_code, row.shipment_status_code))
                        : undefined,
                    raw: row,
                });
            }).filter((row) => row.shipmentNumber);
            return {
                shipments,
                hasMore: ((_b = response === null || response === void 0 ? void 0 : response.pagination) === null || _b === void 0 ? void 0 : _b.has_more) === true,
                nextShipmentNumber: ((_c = response === null || response === void 0 ? void 0 : response.pagination) === null || _c === void 0 ? void 0 : _c.next_shipment_number) || ((_d = shipments[shipments.length - 1]) === null || _d === void 0 ? void 0 : _d.shipmentNumber),
            };
        });
    }
    request(config_1) {
        return __awaiter(this, arguments, void 0, function* (config, retried = false) {
            var _a, _b, _c;
            let dispatched = false;
            try {
                const token = yield this.getAccessToken();
                dispatched = true;
                const response = yield axios_1.default.request(Object.assign(Object.assign({}, config), { baseURL: config.baseURL || API_BASE_URL, timeout: REQUEST_TIMEOUT_MS, headers: Object.assign(Object.assign({}, config.headers), { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }) }));
                assertNoItemErrors(response.data);
                return response.data;
            }
            catch (error) {
                const axiosError = error;
                if (((_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && !retried) {
                    try {
                        yield this.refreshAccessToken();
                    }
                    catch (refreshError) {
                        throw new EasyParcelApiError(refreshError instanceof Error ? refreshError.message : 'EasyParcel authorization refresh failed; reconnect EasyParcel', false);
                    }
                    return this.request(config, true);
                }
                if (error instanceof EasyParcelApiError)
                    throw error;
                if (!dispatched) {
                    throw new EasyParcelApiError(error instanceof Error ? error.message : 'EasyParcel authentication failed', false);
                }
                const status = (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status;
                const ambiguous = !status || status === 429 || status >= 500;
                throw new EasyParcelApiError(`EasyParcel request failed${status ? ` (${status})` : ''}: ${safeApiMessage((_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.data, axiosError.code === 'ECONNABORTED' ? 'request timed out' : 'upstream request failed')}`, ambiguous);
            }
        });
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield easyParcelConnection_model_1.EasyParcelConnection.findOne({ key: 'singleton' });
            if (!(connection === null || connection === void 0 ? void 0 : connection.accessTokenEncrypted))
                throw new Error('EasyParcel is not connected');
            if (connection.invalidatedAt)
                throw new Error('EasyParcel authorization must be reconnected');
            if (!connection.accessTokenExpiresAt || connection.accessTokenExpiresAt.getTime() <= Date.now() + TOKEN_EXPIRY_SKEW_MS) {
                return this.refreshAccessToken();
            }
            return decrypt(connection.accessTokenEncrypted);
        });
    }
    refreshAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.refreshPromise)
                return this.refreshPromise;
            this.refreshPromise = this.performRefresh().finally(() => { this.refreshPromise = null; });
            return this.refreshPromise;
        });
    }
    performRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const lockId = crypto_1.default.randomUUID();
            const connection = yield easyParcelConnection_model_1.EasyParcelConnection.findOneAndUpdate({
                key: 'singleton',
                $or: [
                    { refreshLockId: { $exists: false } },
                    { refreshLockExpiresAt: { $lte: new Date() } },
                ],
            }, { $set: { refreshLockId: lockId, refreshLockExpiresAt: new Date(Date.now() + REQUEST_TIMEOUT_MS + 5000) } }, { new: true });
            if (!connection)
                return this.waitForConcurrentRefresh();
            try {
                if (!connection.refreshTokenEncrypted)
                    throw new Error('EasyParcel refresh token is unavailable; reconnect EasyParcel');
                if (connection.refreshTokenExpiresAt && connection.refreshTokenExpiresAt <= new Date()) {
                    throw new Error('EasyParcel refresh token expired; reconnect EasyParcel');
                }
                const config = oauthConfiguration();
                const response = yield axios_1.default.post(OAUTH_TOKEN_URL, new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: decrypt(connection.refreshTokenEncrypted),
                    redirect_uri: config.redirectUri,
                }).toString(), {
                    timeout: REQUEST_TIMEOUT_MS,
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                return this.persistTokens(response.data, connection.refreshTokenEncrypted, lockId);
            }
            catch (error) {
                const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
                if (status === 400 || status === 401) {
                    const invalidated = yield easyParcelConnection_model_1.EasyParcelConnection.updateOne({ _id: connection._id, refreshLockId: lockId, refreshTokenEncrypted: connection.refreshTokenEncrypted }, { $set: { invalidatedAt: new Date() }, $unset: { refreshLockId: 1, refreshLockExpiresAt: 1 } });
                    if (invalidated.modifiedCount) {
                        throw new EasyParcelApiError('EasyParcel authorization expired or was revoked; reconnect EasyParcel', false);
                    }
                    return this.waitForConcurrentRefresh();
                }
                throw error;
            }
            finally {
                yield easyParcelConnection_model_1.EasyParcelConnection.updateOne({ _id: connection._id, refreshLockId: lockId }, { $unset: { refreshLockId: 1, refreshLockExpiresAt: 1 } });
            }
        });
    }
    waitForConcurrentRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let attempt = 0; attempt < 120; attempt++) {
                yield new Promise((resolve) => setTimeout(resolve, 250));
                const connection = yield easyParcelConnection_model_1.EasyParcelConnection.findOne({ key: 'singleton' });
                if (!connection)
                    throw new Error('EasyParcel is not connected');
                if (connection.invalidatedAt)
                    throw new Error('EasyParcel authorization must be reconnected');
                if (connection.refreshLockExpiresAt && connection.refreshLockExpiresAt <= new Date())
                    return this.performRefresh();
                if (!connection.refreshLockId && connection.accessTokenEncrypted) {
                    if (connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + TOKEN_EXPIRY_SKEW_MS) {
                        return decrypt(connection.accessTokenEncrypted);
                    }
                    return this.performRefresh();
                }
            }
            throw new Error('Timed out waiting for EasyParcel authorization refresh');
        });
    }
    persistTokens(payload, existingRefreshToken, refreshLockId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const body = (payload === null || payload === void 0 ? void 0 : payload.data) || payload;
            const accessToken = body === null || body === void 0 ? void 0 : body.access_token;
            const refreshToken = body === null || body === void 0 ? void 0 : body.refresh_token;
            if (!accessToken || (!refreshToken && !existingRefreshToken))
                throw new Error('EasyParcel token response was incomplete');
            const accessExpiresIn = Number(body.expires_in || body.access_token_expires_in || 3600);
            const refreshExpiresIn = Number(body.refresh_expires_in || body.refresh_token_expires_in || 0);
            const update = {
                environment: ((_a = process.env.EASYPARCEL_ENV) === null || _a === void 0 ? void 0 : _a.trim()) || 'sandbox',
                accessTokenEncrypted: encrypt(accessToken),
                accessTokenExpiresAt: body.expires_at ? new Date(body.expires_at) : new Date(Date.now() + Math.max(1, accessExpiresIn) * 1000),
            };
            if (refreshToken)
                update.refreshTokenEncrypted = encrypt(refreshToken);
            else
                update.refreshTokenEncrypted = existingRefreshToken;
            if (body.refresh_token_expires_at)
                update.refreshTokenExpiresAt = new Date(body.refresh_token_expires_at);
            else if (refreshExpiresIn > 0)
                update.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000);
            const saved = yield easyParcelConnection_model_1.EasyParcelConnection.findOneAndUpdate(Object.assign({ key: 'singleton' }, (refreshLockId ? { refreshLockId } : {})), { $set: update, $unset: { oauthStateHash: 1, oauthStateExpiresAt: 1, invalidatedAt: 1, refreshLockId: 1, refreshLockExpiresAt: 1 }, $setOnInsert: { key: 'singleton' } }, { upsert: !refreshLockId, new: true, setDefaultsOnInsert: true });
            if (!saved && refreshLockId)
                return this.waitForConcurrentRefresh();
            return accessToken;
        });
    }
}
exports.easyParcelService = new EasyParcelService();
