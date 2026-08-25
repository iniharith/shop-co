"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const ChatRepository_1 = require("../../infrastructure/repositories/ChatRepository");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const redis_1 = require("../../infrastructure/redis/redis");
const redis_constant_1 = require("../../shared/constants/redis.constant");
const router = (0, express_1.Router)();
const redisService = new redis_1.RedisService();
const publishChatMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    yield redisService.publish(redis_constant_1.REDIS_CHANNELS.CHAT_MESSAGE, JSON.stringify(message));
});
const ADMIN_ROLES = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'];
// GET /api/chat/conversations
router.get('/conversations', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    // For admins, we might want to return ALL conversations, or just theirs + customer ones.
    // For simplicity, let's just return conversations they are part of, or all if admin?
    const role = authReq.role;
    const requestedType = req.query.type;
    const { ConversationModel } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/models/conversation.model')));
    let conversationQuery;
    if (requestedType === 'admin_admin') {
        conversationQuery = { type: 'admin_admin', participants: userId };
    }
    else if (requestedType === 'admin_customer' && ADMIN_ROLES.includes(role)) {
        conversationQuery = { type: 'admin_customer' };
    }
    else {
        conversationQuery = ADMIN_ROLES.includes(role) ? {
            $or: [
                { type: 'admin_customer' },
                { type: 'admin_admin', participants: userId }
            ]
        } : { participants: userId };
    }
    const conversations = yield ConversationModel.find(conversationQuery)
        .populate('participants', 'name email role')
        .sort({ lastMessageAt: -1 })
        .limit(50)
        .lean();
    const { MessageModel } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/models/message.model')));
    const unreadCounts = yield MessageModel.aggregate([
        { $match: { conversationId: { $in: conversations.map((conv) => conv._id) }, senderId: { $ne: userId }, isRead: false } },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ]);
    const unreadByConversation = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]));
    const conversationsWithUnread = conversations.map((conv) => (Object.assign(Object.assign({}, conv), { unreadCount: unreadByConversation.get(conv._id.toString()) || 0 })));
    res.json({ success: true, conversations: conversationsWithUnread });
})));
// POST /api/chat/conversations
router.post('/conversations', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    let { participantIds, type, whatsappPhone, orderId } = req.body;
    if (type === 'admin_admin') {
        participantIds = [...new Set([userId, ...(Array.isArray(participantIds) ? participantIds : [])].filter(Boolean))];
        if (participantIds.length < 2) {
            res.status(400).json({ success: false, message: 'A teammate is required' });
            return;
        }
        const { ConversationModel } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/models/conversation.model')));
        const existing = yield ConversationModel.findOne({
            type: 'admin_admin',
            participants: { $all: participantIds, $size: participantIds.length },
        }).populate('participants', 'name email role');
        if (existing) {
            res.json({ success: true, conversation: existing });
            return;
        }
    }
    const conversation = yield ChatRepository_1.chatRepository.createConversation({
        participants: participantIds,
        type,
        whatsappPhone,
        orderId
    });
    res.json({ success: true, conversation });
})));
// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    const messages = yield ChatRepository_1.chatRepository.getMessages(req.params.id);
    // Mark as read
    yield ChatRepository_1.chatRepository.markAsRead(req.params.id, userId);
    res.json({ success: true, messages });
})));
// DELETE /api/chat/conversations/:id
router.delete('/conversations/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield ChatRepository_1.chatRepository.deleteConversation(req.params.id);
    res.json({ success: true });
})));
// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    const role = authReq.role;
    const { text, source } = req.body;
    const message = yield ChatRepository_1.chatRepository.createMessage({
        conversationId: req.params.id,
        senderId: userId,
        senderRole: role,
        text,
        source: source || 'web',
    });
    const conversation = yield ChatRepository_1.chatRepository.findConversationById(req.params.id);
    if (conversation && conversation.whatsappPhone && ADMIN_ROLES.includes(role)) {
        // Send back to WhatsApp using WhatsAppService or directly via Meta API
        try {
            const { default: axios } = yield Promise.resolve().then(() => __importStar(require('axios')));
            const META_API_URL = process.env.META_WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
            const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
            const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
            yield axios.post(`${META_API_URL}/${PHONE_NUMBER_ID}/messages`, {
                messaging_product: 'whatsapp',
                to: conversation.whatsappPhone,
                type: 'text',
                text: { body: text },
            }, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
        }
        catch (err) {
            console.error('Failed to send WhatsApp message back to customer', err === null || err === void 0 ? void 0 : err.message);
        }
    }
    yield ChatRepository_1.chatRepository.updateLastMessage(req.params.id);
    // Publish to redis so websockets broadcast to clients
    yield publishChatMessage(message);
    // Also notify other participants via standard notification so the bell updates
    if (conversation) {
        const { NotificationModel } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/models/notification.model')));
        const otherParticipants = conversation.participants.filter((p) => p.toString() !== userId.toString());
        for (const pId of otherParticipants) {
            const newNotif = yield NotificationModel.create({
                userId: pId,
                title: 'Mesej Baru',
                message: `Mesej baru daripada ${role}`,
                type: 'SYSTEM',
                read: false,
            });
            yield redisService.publish(redis_constant_1.REDIS_CHANNELS.NOTIFICATION, JSON.stringify(newNotif));
        }
    }
    res.json({ success: true, message });
})));
// PATCH /api/chat/messages/:id — edit message text (sender or admin only)
router.patch('/messages/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    const role = authReq.role;
    const { text } = req.body;
    if (!text || !String(text).trim()) {
        res.status(400).json({ success: false, message: 'Message text is required' });
        return;
    }
    const { MessageModel } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/models/message.model')));
    const existing = yield MessageModel.findById(req.params.id);
    if (!existing) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
    }
    const canEdit = ADMIN_ROLES.includes(role) || (((_b = existing.senderId) === null || _b === void 0 ? void 0 : _b.toString()) || '') === userId;
    if (!canEdit) {
        res.status(403).json({ success: false, message: 'You can only edit your own messages' });
        return;
    }
    const message = yield ChatRepository_1.chatRepository.updateMessage(req.params.id, String(text).trim());
    yield publishChatMessage(message);
    res.json({ success: true, message });
})));
// DELETE /api/chat/messages/:id — delete message (sender or admin only)
router.delete('/messages/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authReq = req;
    const userId = authReq.userId || ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id);
    const role = authReq.role;
    const { MessageModel } = yield Promise.resolve().then(() => __importStar(require('../../infrastructure/db/models/message.model')));
    const existing = yield MessageModel.findById(req.params.id);
    if (!existing) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
    }
    const canDelete = ADMIN_ROLES.includes(role) || (((_b = existing.senderId) === null || _b === void 0 ? void 0 : _b.toString()) || '') === userId;
    if (!canDelete) {
        res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        return;
    }
    const message = yield ChatRepository_1.chatRepository.deleteMessage(req.params.id);
    yield publishChatMessage(message);
    res.json({ success: true, message });
})));
exports.default = router;
