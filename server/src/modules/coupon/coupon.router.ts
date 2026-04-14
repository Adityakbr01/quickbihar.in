import { Router } from "express";
import { 
    createCoupon, 
    getCoupons, 
    getCouponById, 
    updateCoupon, 
    deleteCoupon, 
    validateCoupon 
} from "./coupon.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Validation route should be accessible to authenticated users (or public if needed)
router.post("/validate", verifyJWT, validateCoupon);

// Admin only routes for managing coupons
router.use(verifyJWT, isAdmin);

router.get("/", getCoupons);
router.post("/", createCoupon);
router.get("/:id", getCouponById);
router.patch("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
