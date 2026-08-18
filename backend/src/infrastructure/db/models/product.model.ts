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
            stock: Number,
            size: String,
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
        averageRating: {
            type: Number,
            default: 0,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },

    },
    {
        timestamps: true,
    }
);


const ProductModel = mongoose.model<IProductDocument>('Product', ProductSchema);

export default ProductModel
