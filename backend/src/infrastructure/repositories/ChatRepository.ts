/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { ConversationModel } from '../db/models/conversation.model';
import { MessageModel } from '../db/models/message.model';

export class ChatRepository {
  async findConversationsByUser(userId: string) {
    return ConversationModel.find({ participants: userId })
      .populate('participants', 'name email role')
      .sort({ lastMessageAt: -1 });
  }

  async findConversationById(id: string) {
    return ConversationModel.findById(id).populate('participants', 'name email role');
  }

  async findConversationByWhatsApp(phone: string) {
    return ConversationModel.findOne({ whatsappPhone: phone }).populate('participants', 'name email role');
  }

  async createConversation(data: any) {
    const conv = new ConversationModel(data);
    return conv.save();
  }

  async updateLastMessage(id: string) {
    return ConversationModel.findByIdAndUpdate(id, { lastMessageAt: new Date() }, { new: true });
  }

  async deleteConversation(id: string) {
    await MessageModel.deleteMany({ conversationId: id });
    return ConversationModel.findByIdAndDelete(id);
  }

  async getMessages(conversationId: string) {
    return MessageModel.find({ conversationId }).populate('senderId', 'name email role').sort({ createdAt: 1 });
  }

  async createMessage(data: any) {
    const msg = new MessageModel(data);
    return msg.save();
  }

  async markAsRead(conversationId: string, userId: string) {
    // Mark messages not from this user as read
    return MessageModel.updateMany(
      { conversationId, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

export const chatRepository = new ChatRepository();
