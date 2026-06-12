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

// 📣 Admin endpoints
router.post("/send", verifyJWT, isAdminOrSuperAdmin, upload.single("image"), NotificationController.sendNotification);
router.get("/history", verifyJWT, isAdminOrSuperAdmin, NotificationController.getNotificationHistory);

// 📱 Client endpoints (User / Rider / Seller inbox)
router.get("/user", verifyJWT, NotificationController.getUserNotifications);
router.patch("/read-all", verifyJWT, NotificationController.markAllAsRead);
router.patch("/:id/read", verifyJWT, NotificationController.markAsRead);

export default router;
