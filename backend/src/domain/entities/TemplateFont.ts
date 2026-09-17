import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateFont extends Document {
  name: string;
  family: string;
  url: string;
  key: string;
  mimeType: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateFontSchema = new Schema<ITemplateFont>({
  name: { type: String, required: true, trim: true },
  family: { type: String, required: true, trim: true, unique: true },
  url: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  createdBy: { type: String },
}, { timestamps: true });

TemplateFontSchema.index({ name: 1 });

export const TemplateFont = mongoose.model<ITemplateFont>('TemplateFont', TemplateFontSchema);
