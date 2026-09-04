/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Schema } from 'mongoose';
import { IProductDocument } from '../../../domain/interfaces/product.interface';


const ProductSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        // A product keeps one product type/category while appearing in one or
        // more storefront sections. This prevents duplicate product records.
        sections: [{
            type: String,
            trim: true,
        }],
        sizes: [{
            stock: { type: Number, min: 0, default: 0 },
            size: { type: String, trim: true },
            lowStockThreshold: { type: Number, min: 0, default: 10 },
        }],

        images: [{
            type: String,
            default: []
        }],
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        isDelete: {
            type: Boolean,
            default: false
        },
        rating: {
            type: Number,
            default: 0,
        },
        catalogId: {
            type: String,
            unique: true,
            sparse: true,
        },
        originalPrice: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        printingOptions: [{
            name: { type: String },
            isMultiSelect: { type: Boolean, default: false },
            options: [{
                label: { type: String },
                priceAdd: { type: Number, default: 0 },
            }],
        }],
        matrixPricing: {
            enabled: { type: Boolean, default: false },
            hideQuantityGrid: { type: Boolean, default: false },
            pricingData: [{
                material: { type: String },
                laminate: { type: String },
                lamination: { type: String },
                design: { type: String },
                quantityPrices: { type: Schema.Types.Mixed },
            }],
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
        specifications: {
            material: { type: String, trim: true },
            frame: { type: String, trim: true },
            dimensions: { type: String, trim: true },
            weight: { type: String, trim: true },
            finish: { type: String, trim: true },
            color: { type: String, trim: true },
            customFields: { type: Schema.Types.Mixed, default: {} },
        },
        packageContents: [{
            type: String,
            trim: true,
        }],
        installationInstructions: {
            type: String,
            trim: true,
        },
        productionTurnaround: {
            standardDays: { type: Number, min: 0 },
            expressDays: { type: Number, min: 0 },
            notes: { type: String, trim: true },
        },
        warrantyInfo: {
            type: String,
            trim: true,
        },
        customerPhotos: [{
            type: String,
        }],
        reviews: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            userName: { type: String, trim: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            title: { type: String, trim: true },
            comment: { type: String, trim: true },
            images: [{ type: String }],
            verifiedPurchase: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
            helpfulCount: { type: Number, default: 0 },
        }],

    },
    {
        timestamps: true,
    }
);


const ProductModel = mongoose.model<IProductDocument>('Product', ProductSchema);

export default ProductModel
