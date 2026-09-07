"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const review_controller_1 = __importDefault(require("../controllers/review.controller"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
router.post('/', auth_middileware_1.default, (0, express_async_handler_1.default)(review_controller_1.default.submitReview.bind(review_controller_1.default)));
router.get('/order/:orderId', auth_middileware_1.default, (0, express_async_handler_1.default)(review_controller_1.default.getOrderReview.bind(review_controller_1.default)));
router.get('/product/:productId', (0, express_async_handler_1.default)(review_controller_1.default.getProductReviews.bind(review_controller_1.default)));
exports.default = router;
