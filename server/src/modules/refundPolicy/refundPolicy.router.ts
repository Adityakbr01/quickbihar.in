import { Router } from "express";
import { 
    createRefundPolicy, 
    getActiveRefundPolicy, 
    getAllRefundPolicies, 
    updateRefundPolicy, 
    deleteRefundPolicy 
} from "./refundPolicy.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Public route
router.get("/active", getActiveRefundPolicy);

// Admin only routes
router.post("/", verifyJWT, isAdmin, createRefundPolicy);
router.get("/all", verifyJWT, isAdmin, getAllRefundPolicies);
router.patch("/:id", verifyJWT, isAdmin, updateRefundPolicy);
router.delete("/:id", verifyJWT, isAdmin, deleteRefundPolicy);

export default router;
