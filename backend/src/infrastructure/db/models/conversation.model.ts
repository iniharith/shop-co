/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationDocument extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'admin_customer' | 'admin_admin';
  orderId?: mongoose.Types.ObjectId;
  whatsappPhone?: string; // For customers interacting via WhatsApp
  lastMessageAt: Date;
}

const ConversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    type: {
      type: String,
      enum: ['admin_customer', 'admin_admin'],
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    whatsappPhone: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
ConversationSchema.index({ type: 1, lastMessageAt: -1 });
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const ConversationModel = mongoose.model<IConversationDocument>('Conversation', ConversationSchema);
