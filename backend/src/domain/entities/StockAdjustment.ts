import mongoose, { Schema } from 'mongoose';

const StockAdjustmentSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productName: { type: String, required: true },
  size: { type: String, required: true },
  delta: { type: Number, required: true },
  beforeStock: { type: Number, required: true, min: 0 },
  afterStock: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true, maxlength: 300 },
  source: { type: String, required: true, enum: ['admin', 'order', 'rollback', 'initial'], index: true },
  actorId: { type: String },
  actorName: { type: String, default: 'System' },
  referenceId: { type: String },
}, { timestamps: true });

StockAdjustmentSchema.index({ productId: 1, createdAt: -1 });
StockAdjustmentSchema.index({ productId: 1, size: 1, createdAt: -1 });

export const StockAdjustment = mongoose.model('StockAdjustment', StockAdjustmentSchema);
