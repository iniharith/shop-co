import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import authMiddilware from "../middlewares/auth.middileware";

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

export default router;
