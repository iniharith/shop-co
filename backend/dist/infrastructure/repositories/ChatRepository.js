"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = exports.ChatRepository = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const conversation_model_1 = require("../db/models/conversation.model");
const message_model_1 = require("../db/models/message.model");
class ChatRepository {
    findConversationsByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return conversation_model_1.ConversationModel.find({ participants: userId })
                .populate('participants', 'name email role')
                .sort({ lastMessageAt: -1 });
        });
    }
    findConversationById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return conversation_model_1.ConversationModel.findById(id).populate('participants', 'name email role');
        });
    }
    findConversationByWhatsApp(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            return conversation_model_1.ConversationModel.findOne({ whatsappPhone: phone }).populate('participants', 'name email role');
        });
    }
    createConversation(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const conv = new conversation_model_1.ConversationModel(data);
            return conv.save();
        });
    }
    updateLastMessage(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return conversation_model_1.ConversationModel.findByIdAndUpdate(id, { lastMessageAt: new Date() }, { new: true });
        });
    }
    deleteConversation(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield message_model_1.MessageModel.deleteMany({ conversationId: id });
            return conversation_model_1.ConversationModel.findByIdAndDelete(id);
        });
    }
    getMessages(conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return message_model_1.MessageModel.find({ conversationId }).populate('senderId', 'name email role').sort({ createdAt: 1 });
        });
    }
    createMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = new message_model_1.MessageModel(data);
            return msg.save();
        });
    }
    updateMessage(id, text) {
        return __awaiter(this, void 0, void 0, function* () {
            return message_model_1.MessageModel.findByIdAndUpdate(id, { text }, { new: true }).populate('senderId', 'name email role');
        });
    }
    deleteMessage(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return message_model_1.MessageModel.findByIdAndDelete(id).populate('senderId', 'name email role');
        });
    }
    markAsRead(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Mark messages not from this user as read
            return message_model_1.MessageModel.updateMany({ conversationId, senderId: { $ne: userId }, isRead: false }, { $set: { isRead: true } });
        });
    }
}
exports.ChatRepository = ChatRepository;
exports.chatRepository = new ChatRepository();
