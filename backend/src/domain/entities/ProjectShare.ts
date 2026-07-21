import mongoose, { Schema } from 'mongoose';

const ProjectShareSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  createdBy: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  lastAccessedAt: { type: Date },
}, { timestamps: true });

export const ProjectShare = mongoose.model('ProjectShare', ProjectShareSchema);
