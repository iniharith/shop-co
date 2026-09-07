"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const wishlist_controller_1 = __importDefault(require("../controllers/wishlist.controller"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
router.post('/:productId', auth_middileware_1.default, (0, express_async_handler_1.default)(wishlist_controller_1.default.addToWishlist.bind(wishlist_controller_1.default)));
router.delete('/:productId', auth_middileware_1.default, (0, express_async_handler_1.default)(wishlist_controller_1.default.removeFromWishlist.bind(wishlist_controller_1.default)));
router.get('/', auth_middileware_1.default, (0, express_async_handler_1.default)(wishlist_controller_1.default.getWishlist.bind(wishlist_controller_1.default)));
router.get('/check/:productId', auth_middileware_1.default, (0, express_async_handler_1.default)(wishlist_controller_1.default.checkWishlist.bind(wishlist_controller_1.default)));
exports.default = router;
