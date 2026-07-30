import { Router } from "express";
import { verifyJWT, isAdmin, isDelivery } from "@/middlewares/auth.middleware";
import * as deliveryController from "./delivery.controller";
import { legacyParentDeliveryGone } from "./legacyDeliveryGone";

const router = Router();

router.use(verifyJWT);

router.get("/admin/riders", isAdmin, deliveryController.adminRiders);
router.patch("/admin/riders/:riderId/documents", isAdmin, deliveryController.adminReviewRiderDocument);
router.get("/admin/matching-diagnostics/:subOrderId", isAdmin, deliveryController.matchingDiagnostics);

router.get("/me", isDelivery, deliveryController.me);
router.get("/dashboard", isDelivery, deliveryController.dashboard);
router.get("/history", isDelivery, deliveryController.history);
router.get("/earnings", isDelivery, deliveryController.earnings);
router.get("/payouts", isDelivery, deliveryController.payouts);
router.post("/payout-methods", isDelivery, deliveryController.addPayoutMethod);
router.patch("/payout-methods/:methodId/default", isDelivery, deliveryController.setDefaultPayoutMethod);
router.post("/payout-requests", isDelivery, deliveryController.requestPayout);
router.patch("/profile", isDelivery, deliveryController.updateProfile);
router.patch("/availability", isDelivery, deliveryController.updateAvailability);
router.get("/orders", isDelivery, deliveryController.orders);
router.get("/sync", isDelivery, deliveryController.sync);
router.get("/offers", isDelivery, deliveryController.offers);
router.post("/offers/:id/accept", isDelivery, deliveryController.acceptOffer);
router.post("/offers/:id/reject", isDelivery, deliveryController.rejectOffer);
router.get("/orders/:id", isDelivery, deliveryController.orderById);
router.patch("/orders/:id/status", isDelivery, legacyParentDeliveryGone);
router.post("/orders/:id/location", isDelivery, legacyParentDeliveryGone);

// Sub-order Rider Fulfillment
router.post("/sub-orders/:id/accept", isDelivery, deliveryController.acceptSubOrder);
router.patch("/sub-orders/:id/arriving", isDelivery, deliveryController.subOrderArriving);
router.patch("/sub-orders/:id/reached-store", isDelivery, deliveryController.subOrderReachedStore);
router.post("/sub-orders/:id/pickup", isDelivery, deliveryController.subOrderPickup);
router.patch("/sub-orders/:id/transit", isDelivery, deliveryController.subOrderTransit);
router.patch("/sub-orders/:id/near-customer", isDelivery, deliveryController.subOrderNearCustomer);
router.post("/sub-orders/:id/deliver", isDelivery, deliveryController.subOrderDeliver);
router.post("/sub-orders/:id/cancel", isDelivery, deliveryController.subOrderCancel);

// Return pickups (pull model: any eligible rider can claim an approved return)
router.get("/return-tasks", isDelivery, deliveryController.returnTasks);
router.post("/sub-orders/:id/return-claim", isDelivery, deliveryController.claimReturn);
router.post("/sub-orders/:id/return-pickup", isDelivery, deliveryController.returnPickup);

export default router;
