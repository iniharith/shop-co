import { Router } from "express";
import userController from "../controllers/user.controller";
import authMiddleware from "../middlewares/auth.middileware";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import User from "../../infrastructure/db/models/user.model";
import asyncHandler from "express-async-handler";

const router = Router();

// Get staff users
router.get("/staff", authMiddleware, userController.getStaff);

// Get the user's profile
router.get("/profile", authMiddleware, userController.getProfile);

// Update the user's profile
router.put("/profile", authMiddleware, userController.updateProfile);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
  api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: Express.Multer.File) => ({
    folder: 'kampungcetak/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
} as any);

const upload = multer({ storage });

router.post("/profile/avatar", authMiddleware, upload.single('avatar'), asyncHandler(async (req: any, res: any) => {
    const userId = req.userId || req.user?.id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const avatarUrl = req.file.path;
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
}));

export default router;
