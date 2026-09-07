/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Schema } from 'mongoose';
import { IProductDocument } from '../../../domain/interfaces/product.interface';

const SizeSchema = new Schema(
  {
    stock: { type: Number, default: 0, min: 0 },
    size: { type: String, required: true, trim: true },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    images: [{ type: String }],
  },
  { _id: false },
);

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    originalPrice: { type: Number, min: 0, default: 0 },
    discount: { type: Number, default: 0 },
    category: { type: String, required: true, trim: true },
    sizes: { type: [SizeSchema], default: [] },
    images: { type: [String], default: [] },
    printingOptions: { type: [Schema.Types.Mixed], default: [] },
    sections: { type: [String], default: [] },
    slug: { type: String, trim: true, index: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    specifications: {
      material: String,
      frame: String,
      dimensions: String,
      weight: String,
      finish: String,
      color: String,
      customFields: { type: Map, of: String, default: {} },
    },
    packageContents: { type: [String], default: [] },
    productionTurnaround: {
      standardDays: Number,
      expressDays: Number,
      notes: String,
    },
    warrantyInfo: { type: String, default: '' },
    catalogId: { type: String, index: true },
    isDelete: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    rating: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ProductModel = mongoose.model<IProductDocument>('Product', ProductSchema);

export default ProductModel;
