"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middileware_1 = require("../middlewares/auth.middileware");
const router = (0, express_1.Router)();
const cartController = new cart_controller_1.CartController();
router.post("/add", auth_middileware_1.authMiddilware, cartController.addProductToCart.bind(cartController));
router.delete("/remove", auth_middileware_1.authMiddilware, cartController.removeProductFromCart.bind(cartController));
router.get("/", auth_middileware_1.authMiddilware, cartController.getCart.bind(cartController));
router.delete("/clear", auth_middileware_1.authMiddilware, cartController.clearCart.bind(cartController));
router.put("/update", auth_middileware_1.authMiddilware, cartController.updateCartItem.bind(cartController));
router.get("/total", auth_middileware_1.authMiddilware, cartController.getCartTotal.bind(cartController));
exports.default = router;
