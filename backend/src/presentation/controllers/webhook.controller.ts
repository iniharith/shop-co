import { Request, Response } from "express";
import { OrderUsecase } from "../../application/usecases/orders/order.usecase";
import { statusCodes } from "../../shared/constants/api.constant";

export class WebhookController {
    private readonly orderUsecase: OrderUsecase;
    
    constructor() {
        this.orderUsecase = new OrderUsecase();
    }

    /**
     * @description Handle EasyParcel Webhooks
     * @Method POST
     * @Access PUBLIC
     * @Route /api/webhooks/easyparcel
     */
    async easyParcelWebhook(req: Request, res: Response) {
        try {
            console.log("Received EasyParcel Webhook:", req.body);
            // Quick ack to EasyParcel so they don't timeout
            res.status(statusCodes.OK).json({ status: "Received" });

            // Process asynchronously
            this.orderUsecase.processEasyParcelWebhook(req.body);
        } catch (error) {
            console.error("EasyParcel Webhook Error:", error);
            // Already responded, so we just log
        }
    }
}
