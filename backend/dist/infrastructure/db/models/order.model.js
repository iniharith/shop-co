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
const OrderedProductSchema = new mongoose_1.Schema({
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
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    artworkUrl: {
        type: String,
        default: '',
    },
}, { _id: false });
const AddressSchema = new mongoose_1.Schema({
    address: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    customerName: {
        type: String,
        required: true,
    },
    orderNotes: {
        type: String,
        default: '',
    },
    products: [OrderedProductSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING',
    },
    orderStatus: {
        type: String,
        enum: ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'PRINT_AWB', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED', 'FAILED'],
        default: 'PLACED',
    },
    platform: {
        type: String,
        enum: ['WEB', 'TIKTOK', 'SHOPEE'],
        default: 'WEB',
    },
    address: AddressSchema,
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isArchived: {
        type: Boolean,
        default: false,
    },
    trackingNumber: {
        type: String,
        default: '',
    },
    easyparcelOrderNo: {
        type: String,
        default: '',
    },
    easyparcelAwb: {
        type: String,
        default: '',
    },
    easyparcelShipmentId: { type: String, index: true, sparse: true },
    easyparcelBookingStatus: {
        type: String,
        enum: ['submitted', 'awb_pending', 'booked', 'failed'],
    },
    awbUrl: { type: String },
    awbUrlsByFormat: {
        A4: { type: String },
        A5: { type: String },
        A6: { type: String },
    },
    trackingUrl: { type: String },
    courier: { type: String },
    shippingPrice: { type: Number },
    easyparcelServiceId: { type: String },
    shippingWeight: { type: Number },
    shippingDimensions: {
        width: { type: Number },
        length: { type: Number },
        height: { type: Number },
    },
    shippingCollectionDate: { type: Date },
    shippingCustomerPhone: { type: String },
    shippingCustomerEmail: { type: String },
    easyparcelShipmentStatusCode: { type: Number },
    easyparcelStatusUpdatedAt: { type: Date },
    easyparcelTrackingEvents: [{
            status: { type: String, default: '' },
            description: { type: String, default: '' },
            location: { type: String, default: '' },
            timestamp: { type: Date },
        }],
}, { timestamps: true });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
const OrderModel = mongoose_1.default.model('Order', OrderSchema);
exports.default = OrderModel;
