import { Router } from "express";
import userController from "../controllers/user.controller";
import authMiddleware from "../middlewares/auth.middileware";

const router = Router();

// Get the user's profile
router.get("/profile", authMiddleware, userController.getProfile);

// Update the user's profile
router.put("/profile", authMiddleware, userController.updateProfile);

export default router;
