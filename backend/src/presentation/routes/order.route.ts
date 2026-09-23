/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authMiddilware, authorizeRoles } from "../middlewares/auth.middileware";
import { requireOrderOwnerOrStaff } from "../middlewares/orderAccess.middleware";
const router = Router();
const orderController = new OrderController();

const orderStaffRoles = authorizeRoles('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging');
router.get("/", authMiddilware, orderStaffRoles, orderController.getOrders.bind(orderController));

router.get("/user/", authMiddilware, orderController.getOrdersByUserId.bind(orderController));


router.post("/", authMiddilware, orderController.createOrder.bind(orderController));


router.get("/previous-address", authMiddilware, orderController.getDistintAddress.bind(orderController));

router.post("/shipping/quote", authMiddilware, orderController.getPublicShippingQuotations.bind(orderController));


router.get("/status/:status", authMiddilware, orderStaffRoles, orderController.getOrdersByStatus.bind(orderController));



router.get("/:orderId", authMiddilware, requireOrderOwnerOrStaff, orderController.getOrderById.bind(orderController));


router.put("/:orderId", authMiddilware, orderStaffRoles, orderController.updateOrderStatus.bind(orderController));

router.put("/:orderId/archive", authMiddilware, orderStaffRoles, orderController.archiveOrder.bind(orderController));

const shippingRoles = authorizeRoles('admin', 'sysadmin', 'boss', 'production', 'packaging');
router.post("/:orderId/shipping/quotations", authMiddilware, shippingRoles, orderController.getShippingQuotations.bind(orderController));
router.post("/:orderId/ship", authMiddilware, shippingRoles, orderController.createShipment.bind(orderController));
router.post("/:orderId/shipping/refresh", authMiddilware, shippingRoles, orderController.refreshShipping.bind(orderController));
router.post("/:orderId/shipping/reconcile", authMiddilware, shippingRoles, orderController.reconcileShipping.bind(orderController));
router.get("/:orderId/tracking", authMiddilware, orderController.getTracking.bind(orderController));

export default router;
