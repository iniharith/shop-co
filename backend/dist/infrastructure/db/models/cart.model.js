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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const mongoose_1 = __importStar(require("mongoose"));
const ConfigurationSchema = new mongoose_1.Schema({
    version: { type: Number, default: 1 },
    fulfillmentSize: { type: String, default: '' },
    selections: [{
            _id: false,
            name: { type: String, required: true },
            values: [{
                    _id: false,
                    label: { type: String, required: true },
                    priceAdd: { type: Number, default: 0 },
                }],
        }],
    design: {
        _id: false,
        type: { type: String, enum: ['upload', 'service', 'variation'] },
        label: { type: String },
        priceAdd: { type: Number, default: 0 },
        variantId: { type: String },
        variantLabel: { type: String },
        variantImage: { type: String },
        variationIndex: { type: Number },
        image: { type: String },
    },
}, { _id: false });
const CartItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    size: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    artworkUrl: {
        type: String,
        default: '',
    },
    configuration: { type: ConfigurationSchema },
    configurationKey: { type: String, default: '' },
    unitPrice: { type: Number, min: 0 },
    fixedPrice: { type: Number, min: 0, default: 0 },
    lineTotal: { type: Number, min: 0 },
    pricingVersion: { type: String, default: '' },
}, { _id: false });
const CartSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    items: [CartItemSchema],
    totalPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });
const CartModel = mongoose_1.default.model('Cart', CartSchema);
exports.default = CartModel;
