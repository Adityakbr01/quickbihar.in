import { Router } from "express";
import { verifyJWT, isAdmin, isDelivery } from "../../middlewares/auth.middleware";
import { DeliveryController } from "./delivery.controller";

const router = Router();

router.use(verifyJWT);

router.get("/admin/riders", isAdmin, DeliveryController.adminRiders);

router.get("/me", isDelivery, DeliveryController.me);
router.get("/dashboard", isDelivery, DeliveryController.dashboard);
router.get("/history", isDelivery, DeliveryController.history);
router.get("/earnings", isDelivery, DeliveryController.earnings);
router.get("/payouts", isDelivery, DeliveryController.payouts);
router.post("/payout-methods", isDelivery, DeliveryController.addPayoutMethod);
router.patch("/payout-methods/:methodId/default", isDelivery, DeliveryController.setDefaultPayoutMethod);
router.post("/payout-requests", isDelivery, DeliveryController.requestPayout);
router.patch("/profile", isDelivery, DeliveryController.updateProfile);
router.patch("/availability", isDelivery, DeliveryController.updateAvailability);
router.get("/orders", isDelivery, DeliveryController.orders);
router.get("/orders/:id", isDelivery, DeliveryController.orderById);
router.patch("/orders/:id/status", isDelivery, DeliveryController.updateOrderStatus);
router.post("/orders/:id/location", isDelivery, DeliveryController.updateOrderLocation);

export default router;
