import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

const router = Router();
const webhookController = new WebhookController();

// IMPORTANT: No authMiddleware here! Webhooks must be public to receive EasyParcel requests.
router.post("/easyparcel", webhookController.easyParcelWebhook.bind(webhookController));

export default router;
