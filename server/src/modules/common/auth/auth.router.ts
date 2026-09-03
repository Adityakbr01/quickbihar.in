import { Router } from "express";
import * as authController from "./auth.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { authRateLimiter, strictAuthRateLimiter } from "@/middlewares/rateLimit.middleware";

const router = Router();

// ── Google OAuth + password reset ────────────────────────
// New public endpoints (rate-limited to throttle abuse)
router.route("/google").post(authRateLimiter, authController.googleAuth);
router.route("/request-reset").post(authRateLimiter, authController.requestReset);
router.route("/reset-password").post(strictAuthRateLimiter, authController.resetPassword);

// Credential paths (rate-limited)
router.route("/register").post(authRateLimiter, authController.register);
router.route("/login").post(authRateLimiter, authController.login);
router.route("/refresh-token").post(authRateLimiter, authController.refreshAccessToken);

// 🛡️ Protected routes
router.route("/logout").post(verifyJWT, authController.logout);
router.route("/set-password").post(verifyJWT, strictAuthRateLimiter, authController.setPassword);
router.route("/link-google").post(verifyJWT, strictAuthRateLimiter, authController.linkGoogle);

export default router;

