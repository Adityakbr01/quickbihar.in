import { Router } from "express";
import * as labelController from "./label.controller";
import { verifyJWT, isSellerOrAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Only admin/seller can generate labels
router.get("/:id", verifyJWT, isSellerOrAdmin, labelController.generateLabel);

export default router;
