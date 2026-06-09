import { Router } from "express";
import { verifyJWT, isSeller } from "../../middlewares/auth.middleware";
import { SellerController } from "./seller.controller";

const router = Router();

router.use(verifyJWT, isSeller);

router.get("/setup-status", SellerController.setupStatus);
router.post("/mall-request", SellerController.requestMallConnection);
router.post("/malls", SellerController.requestMallCreation);
router.post("/payout-methods", SellerController.addPayoutMethod);
router.patch("/payout-methods/:methodId/default", SellerController.setDefaultPayoutMethod);
router.post("/payout-requests", SellerController.createPayoutRequest);

export default router;
