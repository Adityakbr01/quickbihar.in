import { Router } from "express";
import { verifyJWT, isAdmin, isDelivery } from "../../middlewares/auth.middleware";
import { DeliveryController } from "./delivery.controller";
import { legacyParentDeliveryGone } from "./legacyDeliveryGone";

const router = Router();

router.use(verifyJWT);

router.get("/admin/riders", isAdmin, DeliveryController.adminRiders);
router.get("/admin/matching-diagnostics/:subOrderId", isAdmin, DeliveryController.matchingDiagnostics);

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
router.get("/sync", isDelivery, DeliveryController.sync);
router.get("/offers", isDelivery, DeliveryController.offers);
router.post("/offers/:id/accept", isDelivery, DeliveryController.acceptOffer);
router.post("/offers/:id/reject", isDelivery, DeliveryController.rejectOffer);
router.get("/orders/:id", isDelivery, DeliveryController.orderById);
router.patch("/orders/:id/status", isDelivery, legacyParentDeliveryGone);
router.post("/orders/:id/location", isDelivery, legacyParentDeliveryGone);

// Sub-order Rider Fulfillment
router.post("/sub-orders/:id/accept", isDelivery, DeliveryController.acceptSubOrder);
router.patch("/sub-orders/:id/arriving", isDelivery, DeliveryController.subOrderArriving);
router.patch("/sub-orders/:id/reached-store", isDelivery, DeliveryController.subOrderReachedStore);
router.post("/sub-orders/:id/pickup", isDelivery, DeliveryController.subOrderPickup);
router.patch("/sub-orders/:id/transit", isDelivery, DeliveryController.subOrderTransit);
router.patch("/sub-orders/:id/near-customer", isDelivery, DeliveryController.subOrderNearCustomer);
router.post("/sub-orders/:id/deliver", isDelivery, DeliveryController.subOrderDeliver);
router.post("/sub-orders/:id/cancel", isDelivery, DeliveryController.subOrderCancel);

export default router;
