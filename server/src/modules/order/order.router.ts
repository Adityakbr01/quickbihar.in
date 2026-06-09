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

// User Routes
router.post("/", OrderController.createOrder);
router.post("/verify", OrderController.verifyPayment);
router.get("/me", OrderController.getMyOrders);
router.get("/:id", OrderController.getOrderById);

export default router;
