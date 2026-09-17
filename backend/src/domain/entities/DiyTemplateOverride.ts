import mongoose, { Schema } from 'mongoose';

const DiyTemplateOverrideSchema = new Schema({
  templateId: { type: String, required: true, unique: true, index: true },
  template: { type: Schema.Types.Mixed, required: true },
  updatedBy: { type: String },
}, { timestamps: true });

export const DiyTemplateOverride = mongoose.model('DiyTemplateOverride', DiyTemplateOverrideSchema);
