import type { Request, Response, NextFunction } from "express";
import * as rbacService from "./rbac.service";
import { ApiError } from "@/utils/ApiError";

// ⭐ Middleware to validate the authenticated user's role holds a given permission
export const validatePermission = (permissionId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Gate on the *caller's* role, not a route param. The previous version read
      // req.params.roleId, which the only consumer (DELETE /users/:id) never supplies,
      // so the guard threw 400 on every request. Mirror checkPermissions here.
      const user = (req as any).user;
      const roleId = user?.roleId?._id;
      if (!roleId) throw new ApiError(403, "Access denied: User has no role assigned");

      const assignedPermissions = await rbacService.getPermissionsByRole(roleId.toString());
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

// ⭐ Middleware to validate if user has one of the given roles
export const validateRole = (...roleNamesOrIds: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) throw new ApiError(401, "Authentication required");

      const userRole = user.roleId || user.role;
      const userRoleName = typeof userRole === "string" ? userRole : userRole?.name;
      const userRoleId = userRole?._id?.toString();

      const hasRole = roleNamesOrIds.some(
        (target) =>
          target === userRoleId ||
          target === userRoleName ||
          (Array.isArray(user.roles) &&
            user.roles.some((r: any) => (typeof r === "string" ? r === target : r?.name === target))),
      );

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
