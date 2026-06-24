import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import authMiddilware from "../middlewares/auth.middileware";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import User from "../../infrastructure/db/models/user.model";
import asyncHandler from "express-async-handler";

import Order from "../../infrastructure/db/models/order.model";
import { Task } from "../../domain/entities/Task";

const router = Router();
const adminController = new AdminController();

// Quick migration endpoint for the user to trigger in their browser
router.get("/migrate-statuses", asyncHandler(async (req, res) => {
  try {
    const o1 = await Order.updateMany({ orderStatus: "ARTWORK_REVIEW" }, { $set: { orderStatus: "ARTWORK_REVIEWED" } });
    const o2 = await Order.updateMany({ orderStatus: "DONE DESIGN" }, { $set: { orderStatus: "DONE_DESIGN" } });
    
    const t1 = await Task.updateMany({ status: "ARTWORK_REVIEW" }, { $set: { status: "ARTWORK_REVIEWED" } });
    const t2 = await Task.updateMany({ status: "DONE DESIGN" }, { $set: { status: "DONE_DESIGN" } });
    const t3 = await Task.updateMany({ status: "TODO" }, { $set: { status: "PLACED" } });
    const t4 = await Task.updateMany({ status: "ARTWORK_REJECT" }, { $set: { status: "ARTWORK_REJECTED" } });
    
    res.json({
      success: true,
      message: "Database statuses migrated successfully",
      ordersUpdated: o1.modifiedCount + o2.modifiedCount,
      tasksUpdated: t1.modifiedCount + t2.modifiedCount + t3.modifiedCount + t4.modifiedCount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}));

router.get("/users", authMiddilware, adminController.getUsers.bind(adminController));
router.post("/users", authMiddilware, adminController.createUser.bind(adminController));
router.put("/users/:id", authMiddilware, adminController.updateUser.bind(adminController));
router.delete("/users/:id", authMiddilware, adminController.deleteUser.bind(adminController));

router.get("/orders", authMiddilware, adminController.getOrders.bind(adminController));
router.post("/orders/manual", authMiddilware, adminController.createManualOrder.bind(adminController));
router.delete("/orders/:id", authMiddilware, adminController.deleteOrder.bind(adminController));

router.post("/seed-test-data", authMiddilware, adminController.seedTestData.bind(adminController));
router.delete("/clear-test-data", authMiddilware, adminController.clearTestData.bind(adminController));

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
