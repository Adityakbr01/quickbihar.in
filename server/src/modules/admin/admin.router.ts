import { Router } from "express";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";
import { AdminController } from "./admin.controller";

const router = Router();

router.use(verifyJWT, isAdmin);

router.get("/management-catalog", AdminController.managementCatalog);
router.get("/dashboard", AdminController.dashboard);
router.get("/people", AdminController.people);
router.patch("/users/:id/block", AdminController.blockUser);
router.patch("/partners/:id/status", AdminController.updatePartnerStatus);
router.post("/invites", AdminController.invite);
router.get("/payouts", AdminController.payouts);
router.post("/payouts", AdminController.createPayout);
router.patch("/payouts/:id/status", AdminController.updatePayoutStatus);
router.get("/payout-methods", AdminController.payoutMethods);
router.patch("/sellers/:sellerId/payout-methods/:methodId/status", AdminController.reviewPayoutMethod);
router.get("/malls", AdminController.malls);
router.get("/mall-requests", AdminController.mallRequests);
router.get("/mall-creation-requests", AdminController.mallCreationRequests);
router.post("/malls", AdminController.createMall);
router.patch("/malls/:id", AdminController.updateMall);
router.patch("/malls/:id/review", AdminController.reviewMallCreation);
router.delete("/malls/:id", AdminController.deleteMall);
router.patch("/sellers/:id/mall", AdminController.assignSellerMall);
router.patch("/sellers/:id/mall-request", AdminController.reviewMallRequest);

export default router;
