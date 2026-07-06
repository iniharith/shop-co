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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const order_usecase_1 = require("../../application/usecases/orders/order.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
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
            try {
                console.log("Received EasyParcel Webhook:", req.body);
                // Quick ack to EasyParcel so they don't timeout
                res.status(api_constant_1.statusCodes.OK).json({ status: "Received" });
                // Process asynchronously
                this.orderUsecase.processEasyParcelWebhook(req.body);
            }
            catch (error) {
                console.error("EasyParcel Webhook Error:", error);
                // Already responded, so we just log
            }
        });
    }
}
exports.WebhookController = WebhookController;
