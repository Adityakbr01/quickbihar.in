import { Router } from "express";
import { OrderController } from "./order.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.post("/", OrderController.createOrder);
router.post("/verify", OrderController.verifyPayment);
router.get("/me", OrderController.getMyOrders);
router.get("/:id", OrderController.getOrderById);

export default router;
