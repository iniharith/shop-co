"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middileware_1 = require("../middlewares/auth.middileware");
const router = (0, express_1.Router)();
const orderController = new order_controller_1.OrderController();
router.get("/", auth_middileware_1.authMiddilware, orderController.getOrders.bind(orderController));
router.get("/user/", auth_middileware_1.authMiddilware, orderController.getOrdersByUserId.bind(orderController));
router.post("/", auth_middileware_1.authMiddilware, orderController.createOrder.bind(orderController));
router.get("/previous-address", auth_middileware_1.authMiddilware, orderController.getDistintAddress.bind(orderController));
router.get("/status/:status", auth_middileware_1.authMiddilware, orderController.getOrdersByStatus.bind(orderController));
router.get("/:orderId", auth_middileware_1.authMiddilware, orderController.getOrderById.bind(orderController));
router.put("/:orderId", auth_middileware_1.authMiddilware, orderController.updateOrderStatus.bind(orderController));
router.put("/:orderId/archive", auth_middileware_1.authMiddilware, orderController.archiveOrder.bind(orderController));
router.post("/:orderId/ship", auth_middileware_1.authMiddilware, orderController.createShipment.bind(orderController));
router.get("/:orderId/tracking", auth_middileware_1.authMiddilware, orderController.getTracking.bind(orderController));
exports.default = router;
