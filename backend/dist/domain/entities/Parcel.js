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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parcel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TrackingEventSchema = new mongoose_1.Schema({
    status: { type: String, default: '' },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
});
const ParcelSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    courier: { type: String, default: 'unknown' },
    status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
        default: 'pending',
    },
    lastStatus: { type: String, default: '' },
    events: { type: [TrackingEventSchema], default: [] },
    easyparcelShipmentId: { type: String },
    awbUrl: { type: String },
    weight: { type: Number, default: 1 },
    senderName: { type: String, default: 'Kampung Cetak' },
    senderPhone: { type: String, default: '' },
    senderAddress: { type: String, default: '' },
    recipientAddress: { type: String, default: '' },
    whatsappNotified: { type: Boolean, default: true },
}, { timestamps: true });
exports.Parcel = mongoose_1.default.model('Parcel', ParcelSchema);
