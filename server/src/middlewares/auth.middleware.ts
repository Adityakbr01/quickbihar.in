import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { UserDAO } from "../modules/common/user/user.dao";
import { ENV } from "../config/env.config";
import { RoleEnum } from "../modules/common/rbac/rbac.types";
import {
  validateRole,
  validatePermission,
  checkPermissions,
} from "../modules/common/rbac/rbac.middleware";

/**
 * 🛡️ Verify JWT and attach user to request
 */
export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      const decodedToken: any = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET);

      const user = await UserDAO.findById(decodedToken?._id);

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      (req as any).user = user;
      next();
    } catch (error) {
      throw new ApiError(
        401,
        error instanceof Error ? error.message : "Invalid access token",
      );
    }
  },
);

/**
 * 🛡️ Legacy/Shortcut Middlewares (Migrated to RBAC)
 */
export const isAdmin = validateRole(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN);
export const isSuperAdmin = validateRole(RoleEnum.SUPER_ADMIN);
export const isSeller = validateRole(RoleEnum.SELLER);
export const isDelivery = validateRole(RoleEnum.DELIVERY);

/**
 * 🛡️ Composite Middlewares
 */
export const isSellerOrAdmin = validateRole(
  RoleEnum.SELLER,
  RoleEnum.ADMIN,
  RoleEnum.SUPER_ADMIN,
);

// Re-export RBAC tools for convenience
export { validateRole, validatePermission, checkPermissions };
