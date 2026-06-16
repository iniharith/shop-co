import { Router, Request, Response } from 'express';
import { parcelRepository } from '../../infrastructure/repositories/ParcelRepository';
import { whatsAppService } from '../services/WhatsAppService';

const router = Router();

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'kampungcetak_webhook_secret';

// ─── GET /api/webhooks/whatsapp ───────────────────────────────────────────────
// Meta calls this once to VERIFY your webhook URL is real.
// It sends hub.challenge — we must echo it back to pass verification.
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[Webhook] Verification request received:', { mode, token });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] ✅ Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook] ❌ Verification failed — token mismatch');
    res.status(403).json({ error: 'Verification failed' });
  }
});

// ─── POST /api/webhooks/whatsapp ──────────────────────────────────────────────
// Meta sends delivery status updates and incoming messages here.
router.post('/', async (req: Request, res: Response) => {
  // Always respond 200 immediately — Meta will retry if you don't
  res.status(200).json({ status: 'received' });

  try {
    const body = req.body;

    // Validate this is a WhatsApp Business event
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // ── Message Status Updates (sent / delivered / read / failed) ──
        if (value?.statuses) {
          for (const status of value.statuses) {
            console.log(`[Webhook] Message status: ${status.status} for ${status.recipient_id}`);

            // If a message failed to send, log it for debugging
            if (status.status === 'failed') {
              console.error('[Webhook] Message failed:', JSON.stringify(status.errors));
            }
          }
        }

        // ── Incoming Messages from Customers ──
        if (value?.messages) {
          for (const message of value.messages) {
            const from = message.from; // Customer's phone number
            const type = message.type;
            const messageId = message.id;

            console.log(`[Webhook] Incoming ${type} message from ${from}`);

            // Auto-reply: if customer sends a tracking number keyword
            if (type === 'text') {
              const text = (message.text?.body || '').trim().toLowerCase();

              // Handle "track XXXXX" command
              if (text.startsWith('track ') || text.startsWith('jejak ')) {
                const trackingNumber = text.split(' ').slice(1).join(' ').toUpperCase();

                if (trackingNumber) {
                  const parcel = await parcelRepository.findByTrackingNumber(trackingNumber);

                  if (parcel) {
                    await whatsAppService.sendStatusUpdate({
                      phone: from,
                      customerName: parcel.customerName || 'Pelanggan',
                      trackingNumber: parcel.trackingNumber,
                      status: parcel.status as any,
                      courier: parcel.courier,
                    });
                  } else {
                    // Send not-found reply directly via Meta API
                    const { default: axiosLib } = await import('axios');
                    await axiosLib.post(
                      `${process.env.META_WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0'}/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
                      {
                        messaging_product: 'whatsapp',
                        to: from,
                        type: 'text',
                        text: { body: `❌ Nombor penjejakan *${trackingNumber}* tidak dijumpai.\n\nSila semak nombor dan cuba lagi, atau hubungi kami di https://kampungcetak.com` },
                      },
                      { headers: { Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}` } }
                    );
                  }
                }
              }
            }

            // Mark message as read
            try {
              const { default: axios } = await import('axios');
              const META_API_URL = process.env.META_WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
              const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
              const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN || '';

              await axios.post(
                `${META_API_URL}/${PHONE_NUMBER_ID}/messages`,
                { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
                { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
              );
            } catch (_) {
              // Non-critical — ignore read receipt errors
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[Webhook] Processing error:', error?.message);
  }
});

export default router;
