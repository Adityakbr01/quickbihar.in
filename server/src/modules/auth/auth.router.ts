import { Router } from "express";
import * as authController from "./auth.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

// ⭐ Recommended Routes
router.route("/register").post(authController.register);
router.route("/login").post(authController.login);
router.route("/request-otp").post(authController.requestOTP);
router.route("/verify-otp").post(authController.verifyOTP);
router.route("/refresh-token").post(authController.refreshAccessToken);

// 🛡️ Protected routes
router.route("/logout").post(verifyJWT, authController.logout);

export default router;
