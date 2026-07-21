import mongoose, { Schema } from 'mongoose';

const AuditLogSchema = new Schema({
  actorId: { type: String, index: true },
  actorName: { type: String, default: 'System' },
  actorRole: { type: String, default: 'system', index: true },
  source: { type: String, default: 'admin', index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, index: true },
  summary: { type: String, required: true, maxlength: 500 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  method: { type: String, required: true },
  route: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
