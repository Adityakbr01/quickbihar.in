import { Router } from "express";
import { getAppConfig, updateAppConfig } from "./appConfig.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Public route to get configurations
router.get("/", getAppConfig);

// Admin only route to update configurations
router.patch("/", verifyJWT, isAdmin, updateAppConfig);

export default router;
