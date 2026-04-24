import { Router } from "express";
import { AuthController } from "./auth.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

// ⭐ Recommended Routes
router.route("/register").post(AuthController.register);
router.route("/login").post(AuthController.login);
router.route("/request-otp").post(AuthController.requestOTP);
router.route("/verify-otp").post(AuthController.verifyOTP);
router.route("/refresh-token").post(AuthController.refreshAccessToken);

// 🛡️ Protected routes
router.route("/logout").post(verifyJWT, AuthController.logout);


export default router;
