import { Router } from "express";
import { 
    createCoupon, 
    getCoupons, 
    getCouponById, 
    updateCoupon, 
    deleteCoupon, 
    validateCoupon,
    getApplicableCoupons
} from "./coupon.controller";
import { verifyJWT, isAdmin, verifyOptionalJWT } from "@/middlewares/auth.middleware";

const router = Router();

// Public routes for checkout/cart
router.get("/public/applicable", getApplicableCoupons);
router.post("/validate", verifyOptionalJWT, validateCoupon);

// Admin only routes for managing coupons
router.use(verifyJWT, isAdmin);

router.get("/", getCoupons);
router.post("/", createCoupon);
router.get("/:id", getCouponById);
router.patch("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
