import type { Request, Response, NextFunction } from "express";
import * as rbacService from "./rbac.service";
import { ApiError } from "../../utils/ApiError";

// ⭐ Middleware to validate permissions for a specific role in params
export const validatePermission = (permissionId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId } = req.params as { roleId: string };
      if (!roleId) throw new ApiError(400, "Role ID is required in params");

      const assignedPermissions = await rbacService.getPermissionsByRole(roleId);
      const hasPermission = !!assignedPermissions[permissionId];

      if (!hasPermission) {
        throw new ApiError(403, "Access denied: Missing required permission");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ⭐ Middleware to validate if user has a specific role
export const validateRole = (roleId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.roleId) throw new ApiError(403, "Access denied: User has no role assigned");

      const role = user.roleId;
      const hasRole = role._id.toString() === roleId || role.name === roleId;

      if (!hasRole) {
        throw new ApiError(403, "Access denied: Insufficient Role");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ⭐ Middleware to check if user has all required permissions
export const checkPermissions = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user?.roleId?._id) throw new ApiError(403, "Access denied: User has no role assigned");

      // Fetch all permissions for the user's primary role
      const primaryPerms = await rbacService.getPermissionsByRole(user.roleId._id.toString());
      const hasAllPermissions = requiredPermissions.every(p => !!primaryPerms[p]);

      if (!hasAllPermissions) {
        throw new ApiError(403, "Access denied: Missing one or more required permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ⭐ Export Middleware
export const middleware = {
  validatePermission,
  validateRole,
  checkPermissions,
};
