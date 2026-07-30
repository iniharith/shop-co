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
  folderId?: string;
  notes?: string;
}

export interface IProjectFolder {
  _id?: mongoose.Types.ObjectId;
  name: string;
}

export interface IProject extends Document {
  title: string;
  description: string;
  files: IProjectFile[];
  folders: IProjectFolder[];
  assigneeIds: string[];
  coverFileId?: string;
  createdBy: string;
  createdByName: string;
  deletingAt?: Date;
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
  folderId: { type: String, default: null },
  notes: { type: String, default: '', maxlength: 2000 },
});

const ProjectFolderSchema = new Schema<IProjectFolder>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
});

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 10000 },
    files: { type: [ProjectFileSchema], default: [] },
    folders: { type: [ProjectFolderSchema], default: [] },
    assigneeIds: { type: [String], default: [] },
    coverFileId: { type: String, default: null },
    createdBy: { type: String, required: true, index: true, immutable: true },
    createdByName: { type: String, default: '' },
    deletingAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ProjectSchema.index({ updatedAt: -1 });
ProjectSchema.index({ title: 'text', description: 'text' });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
