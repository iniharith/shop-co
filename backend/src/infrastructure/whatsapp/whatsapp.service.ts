import axios from "axios";

export class WhatsAppService {
    /**
     * Send an automated WhatsApp message to a customer.
     * Note: You need to configure this with your actual WhatsApp API provider (e.g. Meta Cloud API, Twilio, UltraMsg, Wati, etc).
     */
    async sendMessage(phone: string, message: string): Promise<boolean> {
        try {
            // Format phone number to international format (e.g., remove leading 0 and add country code if needed)
            // Example for Malaysia: 0123456789 -> 60123456789
            let formattedPhone = phone.replace(/[^0-9]/g, "");
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "60" + formattedPhone.substring(1);
            }

            console.log(`[WHATSAPP MOCK] Sending message to ${formattedPhone}: \n${message}`);

            /*
            // --- EXAMPLE INTEGRATION (Meta WhatsApp Cloud API) ---
            const apiUrl = `https://graph.facebook.com/v17.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
            const token = process.env.WA_ACCESS_TOKEN;
            
            await axios.post(apiUrl, {
                messaging_product: "whatsapp",
                to: formattedPhone,
                type: "text",
                text: { body: message }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            */

            return true;
        } catch (error) {
            console.error("WhatsApp API Error:", error);
            return false;
        }
    }
}

export default new WhatsAppService();
