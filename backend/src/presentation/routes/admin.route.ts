import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import authMiddilware from "../middlewares/auth.middileware";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import User from "../../infrastructure/db/models/user.model";
import asyncHandler from "express-async-handler";

const router = Router();
const adminController = new AdminController();


router.get("/users", authMiddilware, adminController.getUsers.bind(adminController));
router.post("/users", authMiddilware, adminController.createUser.bind(adminController));
router.put("/users/:id", authMiddilware, adminController.updateUser.bind(adminController));
router.delete("/users/:id", authMiddilware, adminController.deleteUser.bind(adminController));

router.get("/delivery-boys", authMiddilware, adminController.getDeliveryBoys.bind(adminController));

router.put("/delivery-boys/:id", authMiddilware, adminController.updateDeliveryBoy.bind(adminController));

router.get("/orders", authMiddilware, adminController.getOrders.bind(adminController));
router.post("/orders/manual", authMiddilware, adminController.createManualOrder.bind(adminController));

router.get("/orders/delivery-boy/:id", authMiddilware, adminController.getOrdersByDeliveryBoy.bind(adminController));

router.post("/seed-test-data", authMiddilware, adminController.seedTestData.bind(adminController));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
  api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});

const adminStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: Express.Multer.File) => ({
    folder: 'kampungcetak/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
} as any);

const adminUpload = multer({ storage: adminStorage });

router.post("/users/:id/avatar", authMiddilware, adminUpload.single('avatar'), asyncHandler(async (req: any, res: any) => {
    const userId = req.params.id;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const avatarUrl = req.file.path;
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
}));

export default router;
