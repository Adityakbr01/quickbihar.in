import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyJWT } from "@/middlewares/auth.middleware";
import * as notificationController from "./notification.controller";
import { RoleEnum } from "@/modules/common/rbac/rbac.types";
import { ApiError } from "@/utils/ApiError";
import { upload } from "@/middlewares/multer.middleware";

const router = Router();

// Middleware to verify if the logged-in user is an Admin or Super Admin
const isAdminOrSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) throw new ApiError(401, "Authentication required");
    
    const roleName = user.roleId?.name;
    if (roleName !== RoleEnum.ADMIN && roleName !== RoleEnum.SUPER_ADMIN) {
      throw new ApiError(403, "Access denied. Admin level access required.");
    }
    next();
  } catch (error) {
    next(error);
  }
};

// 📣 Static / Specific Endpoints First

// GET Endpoints
router.get("/history", verifyJWT, isAdminOrSuperAdmin, notificationController.getNotificationHistory);
router.get("/analytics", verifyJWT, isAdminOrSuperAdmin, notificationController.getNotificationAnalytics);
router.get("/user", verifyJWT, notificationController.getUserNotifications);

// POST Endpoints
router.post("/send", verifyJWT, isAdminOrSuperAdmin, upload.single("image"), notificationController.sendNotification);
router.post("/batch-delete", verifyJWT, isAdminOrSuperAdmin, notificationController.batchDeleteNotifications);
router.post("/test-direct-push", verifyJWT, isAdminOrSuperAdmin, notificationController.testDirectPush);

// PATCH Endpoints
router.patch("/read-all", verifyJWT, notificationController.markAllAsRead);


// 📣 Dynamic / Parameterized Endpoints Last (to prevent route clashing)

// GET Dynamic
router.get("/:id", verifyJWT, isAdminOrSuperAdmin, notificationController.getNotificationDetails);

// POST Dynamic
router.post("/:id/resend", verifyJWT, isAdminOrSuperAdmin, notificationController.resendNotification);

// PATCH Dynamic
router.patch("/:id/read", verifyJWT, notificationController.markAsRead);
router.patch("/:id/delivered", verifyJWT, notificationController.reportDelivery);
router.patch("/:id/opened", verifyJWT, notificationController.reportOpen);
router.patch("/:id", verifyJWT, isAdminOrSuperAdmin, upload.single("image"), notificationController.updateNotification);

// DELETE Dynamic
router.delete("/:id", verifyJWT, isAdminOrSuperAdmin, notificationController.deleteNotification);

export default router;
