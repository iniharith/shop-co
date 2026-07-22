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
exports.providerObservationTime = providerObservationTime;
exports.updateOrderFromEasyParcelStatus = updateOrderFromEasyParcelStatus;
exports.convergeOrderFromParcel = convergeOrderFromParcel;
exports.reconcilePendingAwbs = reconcilePendingAwbs;
exports.syncParcelTracking = syncParcelTracking;
const order_model_1 = __importDefault(require("../db/models/order.model"));
const ParcelRepository_1 = require("../repositories/ParcelRepository");
const CustomerUpdateSettingsService_1 = require("./CustomerUpdateSettingsService");
const EasyParcelService_1 = require("./EasyParcelService");
const WhatsAppService_1 = require("./WhatsAppService");
const redis_1 = require("../redis/redis");
const redis_constant_1 = require("../../shared/constants/redis.constant");
const redisService = new redis_1.RedisService();
function invalidateOrderCaches(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const order = yield order_model_1.default.findById(orderId).select('userId').lean();
        yield redisService.del(redis_constant_1.REDIS_KEYS.ORDERS);
        yield redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + orderId);
        if (order === null || order === void 0 ? void 0 : order.userId)
            yield redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + order.userId.toString());
    });
}
function whatsappStatus(status) {
    if (status === 'cancelled' || status === 'returned' || status === 'failed')
        return 'failed';
    if (status === 'on_hold' || status === 'drop_off')
        return 'pending';
    return status;
}
function providerObservationTime(events, fallback) {
    const timestamps = (events || [])
        .map((event) => new Date(event.timestamp).getTime())
        .filter(Number.isFinite);
    return timestamps.length ? new Date(Math.max(...timestamps)) : fallback;
}
function updateOrderFromEasyParcelStatus(orderId, statusCode, observedAt, events) {
    return __awaiter(this, void 0, void 0, function* () {
        const orderStatus = (0, EasyParcelService_1.mapEasyParcelOrderStatus)(statusCode);
        const update = {
            easyparcelShipmentStatusCode: statusCode,
            easyparcelStatusUpdatedAt: observedAt,
        };
        if (orderStatus)
            update.orderStatus = orderStatus;
        if (events)
            update.easyparcelTrackingEvents = events;
        const result = yield order_model_1.default.updateOne({
            _id: orderId,
            $or: [
                { easyparcelStatusUpdatedAt: { $exists: false } },
                { easyparcelStatusUpdatedAt: { $lt: observedAt } },
            ],
        }, { $set: update });
        yield invalidateOrderCaches(orderId);
        return result.modifiedCount > 0;
    });
}
function convergeOrderFromParcel(parcel) {
    return __awaiter(this, void 0, void 0, function* () {
        if (parcel.shipmentStatusCode === undefined || !parcel.providerStatusUpdatedAt)
            return false;
        return updateOrderFromEasyParcelStatus(parcel.orderId, parcel.shipmentStatusCode, parcel.providerStatusUpdatedAt, parcel.events);
    });
}
function reconcilePendingAwbs(parcels) {
    return __awaiter(this, void 0, void 0, function* () {
        const pending = parcels.filter((parcel) => parcel.easyparcelShipmentId && (!parcel.trackingNumber || parcel.bookingStatus === 'awb_pending'));
        if (!pending.length)
            return 0;
        const requestedAt = new Date();
        const listed = yield EasyParcelService_1.easyParcelService.findShipmentsByNumbers(pending.map((parcel) => parcel.easyparcelShipmentId));
        const byShipment = new Map(listed.map((shipment) => [shipment.shipmentNumber, shipment]));
        let reconciled = 0;
        for (const parcel of pending) {
            const shipment = byShipment.get(parcel.easyparcelShipmentId);
            if (!shipment)
                continue;
            const bookingStatus = shipment.awbNumber ? 'booked' : 'awb_pending';
            const observedAt = requestedAt;
            yield ParcelRepository_1.parcelRepository.update(parcel._id.toString(), {
                trackingNumber: shipment.awbNumber || undefined,
                bookingStatus,
                awbUrl: shipment.awbUrl,
                awbUrlsByFormat: shipment.awbUrlsByFormat,
                trackingUrl: shipment.trackingUrl,
                courier: shipment.courier || parcel.courier,
                service: shipment.service,
            });
            yield order_model_1.default.findByIdAndUpdate(parcel.orderId, {
                $set: {
                    easyparcelAwb: shipment.awbNumber || '',
                    trackingNumber: shipment.awbNumber || '',
                    easyparcelBookingStatus: bookingStatus,
                    awbUrl: shipment.awbUrl,
                    awbUrlsByFormat: shipment.awbUrlsByFormat,
                    trackingUrl: shipment.trackingUrl,
                    courier: shipment.courier,
                },
            });
            yield invalidateOrderCaches(parcel.orderId);
            if (shipment.statusCode !== undefined) {
                yield ParcelRepository_1.parcelRepository.updateProviderStatus(parcel._id.toString(), observedAt, {
                    shipmentStatusCode: shipment.statusCode,
                    status: (0, EasyParcelService_1.mapEasyParcelStatus)(shipment.statusCode),
                });
                yield updateOrderFromEasyParcelStatus(parcel.orderId, shipment.statusCode, observedAt);
            }
            reconciled++;
        }
        return reconciled;
    });
}
function syncParcelTracking(parcels) {
    return __awaiter(this, void 0, void 0, function* () {
        const reconciled = yield reconcilePendingAwbs(parcels);
        const refreshed = yield Promise.all(parcels.map((parcel) => ParcelRepository_1.parcelRepository.findById(parcel._id.toString())));
        const trackable = refreshed.filter((parcel) => Boolean((parcel === null || parcel === void 0 ? void 0 : parcel.trackingNumber) && !['submitted', 'awb_pending'].includes(parcel.bookingStatus || '')));
        const requestedAt = new Date();
        const results = yield EasyParcelService_1.easyParcelService.trackParcels(trackable.map((parcel) => parcel.trackingNumber));
        const byAwb = new Map(results.map((result) => [result.trackingNumber, result]));
        const notificationsEnabled = yield (0, CustomerUpdateSettingsService_1.areWhatsAppCustomerUpdatesEnabled)();
        let updated = 0;
        let notified = 0;
        for (const parcel of trackable) {
            const result = byAwb.get(parcel.trackingNumber);
            if (!result)
                continue;
            const statusChanged = parcel.shipmentStatusCode === undefined
                ? result.status !== parcel.status
                : result.statusCode !== parcel.shipmentStatusCode;
            const observedAt = providerObservationTime(result.events, requestedAt);
            const applied = yield ParcelRepository_1.parcelRepository.updateProviderStatus(parcel._id.toString(), observedAt, {
                lastStatus: statusChanged ? parcel.status : parcel.lastStatus,
                status: result.status,
                shipmentStatusCode: result.statusCode,
                courier: result.courier === 'unknown' ? parcel.courier : result.courier,
                events: result.events,
            });
            const current = applied || (yield ParcelRepository_1.parcelRepository.findById(parcel._id.toString()));
            if (!current)
                continue;
            yield convergeOrderFromParcel(current);
            if (applied)
                updated++;
            if (applied && statusChanged && notificationsEnabled && parcel.customerPhone) {
                const sent = yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
                    phone: parcel.customerPhone,
                    customerName: parcel.customerName,
                    trackingNumber: parcel.trackingNumber,
                    status: whatsappStatus(result.status),
                    courier: result.courier === 'unknown' ? parcel.courier : result.courier,
                });
                if (sent) {
                    notified++;
                    yield ParcelRepository_1.parcelRepository.update(parcel._id.toString(), { whatsappNotified: true });
                }
            }
        }
        return { updated, notified, reconciled };
    });
}
