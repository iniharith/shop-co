/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router } from "express";
import userController from "../controllers/user.controller";
import authMiddleware from "../middlewares/auth.middileware";
import User from '../../infrastructure/db/models/user.model';
import asyncHandler from 'express-async-handler';
import { uploadAvatar } from '../middlewares/uploadAvatar.middleware';

const router = Router();

// Get staff users
router.get("/staff", authMiddleware, userController.getStaff);

// Get the user's profile
router.get("/profile", authMiddleware, userController.getProfile);

// Update the user's profile
router.put("/profile", authMiddleware, userController.updateProfile);

router.post("/profile/avatar", authMiddleware, uploadAvatar.single('avatar'), asyncHandler(async (req: any, res: any) => {
    const userId = req.userId || req.user?.id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const avatarUrl = (req.file as any).location || req.file.path;
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
}));


router.put("/push-token", authMiddleware, asyncHandler(async (req: any, res: any) => {
    const userId = req.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token is required" });
    await User.findByIdAndUpdate(userId, { expoPushToken: token });
    res.json({ success: true, message: "Token updated" });
}));

export default router;
