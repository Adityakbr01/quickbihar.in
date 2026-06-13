import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { NotificationController } from "./notification.controller";
import { RoleEnum } from "../rbac/rbac.types";
import { ApiError } from "../../utils/ApiError";
import { upload } from "../../middlewares/multer.middleware";

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
router.get("/history", verifyJWT, isAdminOrSuperAdmin, NotificationController.getNotificationHistory);
router.get("/analytics", verifyJWT, isAdminOrSuperAdmin, NotificationController.getNotificationAnalytics);
router.get("/user", verifyJWT, NotificationController.getUserNotifications);

// POST Endpoints
router.post("/send", verifyJWT, isAdminOrSuperAdmin, upload.single("image"), NotificationController.sendNotification);

// PATCH Endpoints
router.patch("/read-all", verifyJWT, NotificationController.markAllAsRead);


// 📣 Dynamic / Parameterized Endpoints Last (to prevent route clashing)

// GET Dynamic
router.get("/:id", verifyJWT, isAdminOrSuperAdmin, NotificationController.getNotificationDetails);

// POST Dynamic
router.post("/:id/resend", verifyJWT, isAdminOrSuperAdmin, NotificationController.resendNotification);

// PATCH Dynamic
router.patch("/:id/read", verifyJWT, NotificationController.markAsRead);
router.patch("/:id/delivered", verifyJWT, NotificationController.reportDelivery);
router.patch("/:id/opened", verifyJWT, NotificationController.reportOpen);
router.patch("/:id", verifyJWT, isAdminOrSuperAdmin, upload.single("image"), NotificationController.updateNotification);

// DELETE Dynamic
router.delete("/:id", verifyJWT, isAdminOrSuperAdmin, NotificationController.deleteNotification);

export default router;
