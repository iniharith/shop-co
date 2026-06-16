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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ParcelRepository_1 = require("../../infrastructure/repositories/ParcelRepository");
const WhatsAppService_1 = require("../services/WhatsAppService");
const router = (0, express_1.Router)();
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'kampungcetak_webhook_secret';
// ─── GET /api/webhooks/whatsapp ───────────────────────────────────────────────
// Meta calls this once to VERIFY your webhook URL is real.
// It sends hub.challenge — we must echo it back to pass verification.
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    console.log('[Webhook] Verification request received:', { mode, token });
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] ✅ Webhook verified by Meta');
        res.status(200).send(challenge);
    }
    else {
        console.warn('[Webhook] ❌ Verification failed — token mismatch');
        res.status(403).json({ error: 'Verification failed' });
    }
});
// ─── POST /api/webhooks/whatsapp ──────────────────────────────────────────────
// Meta sends delivery status updates and incoming messages here.
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Always respond 200 immediately — Meta will retry if you don't
    res.status(200).json({ status: 'received' });
    try {
        const body = req.body;
        // Validate this is a WhatsApp Business event
        if (body.object !== 'whatsapp_business_account')
            return;
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                const value = change.value;
                // ── Message Status Updates (sent / delivered / read / failed) ──
                if (value === null || value === void 0 ? void 0 : value.statuses) {
                    for (const status of value.statuses) {
                        console.log(`[Webhook] Message status: ${status.status} for ${status.recipient_id}`);
                        // If a message failed to send, log it for debugging
                        if (status.status === 'failed') {
                            console.error('[Webhook] Message failed:', JSON.stringify(status.errors));
                        }
                    }
                }
                // ── Incoming Messages from Customers ──
                if (value === null || value === void 0 ? void 0 : value.messages) {
                    for (const message of value.messages) {
                        const from = message.from; // Customer's phone number
                        const type = message.type;
                        const messageId = message.id;
                        console.log(`[Webhook] Incoming ${type} message from ${from}`);
                        // Auto-reply: if customer sends a tracking number keyword
                        if (type === 'text') {
                            const text = (((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || '').trim().toLowerCase();
                            // Handle "track XXXXX" command
                            if (text.startsWith('track ') || text.startsWith('jejak ')) {
                                const trackingNumber = text.split(' ').slice(1).join(' ').toUpperCase();
                                if (trackingNumber) {
                                    const parcel = yield ParcelRepository_1.parcelRepository.findByTrackingNumber(trackingNumber);
                                    if (parcel) {
                                        yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
                                            phone: from,
                                            customerName: parcel.customerName || 'Pelanggan',
                                            trackingNumber: parcel.trackingNumber,
                                            status: parcel.status,
                                            courier: parcel.courier,
                                        });
                                    }
                                    else {
                                        // Send not-found reply directly via Meta API
                                        const { default: axiosLib } = yield Promise.resolve().then(() => __importStar(require('axios')));
                                        yield axiosLib.post(`${process.env.META_WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0'}/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`, {
                                            messaging_product: 'whatsapp',
                                            to: from,
                                            type: 'text',
                                            text: { body: `❌ Nombor penjejakan *${trackingNumber}* tidak dijumpai.\n\nSila semak nombor dan cuba lagi, atau hubungi kami di https://kampungcetak.com` },
                                        }, { headers: { Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}` } });
                                    }
                                }
                            }
                        }
                        // Mark message as read
                        try {
                            const { default: axios } = yield Promise.resolve().then(() => __importStar(require('axios')));
                            const META_API_URL = process.env.META_WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
                            const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
                            const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
                            yield axios.post(`${META_API_URL}/${PHONE_NUMBER_ID}/messages`, { messaging_product: 'whatsapp', status: 'read', message_id: messageId }, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
                        }
                        catch (_) {
                            // Non-critical — ignore read receipt errors
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        console.error('[Webhook] Processing error:', error === null || error === void 0 ? void 0 : error.message);
    }
}));
exports.default = router;
