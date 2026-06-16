"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
router.get("/users", auth_middileware_1.default, adminController.getUsers.bind(adminController));
router.delete("/users/:id", auth_middileware_1.default, adminController.deleteUser.bind(adminController));
router.get("/delivery-boys", auth_middileware_1.default, adminController.getDeliveryBoys.bind(adminController));
router.put("/delivery-boys/:id", auth_middileware_1.default, adminController.updateDeliveryBoy.bind(adminController));
router.get("/orders", auth_middileware_1.default, adminController.getOrders.bind(adminController));
router.get("/orders/delivery-boy/:id", auth_middileware_1.default, adminController.getOrdersByDeliveryBoy.bind(adminController));
router.post("/seed-test-data", auth_middileware_1.default, adminController.seedTestData.bind(adminController));
exports.default = router;
