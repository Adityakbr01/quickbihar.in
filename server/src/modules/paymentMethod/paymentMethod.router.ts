import { Router } from "express";
import { PaymentMethodController } from "./paymentMethod.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.post("/", PaymentMethodController.addPaymentMethod);
router.get("/", PaymentMethodController.getMyPaymentMethods);
router.delete("/:id", PaymentMethodController.deletePaymentMethod);
router.patch("/:id/default", PaymentMethodController.setDefaultPaymentMethod);

export default router;