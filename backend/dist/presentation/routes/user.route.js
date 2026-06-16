"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
// Get the user's profile
router.get("/profile", auth_middileware_1.default, user_controller_1.default.getProfile);
// Update the user's profile
router.put("/profile", auth_middileware_1.default, user_controller_1.default.updateProfile);
exports.default = router;
