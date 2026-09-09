import { Router } from "express";
import { verifyJWT, isAdmin, validatePermission } from "@/middlewares/auth.middleware";
import { authRateLimiter } from "@/middlewares/rateLimit.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { UserController } from "./user.controller";
import { PERMISSIONS } from "@/modules/common/rbac/rbac.constants";

const router = Router();

// ⭐ PUBLIC ROUTES
// Intentionally public: guest devices register push tokens pre-login; the handler
// links the token to a user only when a valid JWT is presented. Abuse-guarded by
// rate limit + token shape validation in the controller (plan §33 disposition).
router.patch("/fcm-token", authRateLimiter, UserController.updateFcmToken);

// ⭐ PROTECTED ROUTES (Requires Login)
router.use(verifyJWT);

router.get("/profile", UserController.getProfile);
router.patch("/profile", UserController.updateProfile);
router.patch("/avatar", upload.single("avatar"), UserController.updateAvatar);

// ⭐ MANAGEMENT ROUTES (Requires Admin Role) : todo send to Admin module
router.get("/all", isAdmin, UserController.getAllUsers);

// Example of using a specific Permission check instead of a Role check
router.delete("/:id", validatePermission(PERMISSIONS.BLOCK_USER.code), UserController.deleteUser);

export default router;