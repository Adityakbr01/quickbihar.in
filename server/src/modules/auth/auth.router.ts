import { Router } from "express";
import { AuthController } from "./auth.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

// Single entry point for both registration and login
router.route("/authenticate").post(AuthController.authenticate);
router.route("/refresh-token").post(AuthController.refreshAccessToken);

// Protected routes
router.route("/logout").post(verifyJWT, AuthController.logout);

// Backward compatibility (optional)
router.route("/register").post(AuthController.authenticate);
router.route("/login").post(AuthController.authenticate);

export default router;
