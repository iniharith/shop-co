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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const axios_1 = __importDefault(require("axios"));
class WhatsAppService {
    constructor() {
        // Meta WhatsApp Cloud API endpoint and token
        const phoneId = process.env.WA_PHONE_NUMBER_ID || 'dummy_phone_id';
        this.apiUrl = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
        this.token = process.env.WA_ACCESS_TOKEN || 'dummy_token';
    }
    /**
     * Send an automated WhatsApp message to a customer.
     */
    sendMessage(phone, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                yield axios_1.default.post(this.apiUrl, {
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
            }
            catch (error) {
                console.error("WhatsApp API Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                return false;
            }
        });
    }
}
exports.WhatsAppService = WhatsAppService;
exports.default = new WhatsAppService();
