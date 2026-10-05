import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  scope: { type: String, required: true },
  name: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});
schema.index({ scope: 1, name: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const UploadNameReservation = mongoose.model('UploadNameReservation', schema);
