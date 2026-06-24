import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId; // Optional if coming from raw WhatsApp without user mapping
  senderRole?: 'admin' | 'sysadmin' | 'boss' | 'designer' | 'production' | 'client' | 'system';
  text: string;
  isRead: boolean;
  source: 'web' | 'whatsapp';
}

const MessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    senderRole: {
      type: String,
      enum: ['admin', 'sysadmin', 'boss', 'designer', 'production', 'client', 'system'],
      default: 'client',
    },
    text: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['web', 'whatsapp'],
      default: 'web',
    },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessageDocument>('Message', MessageSchema);
