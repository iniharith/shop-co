import mongoose, { Schema } from 'mongoose';
const schema = new Schema({
  kind: { type: String, enum: ['task', 'file'], required: true },
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  taskId: String,
  ownerId: String,
  deletedBy: { type: String, required: true },
  deletedAt: { type: Date, required: true },
  purgeAt: { type: Date, required: true },
  state: { type: String, enum: ['deleted', 'purging'], default: 'deleted' },
  purgeLeaseAt: Date,
  payload: { type: Schema.Types.Mixed, required: true },
  purgePaths: [String],
  lastPurgeError: String,
}, { timestamps: true });
schema.index({ kind: 1, itemId: 1 }, { unique: true });
schema.index({ state: 1, purgeAt: 1 });
// No TTL index: permanent deletion must successfully remove stored objects before metadata.
export const TrashItem = mongoose.models.TrashItem || mongoose.model('TrashItem', schema);
