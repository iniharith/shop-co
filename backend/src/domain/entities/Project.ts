/**
 * Coded by Harith
 * Kampungcetak (R)
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectFile {
  _id?: mongoose.Types.ObjectId;
  key: string;
  url: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface IProject extends Document {
  title: string;
  description: string;
  files: IProjectFile[];
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectFileSchema = new Schema<IProjectFile>({
  key: { type: String, required: true },
  url: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 10000 },
    files: { type: [ProjectFileSchema], default: [] },
    createdBy: { type: String, required: true, index: true, immutable: true },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

ProjectSchema.index({ updatedAt: -1 });
ProjectSchema.index({ title: 'text', description: 'text' });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
