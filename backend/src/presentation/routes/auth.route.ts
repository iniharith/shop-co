import { Router } from "express";
import authController from "../controllers/auth.controller";

const router = Router();

router.post("/login", authController.login.bind(authController));

// Registration is disabled by admin request
// router.post("/register", authController.register.bind(authController));

export default router;

