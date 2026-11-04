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
exports.ProductionScan = exports.ProductionStation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const stationSchema = new mongoose_1.Schema({
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    pairingHash: String,
    pairingExpiresAt: Date,
    deviceHash: String,
    phoneName: String,
    deviceApproved: { type: Boolean, default: false },
    phoneSeenAt: Date,
    botHash: String,
    botApproved: { type: Boolean, default: false },
    botSeenAt: Date,
    pcSeenAt: Date,
}, { timestamps: true });
const scanSchema = new mongoose_1.Schema({
    stationId: { type: String, required: true, index: true },
    requestId: { type: String, required: true },
    token: { type: String, required: true },
    test: { type: Boolean, default: false },
    batch: { type: new mongoose_1.Schema({ tokens: [String], folder: String }, { _id: false }), default: undefined },
    source: { type: String, enum: ['phone', 'bot'], default: 'phone' },
    status: { type: String, enum: ['queued', 'received', 'ready', 'error'], default: 'queued' },
    message: String,
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
scanSchema.index({ stationId: 1, requestId: 1 }, { unique: true });
scanSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.ProductionStation = mongoose_1.default.model('ProductionStation', stationSchema);
exports.ProductionScan = mongoose_1.default.model('ProductionScan', scanSchema);
