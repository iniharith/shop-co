"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const user_model_1 = __importDefault(require("../../infrastructure/db/models/user.model"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const uploadAvatar_middleware_1 = require("../middlewares/uploadAvatar.middleware");
const router = (0, express_1.Router)();
// Get staff users
router.get("/staff", auth_middileware_1.default, user_controller_1.default.getStaff);
// Get the user's profile
router.get("/profile", auth_middileware_1.default, user_controller_1.default.getProfile);
// Update the user's profile
router.put("/profile", auth_middileware_1.default, user_controller_1.default.updateProfile);
router.post("/profile/avatar", auth_middileware_1.default, uploadAvatar_middleware_1.uploadAvatar.single('avatar'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const avatarUrl = req.file.location || req.file.path;
    yield user_model_1.default.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
})));
router.put("/push-token", auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    if (!userId)
        return res.status(401).json({ success: false, message: "Unauthorized" });
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ success: false, message: "Token is required" });
    yield user_model_1.default.findByIdAndUpdate(userId, { expoPushToken: token });
    res.json({ success: true, message: "Token updated" });
})));
exports.default = router;
