/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router } from "express";
import authController from "../controllers/auth.controller";

const router = Router();

router.post("/login", authController.login.bind(authController));

router.post("/register", authController.register.bind(authController));

router.post("/refresh", authController.refresh.bind(authController));

export default router;

