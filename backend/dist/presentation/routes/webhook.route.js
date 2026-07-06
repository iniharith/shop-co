"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
const webhookController = new webhook_controller_1.WebhookController();
// IMPORTANT: No authMiddleware here! Webhooks must be public to receive EasyParcel requests.
router.post("/easyparcel", webhookController.easyParcelWebhook.bind(webhookController));
exports.default = router;
