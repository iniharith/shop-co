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
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const user_model_1 = __importDefault(require("../../infrastructure/db/models/user.model"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
router.get("/users", auth_middileware_1.default, adminController.getUsers.bind(adminController));
router.post("/users", auth_middileware_1.default, adminController.createUser.bind(adminController));
router.put("/users/:id", auth_middileware_1.default, adminController.updateUser.bind(adminController));
router.delete("/users/:id", auth_middileware_1.default, adminController.deleteUser.bind(adminController));
router.get("/orders", auth_middileware_1.default, adminController.getOrders.bind(adminController));
router.post("/orders/manual", auth_middileware_1.default, adminController.createManualOrder.bind(adminController));
router.post("/seed-test-data", auth_middileware_1.default, adminController.seedTestData.bind(adminController));
router.delete("/clear-test-data", auth_middileware_1.default, adminController.clearTestData.bind(adminController));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
    api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});
const adminStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            folder: 'kampungcetak/avatars',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        });
    }),
});
const adminUpload = (0, multer_1.default)({ storage: adminStorage });
router.post("/users/:id/avatar", auth_middileware_1.default, adminUpload.single('avatar'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const avatarUrl = req.file.path;
    yield user_model_1.default.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
})));
exports.default = router;
