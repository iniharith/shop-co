import mongoose, { Schema } from 'mongoose';

const stationSchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  pairingHash: String,
  pairingExpiresAt: Date,
  deviceHash: String,
  phoneName: String,
  deviceApproved: { type: Boolean, default: false },
  phoneSeenAt: Date,
  pcSeenAt: Date,
}, { timestamps: true });

const scanSchema = new Schema({
  stationId: { type: String, required: true, index: true },
  requestId: { type: String, required: true },
  token: { type: String, required: true },
  test: { type: Boolean, default: false },
  status: { type: String, enum: ['queued', 'received', 'ready', 'error'], default: 'queued' },
  message: String,
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
scanSchema.index({ stationId: 1, requestId: 1 }, { unique: true });
scanSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ProductionStation = mongoose.model('ProductionStation', stationSchema);
export const ProductionScan = mongoose.model('ProductionScan', scanSchema);
