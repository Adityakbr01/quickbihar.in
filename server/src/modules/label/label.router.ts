import { Router } from "express";
import { LabelController } from "./label.controller";
import { verifyJWT, isSellerOrAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Only admin/seller can generate labels
router.get("/:id", verifyJWT, isSellerOrAdmin, LabelController.generateLabel);

export default router;
