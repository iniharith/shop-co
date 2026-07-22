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
exports.Parcel = void 0;
exports.ensureParcelIndexes = ensureParcelIndexes;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const mongoose_1 = __importStar(require("mongoose"));
const TrackingEventSchema = new mongoose_1.Schema({
    status: { type: String, default: '' },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
});
const ParcelSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true, index: true },
    trackingNumber: { type: String, unique: true, sparse: true, index: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    courier: { type: String, default: 'unknown' },
    service: { type: String },
    status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'on_hold', 'drop_off', 'cancelled', 'failed'],
        default: 'pending',
    },
    lastStatus: { type: String, default: '' },
    events: { type: [TrackingEventSchema], default: [] },
    easyparcelShipmentId: { type: String, unique: true, sparse: true, index: true },
    easyparcelOrderNumber: { type: String, index: true },
    serviceId: { type: String },
    awbUrl: { type: String },
    awbUrlsByFormat: {
        A4: { type: String },
        A5: { type: String },
        A6: { type: String },
    },
    trackingUrl: { type: String },
    bookingStatus: { type: String, enum: ['submitted', 'awb_pending', 'booked', 'failed'] },
    shipmentStatusCode: { type: Number },
    providerStatusUpdatedAt: { type: Date },
    collectionDate: { type: Date },
    shippingPrice: { type: Number },
    currency: { type: String },
    dimensions: {
        width: { type: Number, default: 0 },
        length: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
    },
    weight: { type: Number, default: 1 },
    senderName: { type: String, default: 'Kampung Cetak' },
    senderPhone: { type: String, default: '' },
    senderAddress: { type: String, default: '' },
    recipientAddress: { type: String, default: '' },
    whatsappNotified: { type: Boolean, default: true },
}, { timestamps: true });
ParcelSchema.set('autoIndex', false);
exports.Parcel = mongoose_1.default.model('Parcel', ParcelSchema);
function ensureParcelIndexes() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exports.Parcel.createCollection();
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) !== 48 && (error === null || error === void 0 ? void 0 : error.codeName) !== 'NamespaceExists')
                throw error;
        }
        const indexes = yield exports.Parcel.collection.indexes();
        const trackingIndex = indexes.find((index) => index.name === 'trackingNumber_1');
        if (trackingIndex && (trackingIndex.unique !== true || trackingIndex.sparse !== true)) {
            yield exports.Parcel.collection.createIndex({ trackingNumber: 1 }, { name: 'trackingNumber_sparse_unique_v2', unique: true, sparse: true });
            try {
                yield exports.Parcel.collection.dropIndex('trackingNumber_1');
            }
            catch (error) {
                if ((error === null || error === void 0 ? void 0 : error.code) !== 27 && (error === null || error === void 0 ? void 0 : error.codeName) !== 'IndexNotFound')
                    throw error;
            }
        }
        const currentNames = new Set((yield exports.Parcel.collection.indexes()).map((index) => index.name));
        if (!currentNames.has('orderId_1'))
            yield exports.Parcel.collection.createIndex({ orderId: 1 }, { name: 'orderId_1' });
        if (!currentNames.has('trackingNumber_1') && !currentNames.has('trackingNumber_sparse_unique_v2')) {
            yield exports.Parcel.collection.createIndex({ trackingNumber: 1 }, { name: 'trackingNumber_sparse_unique_v2', unique: true, sparse: true });
        }
        if (!currentNames.has('easyparcelShipmentId_1')) {
            yield exports.Parcel.collection.createIndex({ easyparcelShipmentId: 1 }, { name: 'easyparcelShipmentId_1', unique: true, sparse: true });
        }
        if (!currentNames.has('easyparcelOrderNumber_1')) {
            yield exports.Parcel.collection.createIndex({ easyparcelOrderNumber: 1 }, { name: 'easyparcelOrderNumber_1' });
        }
    });
}
