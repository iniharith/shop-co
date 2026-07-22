"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const ParcelRepository_1 = require("../../infrastructure/repositories/ParcelRepository");
const EasyParcelService_1 = require("../../infrastructure/services/EasyParcelService");
const EasyParcelTrackingSyncService_1 = require("../../infrastructure/services/EasyParcelTrackingSyncService");
const WhatsAppService_1 = require("../../infrastructure/services/WhatsAppService");
const CustomerUpdateSettingsService_1 = require("../../infrastructure/services/CustomerUpdateSettingsService");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'production', 'packaging'));
// ─── GET /api/parcels ─────────────────────────────────────────────────────────
// List all parcels with optional filters (admin)
router.get('/', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, search } = req.query;
    const parcels = yield ParcelRepository_1.parcelRepository.findAll({ status, search });
    const stats = yield ParcelRepository_1.parcelRepository.getStats();
    res.json({ success: true, data: parcels, stats });
})));
// ─── GET /api/parcels/stats ───────────────────────────────────────────────────
router.get('/stats', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield ParcelRepository_1.parcelRepository.getStats();
    const recent = yield ParcelRepository_1.parcelRepository.getRecentActivity(5);
    res.json({ success: true, data: stats, recent });
})));
router.get('/customer-update-settings', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const enabled = yield (0, CustomerUpdateSettingsService_1.areWhatsAppCustomerUpdatesEnabled)();
    res.json({ success: true, data: { enabled } });
})));
router.put('/customer-update-settings', (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof req.body.enabled !== 'boolean') {
        res.status(400).json({ success: false, message: 'enabled must be a boolean' });
        return;
    }
    const enabled = yield (0, CustomerUpdateSettingsService_1.setWhatsAppCustomerUpdatesEnabled)(req.body.enabled);
    res.json({
        success: true,
        data: { enabled },
        message: `WhatsApp customer auto-updates ${enabled ? 'enabled' : 'disabled'}`,
    });
})));
// ─── POST /api/parcels ────────────────────────────────────────────────────────
// Create a new parcel record (admin)
router.post('/', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, trackingNumber, customerPhone, customerName, customerEmail, weight, senderName, senderPhone, senderAddress, recipientAddress, courier, } = req.body;
    if (!trackingNumber || !customerPhone || !customerName || !orderId) {
        res
            .status(400)
            .json({
            success: false,
            message: 'orderId, trackingNumber, customerPhone, customerName are required',
        });
        return;
    }
    // Check for duplicate tracking number
    const existing = yield ParcelRepository_1.parcelRepository.findByTrackingNumber(trackingNumber);
    if (existing) {
        res.status(409).json({ success: false, message: 'Tracking number already exists' });
        return;
    }
    const parcel = yield ParcelRepository_1.parcelRepository.create({
        orderId,
        trackingNumber,
        customerPhone,
        customerName,
        customerEmail,
        weight: weight || 1,
        senderName: senderName || 'Kampung Cetak',
        senderPhone: senderPhone || '',
        senderAddress: senderAddress || '',
        recipientAddress: recipientAddress || '',
        courier: courier || 'unknown',
        status: 'pending',
        lastStatus: '',
    });
    res.status(201).json({ success: true, data: parcel });
})));
// ─── GET /api/parcels/:id ─────────────────────────────────────────────────────
router.get('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!parcel) {
        res.status(404).json({ success: false, message: 'Parcel not found' });
        return;
    }
    res.json({ success: true, data: parcel });
})));
// ─── PUT /api/parcels/:id ─────────────────────────────────────────────────────
// Update parcel fields (admin edit)
router.put('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const allowed = [
        'orderId',
        'trackingNumber',
        'status',
        'customerPhone',
        'customerName',
        'customerEmail',
        'weight',
        'senderAddress',
        'recipientAddress',
        'courier',
    ];
    const update = {};
    allowed.forEach((k) => {
        if (req.body[k] !== undefined)
            update[k] = req.body[k];
    });
    const updated = yield ParcelRepository_1.parcelRepository.update(req.params.id, update);
    if (!updated) {
        res.status(404).json({ success: false, message: 'Parcel not found' });
        return;
    }
    // Sync order status if parcel status is updated manually
    if (update.status && updated.orderId) {
        let orderStatusStr = '';
        if (update.status === 'picked_up')
            orderStatusStr = 'SHIPPED';
        if (['in_transit', 'out_for_delivery'].includes(update.status))
            orderStatusStr = 'IN_TRANSIT';
        if (update.status === 'delivered')
            orderStatusStr = 'DELIVERED';
        if (orderStatusStr) {
            yield order_model_1.default.findByIdAndUpdate(updated.orderId, { orderStatus: orderStatusStr });
        }
    }
    res.json({ success: true, data: updated });
})));
// ─── PUT /api/parcels/:id/track ───────────────────────────────────────────────
// Manually refresh tracking status from EasyParcel
router.put('/:id/track', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!parcel) {
        res.status(404).json({ success: false, message: 'Parcel not found' });
        return;
    }
    yield (0, EasyParcelTrackingSyncService_1.reconcilePendingAwbs)([parcel]);
    const refreshedParcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!(refreshedParcel === null || refreshedParcel === void 0 ? void 0 : refreshedParcel.trackingNumber)) {
        res.status(409).json({ success: false, message: 'AWB is still pending from EasyParcel' });
        return;
    }
    const requestedAt = new Date();
    const result = (yield EasyParcelService_1.easyParcelService.trackParcels([refreshedParcel.trackingNumber]))[0];
    if (!result) {
        res
            .status(502)
            .json({ success: false, message: 'Could not fetch tracking from EasyParcel. Check your API key.' });
        return;
    }
    const statusChanged = refreshedParcel.shipmentStatusCode === undefined
        ? result.status !== refreshedParcel.status
        : result.statusCode !== refreshedParcel.shipmentStatusCode;
    const courier = result.courier === 'unknown' ? refreshedParcel.courier : result.courier;
    const observedAt = (0, EasyParcelTrackingSyncService_1.providerObservationTime)(result.events, requestedAt);
    const updated = yield ParcelRepository_1.parcelRepository.updateProviderStatus(req.params.id, observedAt, {
        lastStatus: refreshedParcel.status,
        status: result.status,
        shipmentStatusCode: result.statusCode,
        courier,
        events: result.events,
    });
    const current = updated || (yield ParcelRepository_1.parcelRepository.findById(req.params.id));
    if (current)
        yield (0, EasyParcelTrackingSyncService_1.convergeOrderFromParcel)(current);
    const appliedStatusChanged = statusChanged && Boolean(updated);
    // Auto-notify customer if status changed
    if (appliedStatusChanged && parcel.customerPhone && (yield (0, CustomerUpdateSettingsService_1.areWhatsAppCustomerUpdatesEnabled)())) {
        yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
            phone: parcel.customerPhone,
            customerName: parcel.customerName,
            trackingNumber: refreshedParcel.trackingNumber,
            status: result.status,
            courier,
        });
        yield ParcelRepository_1.parcelRepository.update(req.params.id, { whatsappNotified: true });
    }
    res.json({
        success: true,
        data: current,
        statusChanged: appliedStatusChanged,
        previousStatus: refreshedParcel.status,
        newStatus: result.status,
    });
})));
// ─── GET /api/parcels/:id/awb ─────────────────────────────────────────────────
// Get AWB PDF download URL
router.get('/:id/awb', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!parcel) {
        res.status(404).json({ success: false, message: 'Parcel not found' });
        return;
    }
    if (!parcel.easyparcelShipmentId) {
        res.status(400).json({
            success: false,
            message: 'No EasyParcel shipment ID on record. Create a shipment first.',
        });
        return;
    }
    // Use cached URL if available
    if (parcel.awbUrl) {
        res.json({ success: true, awbUrl: parcel.awbUrl });
        return;
    }
    yield (0, EasyParcelTrackingSyncService_1.reconcilePendingAwbs)([parcel]);
    const refreshedParcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!(refreshedParcel === null || refreshedParcel === void 0 ? void 0 : refreshedParcel.awbUrl)) {
        res.status(409).json({ success: false, message: 'AWB is still pending from EasyParcel' });
        return;
    }
    res.json({ success: true, awbUrl: refreshedParcel.awbUrl, awbUrlsByFormat: refreshedParcel.awbUrlsByFormat });
})));
// ─── POST /api/parcels/sync-all ───────────────────────────────────────────────
// Manually trigger sync of all active parcels
router.post('/sync-all', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const activeParcels = yield ParcelRepository_1.parcelRepository.findActiveDeliveries();
    const { updated, notified, reconciled } = yield (0, EasyParcelTrackingSyncService_1.syncParcelTracking)(activeParcels);
    res.json({
        success: true,
        message: `Synced ${updated} parcel(s), sent ${notified} WhatsApp notification(s)`,
        updated,
        notified,
        reconciled,
    });
})));
// ─── POST /api/parcels/:id/whatsapp ───────────────────────────────────────────
// Manually send a WhatsApp status update to a customer
router.post('/:id/whatsapp', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield (0, CustomerUpdateSettingsService_1.areWhatsAppCustomerUpdatesEnabled)())) {
        res.status(503).json({ success: false, message: 'WhatsApp customer updates are temporarily disabled' });
        return;
    }
    const parcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!parcel) {
        res.status(404).json({ success: false, message: 'Parcel not found' });
        return;
    }
    const sent = yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
        phone: parcel.customerPhone,
        customerName: parcel.customerName,
        trackingNumber: parcel.trackingNumber || 'Pending',
        status: parcel.status,
        courier: parcel.courier,
    });
    if (sent) {
        yield ParcelRepository_1.parcelRepository.update(parcel._id, { whatsappNotified: true });
    }
    res.json({ success: sent, message: sent ? 'WhatsApp message sent' : 'Failed to send WhatsApp' });
})));
// ─── DELETE /api/parcels/:id ──────────────────────────────────────────────────
router.delete('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!parcel) {
        res.status(404).json({ success: false, message: 'Parcel not found' });
        return;
    }
    yield ParcelRepository_1.parcelRepository.delete(req.params.id);
    res.json({ success: true, message: 'Parcel deleted' });
})));
exports.default = router;
