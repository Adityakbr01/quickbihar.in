import { Router } from "express";
import { OrderController } from "./order.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

// Admin Routes
router.get("/admin/all", isAdmin, OrderController.getAdminOrders);
router.patch("/admin/status/:id", isAdmin, OrderController.adminUpdateOrderStatus);
router.patch("/admin/:id/delivery-assignment", isAdmin, OrderController.assignDeliveryPartner);
router.delete("/admin/:id/delivery-assignment", isAdmin, OrderController.unassignDeliveryPartner);
router.get("/admin/sub-orders", isAdmin, OrderController.getAdminSubOrders);
router.post("/admin/sub-orders/:id/assign", isAdmin, OrderController.adminAssignRider);
router.post("/admin/sub-orders/:id/cod-settle", isAdmin, OrderController.adminSettleCod);

// User Routes
router.post("/", OrderController.createOrder);
router.post("/verify", OrderController.verifyPayment);
router.get("/me", OrderController.getMyOrders);
router.get("/sub-orders/:id", OrderController.getSubOrderDetails);
router.post("/sub-orders/:id/cancel", OrderController.cancelSubOrder);
router.post("/sub-orders/:id/return", OrderController.returnSubOrder);
router.get("/:id", OrderController.getOrderById);

export default router;
