import { Router } from "express";
import { verifyJWT, isAdmin, validatePermission } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";
import { UserController } from "./user.controller";
import { PERMISSIONS } from "../rbac/rbac.constants";

const router = Router();

// ⭐ PUBLIC ROUTES (NONE)

// ⭐ PROTECTED ROUTES (Requires Login)
router.use(verifyJWT);

router.get("/profile", UserController.getProfile);
router.patch("/profile", UserController.updateProfile);
router.patch("/fcm-token", UserController.updateFcmToken);
router.patch("/avatar", upload.single("avatar"), UserController.updateAvatar);

// ⭐ MANAGEMENT ROUTES (Requires Admin Role)
router.get("/all", isAdmin, UserController.getAllUsers);

// Example of using a specific Permission check instead of a Role check
router.delete("/:id", validatePermission(PERMISSIONS.BLOCK_USER.code), UserController.deleteUser);

export default router;