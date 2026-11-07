import mongoose, { Schema } from 'mongoose';

export type DescriptionActor = { id: string; name: string };
const schema = new Schema({
  taskId: { type: String, required: true, index: true, immutable: true },
  taskTitle: { type: String, required: true, immutable: true },
  kind: { type: String, enum: ['created', 'edit', 'baseline', 'trash'], required: true, immutable: true },
  beforeHtml: { type: String, default: '', immutable: true },
  afterHtml: { type: String, default: '', immutable: true },
  actorId: { type: String, required: true, immutable: true },
  actorName: { type: String, required: true, immutable: true },
  capturedAt: { type: Date, default: Date.now, required: true, immutable: true },
  sourceUpdatedAt: { type: Date, immutable: true },
}, { versionKey: false });
schema.index({ taskId: 1, capturedAt: -1, _id: -1 });
schema.index({ taskId: 1, kind: 1 }, { unique: true, partialFilterExpression: { kind: 'baseline' } });
// No TTL and no task-delete cascade: descriptions must survive task deletion.
export const TaskDescriptionRevision = mongoose.models.TaskDescriptionRevision || mongoose.model('TaskDescriptionRevision', schema);
