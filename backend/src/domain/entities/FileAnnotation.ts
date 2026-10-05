import mongoose, { Schema } from 'mongoose';
import { ImageAnnotation } from '../../shared/utils/fileAnnotations';

export interface IFileAnnotation {
  fileId: string;
  editorId: string;
  editorName: string;
  items: ImageAnnotation[];
  revision: number;
  updatedAt: Date;
}

const annotationSchema = new Schema<ImageAnnotation>({
  id: { type: String, required: true },
  kind: { type: String, enum: ['stroke', 'pin', 'note'], required: true },
  color: { type: String, required: true },
  width: { type: Number, required: true },
  points: { type: [new Schema({ x: Number, y: Number }, { _id: false })], default: undefined },
  x: Number,
  y: Number,
  text: String,
}, { _id: false });

const schema = new Schema<IFileAnnotation>({
  fileId: { type: String, required: true },
  editorId: { type: String, required: true },
  editorName: { type: String, required: true },
  items: { type: [annotationSchema], default: [] },
  revision: { type: Number, required: true, default: 1 },
}, { timestamps: true });
schema.index({ fileId: 1, editorId: 1 }, { unique: true });
export const FileAnnotation = mongoose.model<IFileAnnotation>('FileAnnotation', schema);
