import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  taskId: { type: String, required: true, index: true },
  secretHash: { type: String, required: true, select: false },
  printer: { type: String, required: true },
  labels: { type: [Schema.Types.Mixed], required: true },
  pages: { type: [String], required: true },
  receipts: { type: [String], default: [] },
  state: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
  confirmationMode: { type: String, enum: ['printer-receipt', 'bluetooth-transfer', 'staff-override'] },
  confirmedAt: Date,
}, { timestamps: true });

export const AwbPrintJob = mongoose.models.AwbPrintJob || mongoose.model('AwbPrintJob', schema);
