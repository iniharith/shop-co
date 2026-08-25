/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { chatRepository } from '../../infrastructure/repositories/ChatRepository';
import authMiddilware from '../middlewares/auth.middileware';
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_CHANNELS } from '../../shared/constants/redis.constant';

const router = Router();
const redisService = new RedisService();

const publishChatMessage = async (message: any) => {
  await redisService.publish(REDIS_CHANNELS.CHAT_MESSAGE, JSON.stringify(message));
};

const ADMIN_ROLES = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'];

// GET /api/chat/conversations
router.get(
  '/conversations',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    
    // For admins, we might want to return ALL conversations, or just theirs + customer ones.
    // For simplicity, let's just return conversations they are part of, or all if admin?
    const role = authReq.role;
    const requestedType = req.query.type;
    const { ConversationModel } = await import('../../infrastructure/db/models/conversation.model');
    let conversationQuery: any;
    if (requestedType === 'admin_admin') {
      conversationQuery = { type: 'admin_admin', participants: userId };
    } else if (requestedType === 'admin_customer' && ADMIN_ROLES.includes(role)) {
      conversationQuery = { type: 'admin_customer' };
    } else {
      conversationQuery = ADMIN_ROLES.includes(role) ? {
        $or: [
          { type: 'admin_customer' },
          { type: 'admin_admin', participants: userId }
        ]
      } : { participants: userId };
    }
    const conversations = await ConversationModel.find(conversationQuery)
      .populate('participants', 'name email role')
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();
    const { MessageModel } = await import('../../infrastructure/db/models/message.model');
    const unreadCounts = await MessageModel.aggregate([
      { $match: { conversationId: { $in: conversations.map((conv: any) => conv._id) }, senderId: { $ne: userId }, isRead: false } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ]);
    const unreadByConversation = new Map(unreadCounts.map((item: any) => [item._id.toString(), item.count]));
    const conversationsWithUnread = conversations.map((conv: any) => ({
      ...conv,
      unreadCount: unreadByConversation.get(conv._id.toString()) || 0,
    }));
    
    res.json({ success: true, conversations: conversationsWithUnread });
  })
);

// POST /api/chat/conversations
router.post(
  '/conversations',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    let { participantIds, type, whatsappPhone, orderId } = req.body;
    if (type === 'admin_admin') {
      participantIds = [...new Set([userId, ...(Array.isArray(participantIds) ? participantIds : [])].filter(Boolean))];
      if (participantIds.length < 2) {
        res.status(400).json({ success: false, message: 'A teammate is required' });
        return;
      }
      const { ConversationModel } = await import('../../infrastructure/db/models/conversation.model');
      const existing = await ConversationModel.findOne({
        type: 'admin_admin',
        participants: { $all: participantIds, $size: participantIds.length },
      }).populate('participants', 'name email role');
      if (existing) {
        res.json({ success: true, conversation: existing });
        return;
      }
    }
    const conversation = await chatRepository.createConversation({
      participants: participantIds,
      type,
      whatsappPhone,
      orderId
    });
    res.json({ success: true, conversation });
  })
);

// GET /api/chat/conversations/:id/messages
router.get(
  '/conversations/:id/messages',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    
    const messages = await chatRepository.getMessages(req.params.id);
    // Mark as read
    await chatRepository.markAsRead(req.params.id, userId);
    
    res.json({ success: true, messages });
  })
);

// DELETE /api/chat/conversations/:id
router.delete(
  '/conversations/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    await chatRepository.deleteConversation(req.params.id);
    res.json({ success: true });
  })
);

// POST /api/chat/conversations/:id/messages
router.post(
  '/conversations/:id/messages',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    const role = authReq.role;
    const { text, source } = req.body;
    
    const message = await chatRepository.createMessage({
      conversationId: req.params.id,
      senderId: userId,
      senderRole: role,
      text,
      source: source || 'web',
    });
    
    const conversation = await chatRepository.findConversationById(req.params.id);
    if (conversation && conversation.whatsappPhone && ADMIN_ROLES.includes(role)) {
      // Send back to WhatsApp using WhatsAppService or directly via Meta API
      try {
        const { default: axios } = await import('axios');
        const META_API_URL = process.env.META_WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
        const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
        const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN || '';

        await axios.post(
          `${META_API_URL}/${PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: conversation.whatsappPhone,
            type: 'text',
            text: { body: text },
          },
          { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
        );
      } catch (err: any) {
        console.error('Failed to send WhatsApp message back to customer', err?.message);
      }
    }
    
    await chatRepository.updateLastMessage(req.params.id);
    
    // Publish to redis so websockets broadcast to clients
    await publishChatMessage(message);
    
    // Also notify other participants via standard notification so the bell updates
    if (conversation) {
      const { NotificationModel } = await import('../../infrastructure/db/models/notification.model');
      const otherParticipants = conversation.participants.filter(
        (p: any) => p.toString() !== userId.toString()
      );
      
      for (const pId of otherParticipants) {
        const newNotif = await NotificationModel.create({
          userId: pId,
          title: 'Mesej Baru',
          message: `Mesej baru daripada ${role}`,
          type: 'SYSTEM',
          read: false,
        });
        await redisService.publish(REDIS_CHANNELS.NOTIFICATION, JSON.stringify(newNotif));
      }
    }
    
    res.json({ success: true, message });
  })
);

// PATCH /api/chat/messages/:id — edit message text (sender or admin only)
router.patch(
  '/messages/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    const role = authReq.role;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      res.status(400).json({ success: false, message: 'Message text is required' });
      return;
    }

    const { MessageModel } = await import('../../infrastructure/db/models/message.model');
    const existing = await MessageModel.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    const canEdit = ADMIN_ROLES.includes(role) || (existing.senderId?.toString() || '') === userId;
    if (!canEdit) {
      res.status(403).json({ success: false, message: 'You can only edit your own messages' });
      return;
    }

    const message = await chatRepository.updateMessage(req.params.id, String(text).trim());
    await publishChatMessage(message);
    res.json({ success: true, message });
  })
);

// DELETE /api/chat/messages/:id — delete message (sender or admin only)
router.delete(
  '/messages/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    const role = authReq.role;

    const { MessageModel } = await import('../../infrastructure/db/models/message.model');
    const existing = await MessageModel.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    const canDelete = ADMIN_ROLES.includes(role) || (existing.senderId?.toString() || '') === userId;
    if (!canDelete) {
      res.status(403).json({ success: false, message: 'You can only delete your own messages' });
      return;
    }

    const message = await chatRepository.deleteMessage(req.params.id);
    await publishChatMessage(message);
    res.json({ success: true, message });
  })
);

export default router;
