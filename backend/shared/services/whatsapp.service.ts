import axios from 'axios';

/**
 * WhatsApp Business Cloud API Service (Meta Official)
 * Uses pre-approved message templates for parcel status updates
 * Template must be created in WhatsApp Manager as a "Utility" category template
 *
 * Template example: parcel_status_update
 * Body: "Hi {{1}}, your parcel {{2}} is now {{3}}. Track here: {{4}}"
 */
export class WhatsAppService {
  private readonly phoneId: string;
  private readonly token: string;
  private readonly templateName: string;
  private readonly apiUrl: string;

  constructor() {
    this.phoneId = process.env.WHATSAPP_PHONE_ID || '';
    this.token = process.env.WHATSAPP_TOKEN || '';
    this.templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'parcel_status_update';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneId}/messages`;
  }

  /**
   * Format phone number to international format (Malaysia default +60)
   */
  private formatPhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // If starts with 0, replace with Malaysia country code 60
    if (digits.startsWith('0')) {
      return '60' + digits.slice(1);
    }

    // If starts with 60, keep as is
    if (digits.startsWith('60')) {
      return digits;
    }

    // If number looks short (local), prepend 60
    if (digits.length <= 10) {
      return '60' + digits;
    }

    return digits;
  }

  /**
   * Send parcel status update notification to customer via WhatsApp
   * @param phone Customer phone number
   * @param customerName Customer name (for personalisation)
   * @param awbNo Air Waybill number
   * @param status Current parcel status
   * @param trackingUrl Direct tracking URL
   */
  async sendParcelStatusUpdate(
    phone: string,
    customerName: string,
    awbNo: string,
    status: string,
    trackingUrl: string
  ): Promise<boolean> {
    if (!this.phoneId || !this.token) {
      console.warn('[WhatsApp] Missing credentials - WHATSAPP_PHONE_ID or WHATSAPP_TOKEN not set');
      return false;
    }

    const formattedPhone = this.formatPhone(phone);

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: this.templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: awbNo },
              { type: 'text', text: status },
              { type: 'text', text: trackingUrl || 'https://studioivory.art' },
            ],
          },
        ],
      },
    };

    try {
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log(
        `[WhatsApp] ✅ Message sent to ${formattedPhone} | Status: ${status} | AWB: ${awbNo}`,
        response.data
      );
      return true;
    } catch (error: any) {
      console.error(
        `[WhatsApp] ❌ Failed to send to ${formattedPhone}:`,
        error.response?.data || error.message
      );
      return false;
    }
  }
}

export default WhatsAppService;
