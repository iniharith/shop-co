import mongoose, { Schema } from 'mongoose';
const schema = new Schema({
  slot: { type: String },
  owner: { type: String, required: true },
  status: { type: String, enum: ['running', 'completed', 'failed'], required: true },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  leaseUntil: Date,
  filename: String,
  objectKey: String,
  bucket: String,
  iv: String,
  authTag: String,
  sha256: String,
  bytes: Number,
  error: String,
}, { timestamps: true });
schema.index({ slot: 1 }, { unique: true, sparse: true });
schema.index({ startedAt: -1 });
export const DatabaseBackup = mongoose.models.DatabaseBackup || mongoose.model('DatabaseBackup', schema);
const lockSchema = new Schema({ _id: String, owner: String, leaseUntil: Date }, { versionKey: false });
export const DatabaseBackupLock = mongoose.models.DatabaseBackupLock || mongoose.model('DatabaseBackupLock', lockSchema);
