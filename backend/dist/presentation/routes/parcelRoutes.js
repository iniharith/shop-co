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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const ParcelRepository_1 = require("../../infrastructure/repositories/ParcelRepository");
const EasyParcelService_1 = require("../../infrastructure/services/EasyParcelService");
const WhatsAppService_1 = require("../../infrastructure/services/WhatsAppService");
const router = (0, express_1.Router)();
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
        'customerPhone',
        'customerName',
        'customerEmail',
        'weight',
        'senderAddress',
        'recipientAddress',
        'courier',
        'easyparcelShipmentId',
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
    const result = yield EasyParcelService_1.easyParcelService.trackParcel(parcel.trackingNumber);
    if (!result) {
        res
            .status(502)
            .json({ success: false, message: 'Could not fetch tracking from EasyParcel. Check your API key.' });
        return;
    }
    const statusChanged = result.status !== parcel.status;
    const updated = yield ParcelRepository_1.parcelRepository.update(req.params.id, {
        lastStatus: parcel.status,
        status: result.status,
        courier: result.courier,
        events: result.events,
    });
    // Auto-notify customer if status changed
    if (statusChanged && parcel.customerPhone) {
        yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
            phone: parcel.customerPhone,
            customerName: parcel.customerName,
            trackingNumber: parcel.trackingNumber,
            status: result.status,
            courier: result.courier,
        });
        yield ParcelRepository_1.parcelRepository.update(req.params.id, { whatsappNotified: true });
    }
    res.json({
        success: true,
        data: updated,
        statusChanged,
        previousStatus: parcel.status,
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
    const awbUrl = yield EasyParcelService_1.easyParcelService.getAWB(parcel.easyparcelShipmentId);
    if (!awbUrl) {
        res.status(502).json({ success: false, message: 'Could not fetch AWB from EasyParcel' });
        return;
    }
    yield ParcelRepository_1.parcelRepository.update(req.params.id, { awbUrl });
    res.json({ success: true, awbUrl });
})));
// ─── POST /api/parcels/sync-all ───────────────────────────────────────────────
// Manually trigger sync of all active parcels
router.post('/sync-all', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const activeParcels = yield ParcelRepository_1.parcelRepository.findActiveDeliveries();
    let updated = 0;
    let notified = 0;
    for (const parcel of activeParcels) {
        const result = yield EasyParcelService_1.easyParcelService.trackParcel(parcel.trackingNumber);
        if (!result)
            continue;
        const statusChanged = result.status !== parcel.status;
        yield ParcelRepository_1.parcelRepository.update(parcel._id, {
            status: result.status,
            courier: result.courier,
            events: result.events,
        });
        updated++;
        if (statusChanged && parcel.customerPhone) {
            const sent = yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
                phone: parcel.customerPhone,
                customerName: parcel.customerName,
                trackingNumber: parcel.trackingNumber,
                status: result.status,
                courier: result.courier,
            });
            if (sent) {
                yield ParcelRepository_1.parcelRepository.update(parcel._id, { whatsappNotified: true });
                notified++;
            }
        }
    }
    res.json({
        success: true,
        message: `Synced ${updated} parcel(s), sent ${notified} WhatsApp notification(s)`,
        updated,
        notified,
    });
})));
// ─── POST /api/parcels/:id/whatsapp ───────────────────────────────────────────
// Manually send a WhatsApp status update to a customer
router.post('/:id/whatsapp', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield ParcelRepository_1.parcelRepository.findById(req.params.id);
    if (!parcel) {
        res.status(404).json({ success: false, message: 'Parcel not found' });
        return;
    }
    const sent = yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
        phone: parcel.customerPhone,
        customerName: parcel.customerName,
        trackingNumber: parcel.trackingNumber,
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
