import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { chatRepository } from '../../infrastructure/repositories/ChatRepository';
import authMiddilware from '../middlewares/auth.middileware';
import { RedisService } from '../../infrastructure/redis/redis';

const router = Router();
const redisService = new RedisService();

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
    let conversations;
    
    if (['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(role)) {
      // Admins see all conversations for now
      conversations = await chatRepository.findConversationsByUser(userId); // Or fetch all if needed
      // Actually, fetching all conversations is better for an admin dashboard
      const { ConversationModel } = await import('../../infrastructure/db/models/conversation.model');
      conversations = await ConversationModel.find()
        .populate('participants', 'name email role')
        .sort({ lastMessageAt: -1 });
    } else {
      conversations = await chatRepository.findConversationsByUser(userId);
    }
    const { MessageModel } = await import('../../infrastructure/db/models/message.model');
    
    // Add unread count to each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv: any) => {
        const unreadCount = await MessageModel.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          isRead: false
        });
        return { ...conv.toObject(), unreadCount };
      })
    );
    
    res.json({ success: true, conversations: conversationsWithUnread });
  })
);

// POST /api/chat/conversations
router.post(
  '/conversations',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const { participantIds, type, whatsappPhone, orderId } = req.body;
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
    if (conversation && conversation.whatsappPhone && ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(role)) {
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
    const { REDIS_CHANNELS } = await import('../../shared/constants/redis.constant');
    await redisService.publish(REDIS_CHANNELS.CHAT_MESSAGE, JSON.stringify(message));
    
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

export default router;
