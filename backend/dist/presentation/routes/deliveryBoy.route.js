"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deliveryBoy_controller_1 = require("../controllers/deliveryBoy.controller");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
const deliveryBoyController = new deliveryBoy_controller_1.DeliveryBoyController();
router.post("/login", deliveryBoyController.login.bind(deliveryBoyController));
router.post("/register", deliveryBoyController.register.bind(deliveryBoyController));
router.post("/orders/:id", auth_middileware_1.default, deliveryBoyController.addDeliveryBoyToOrder.bind(deliveryBoyController));
router.get("/orders", auth_middileware_1.default, deliveryBoyController.getOrders.bind(deliveryBoyController));
router.put("/orders/:id", auth_middileware_1.default, deliveryBoyController.updateOrderStatus.bind(deliveryBoyController));
exports.default = router;
