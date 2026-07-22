import { Request, Response } from "express";
import { OrderUsecase } from "../../application/usecases/orders/order.usecase";
import { statusCodes } from "../../shared/constants/api.constant";
import crypto from "crypto";

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
            const expected = process.env.EASYPARCEL_WEBHOOK_SECRET?.trim() || "";
            const received = typeof req.query.token === "string" ? req.query.token : "";
            const expectedBuffer = Buffer.from(expected);
            const receivedBuffer = Buffer.from(received);
            const validSecret = expectedBuffer.length > 0
                && expectedBuffer.length === receivedBuffer.length
                && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
            if (!validSecret) {
                res.status(statusCodes.UNAUTHORIZED).json({ received: false });
                return;
            }
            const processed = await this.orderUsecase.processEasyParcelWebhook(req.body);
            res.status(statusCodes.OK).json({ received: true, processed });
        } catch (error: any) {
            console.error("EasyParcel webhook processing failed:", error?.message);
            res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ received: false, processed: false });
        }
    }
}
