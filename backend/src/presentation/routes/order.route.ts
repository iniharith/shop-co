import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authMiddilware } from "../middlewares/auth.middileware";
const router = Router();
const orderController = new OrderController();

router.get("/", authMiddilware, orderController.getOrders.bind(orderController));

router.get("/user/", authMiddilware, orderController.getOrdersByUserId.bind(orderController));


router.post("/", authMiddilware, orderController.createOrder.bind(orderController));


router.get("/previous-address", authMiddilware, orderController.getDistintAddress.bind(orderController));


router.get("/status/:status", authMiddilware, orderController.getOrdersByStatus.bind(orderController));



router.get("/:orderId", authMiddilware, orderController.getOrderById.bind(orderController));


router.put("/:orderId", authMiddilware, orderController.updateOrderStatus.bind(orderController));

router.patch("/:orderId/archive", authMiddilware, orderController.archiveOrder.bind(orderController));

export default router;

