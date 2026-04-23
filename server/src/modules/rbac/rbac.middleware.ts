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
      const userId = (req as any).user?.userId;
      if (!userId) throw new ApiError(401, "Authentication required");

      const userRoles = await rbacService.getRolesByUser(userId);
      const hasRole = userRoles.some(r => {
        const role = r.roleId;
        return role && (role._id.toString() === roleId || role.name === roleId);
      });

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
      const userId = (req as any).user?.userId;
      if (!userId) throw new ApiError(401, "Authentication required");

      const userRoles = await rbacService.getRolesByUser(userId);
      
      // Collect all permissions for all user roles
      const allUserPermissions = new Set<string>();
      for (const r of userRoles) {
        if (r.roleId?._id) {
          const perms = await rbacService.getPermissionsByRole(r.roleId._id.toString());
          Object.keys(perms).forEach(p => allUserPermissions.add(p));
        }
      }

      const hasAllPermissions = requiredPermissions.every(p => allUserPermissions.has(p));

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
