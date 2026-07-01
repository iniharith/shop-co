/**
 * Coded by Harith
 * Kampungcetak ®
 */
import axios from 'axios';

const META_API_URL = process.env.META_WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN || '';

type ParcelStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed';

const STATUS_EMOJI: Record<ParcelStatus, string> = {
  pending: '⏳',
  picked_up: '📦',
  in_transit: '🚚',
  out_for_delivery: '🛵',
  delivered: '✅',
  failed: '❌',
};

const STATUS_LABEL_MY: Record<ParcelStatus, string> = {
  pending: 'Menunggu Kutipan',
  picked_up: 'Telah Dikutip',
  in_transit: 'Dalam Perjalanan',
  out_for_delivery: 'Dalam Penghantaran',
  delivered: 'Telah Dihantar',
  failed: 'Penghantaran Gagal',
};

const STATUS_BODY_MY: Record<ParcelStatus, string> = {
  pending: 'Pesanan anda sedang menunggu untuk dikutip oleh kurier kami.',
  picked_up: 'Pesanan anda telah berjaya dikutip oleh kurier dan sedang dalam proses.',
  in_transit: 'Pesanan anda kini sedang dalam perjalanan menuju destinasi anda.',
  out_for_delivery: 'Kurier sedang dalam perjalanan ke alamat anda sekarang! Sila pastikan seseorang ada di rumah.',
  delivered: 'Pesanan anda telah berjaya dihantar. Terima kasih kerana berbelanja di Kampung Cetak! 🙏',
  failed:
    'Maaf, kurier tidak dapat menghantar parcel ke alamat anda. Sila hubungi kami di WhatsApp atau emel untuk bantuan.',
};

class WhatsAppService {
  /**
   * Send parcel status update notification to customer
   * Uses Meta WhatsApp Business Cloud API
   */
  async sendStatusUpdate(params: {
    phone: string;
    customerName: string;
    trackingNumber: string;
    status: ParcelStatus;
    courier: string;
  }): Promise<boolean> {
    const { phone, customerName, trackingNumber, status, courier } = params;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.warn('[WhatsApp] META_WHATSAPP_PHONE_NUMBER_ID or META_WHATSAPP_ACCESS_TOKEN not set');
      return false;
    }

    try {
      const normalizedPhone = this.normalizePhone(phone);
      const emoji = STATUS_EMOJI[status] || '📦';
      const label = STATUS_LABEL_MY[status] || status;
      const body = STATUS_BODY_MY[status] || '';

      const messageText = [
        `🖨️ *Kampung Cetak — Kemas Kini Penghantaran*`,
        ``,
        `Hai *${customerName}*! 👋`,
        ``,
        `${emoji} *${label}*`,
        body,
        ``,
        `📋 *No. Penjejakan:* \`${trackingNumber}\``,
        `🚀 *Kurier:* ${courier}`,
        ``,
        `Jejak parcel anda secara langsung:`,
        `👉 https://kampungcetak.com/dashboard/track?tracking=${trackingNumber}`,
        ``,
        `Ada soalan? Balas mesej ini atau hubungi kami.`,
        `_— Pasukan Kampung Cetak_ 🙏`,
      ].join('\n');

      const response = await axios.post(
        `${META_API_URL}/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log(
        `[WhatsApp] ✅ Sent status update to ${normalizedPhone} | Status: ${status} | Response: ${response.status}`
      );
      return response.status === 200;
    } catch (error: any) {
      const errData = error?.response?.data || error?.message;
      console.error(`[WhatsApp] ❌ sendStatusUpdate failed:`, errData);
      return false;
    }
  }

  /**
   * Notify customer that their file upload was received and is being reviewed
   */
  async sendFileUploadConfirmation(params: {
    phone: string;
    customerName: string;
    orderId?: string;
    fileCount: number;
  }): Promise<boolean> {
    const { phone, customerName, orderId, fileCount } = params;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return false;

    try {
      const normalizedPhone = this.normalizePhone(phone);
      const messageText = [
        `🖨️ *Kampung Cetak — Fail Diterima*`,
        ``,
        `Hai *${customerName}*! 👋`,
        ``,
        `✅ Kami telah menerima *${fileCount} fail* daripada anda.`,
        orderId ? `📋 *No. Pesanan:* ${orderId}` : '',
        ``,
        `Tim kami akan menyemak fail anda tidak lama lagi. Kami akan menghubungi anda sekiranya ada sebarang pertanyaan.`,
        ``,
        `Terima kasih kerana mempercayai Kampung Cetak! 🙏`,
        ``,
        `_— Pasukan Kampung Cetak_`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await axios.post(
        `${META_API_URL}/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: { preview_url: false, body: messageText },
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error: any) {
      console.error('[WhatsApp] sendFileUploadConfirmation failed:', error?.message);
      return false;
    }
  }

  /**
   * Send a free-form custom message to any phone number
   */
  async sendCustomMessage(phone: string, message: string): Promise<boolean> {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return false;

    try {
      const normalizedPhone = this.normalizePhone(phone);
      const response = await axios.post(
        `${META_API_URL}/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      return response.status === 200;
    } catch (error: any) {
      console.error('[WhatsApp] sendCustomMessage failed:', error?.message);
      return false;
    }
  }

  /**
   * Normalize Malaysian phone numbers to E.164 international format
   * e.g. 0123456789 → 60123456789, +60123456789 → 60123456789
   */
  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '60' + cleaned.slice(1);
    } else if (!cleaned.startsWith('60')) {
      cleaned = '60' + cleaned;
    }
    return cleaned;
  }
}

export const whatsAppService = new WhatsAppService();
