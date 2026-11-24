import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  ownerId: { type: String, required: true },
  clientId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  source: { type: String, enum: ['website', 'telegram', 'codex'], required: true },
  text: { type: String, required: true, maxlength: 30000 },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'cancelled'], default: 'completed' },
  parentId: String,
  leaseToken: String,
  approval: { id: String, decision: { type: String, enum: ['accept', 'decline'] } },
  telegramDeliveredAt: Date,
}, { timestamps: true });
messageSchema.index({ ownerId: 1, clientId: 1 }, { unique: true });
messageSchema.index({ ownerId: 1, createdAt: -1 });
messageSchema.index({ ownerId: 1, role: 1, status: 1, createdAt: 1 });

const roomSchema = new Schema({
  _id: String,
  workerSeenAt: Date,
  activeMessageId: String,
  leaseToken: String,
  leaseUntil: Date,
  codexThreadId: String,
}, { timestamps: true });

export const OwnerChatMessage = model('OwnerChatMessage', messageSchema);
export const OwnerChatRoom = model('OwnerChatRoom', roomSchema);
