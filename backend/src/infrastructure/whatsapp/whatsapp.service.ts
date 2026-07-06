/**
 * Coded by Harith
 * Kampungcetak ®
 */
import axios from "axios";

export class WhatsAppService {
    private readonly apiUrl: string;
    private readonly token: string;

    constructor() {
        // Meta WhatsApp Cloud API endpoint and token
        const phoneId = process.env.WA_PHONE_NUMBER_ID || 'dummy_phone_id';
        this.apiUrl = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
        this.token = process.env.WA_ACCESS_TOKEN || 'dummy_token';
    }

    /**
     * Send an automated WhatsApp message to a customer.
     */
    async sendMessage(phone: string, message: string): Promise<boolean> {
        try {
            // Format phone number to international format (e.g., remove leading 0 and add country code if needed)
            let formattedPhone = phone.replace(/[^0-9]/g, "");
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "60" + formattedPhone.substring(1); // Defaulting to Malaysia
            }

            console.log(`[WHATSAPP] Sending message to ${formattedPhone}: \n${message}`);

            if (this.token === 'dummy_token' || process.env.NODE_ENV === 'test') {
                console.log("[WHATSAPP] Running in mock/sandbox mode. Message not sent via API.");
                return true;
            }
            
            await axios.post(this.apiUrl, {
                messaging_product: "whatsapp",
                to: formattedPhone,
                type: "text",
                text: { body: message }
            }, {
                headers: { 
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                }
            });

            return true;
        } catch (error: any) {
            console.error("WhatsApp API Error:", error.response?.data || error.message);
            return false;
        }
    }
}

export default new WhatsAppService();
