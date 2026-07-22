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
exports.WebhookController = void 0;
const order_usecase_1 = require("../../application/usecases/orders/order.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
const crypto_1 = __importDefault(require("crypto"));
class WebhookController {
    constructor() {
        this.orderUsecase = new order_usecase_1.OrderUsecase();
    }
    /**
     * @description Handle EasyParcel Webhooks
     * @Method POST
     * @Access PUBLIC
     * @Route /api/webhooks/easyparcel
     */
    easyParcelWebhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const expected = ((_a = process.env.EASYPARCEL_WEBHOOK_SECRET) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                const received = typeof req.query.token === "string" ? req.query.token : "";
                const expectedBuffer = Buffer.from(expected);
                const receivedBuffer = Buffer.from(received);
                const validSecret = expectedBuffer.length > 0
                    && expectedBuffer.length === receivedBuffer.length
                    && crypto_1.default.timingSafeEqual(expectedBuffer, receivedBuffer);
                if (!validSecret) {
                    res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ received: false });
                    return;
                }
                const processed = yield this.orderUsecase.processEasyParcelWebhook(req.body);
                res.status(api_constant_1.statusCodes.OK).json({ received: true, processed });
            }
            catch (error) {
                console.error("EasyParcel webhook processing failed:", error === null || error === void 0 ? void 0 : error.message);
                res.status(api_constant_1.statusCodes.INTERNAL_SERVER_ERROR).json({ received: false, processed: false });
            }
        });
    }
}
exports.WebhookController = WebhookController;
