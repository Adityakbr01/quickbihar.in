import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { UserDAO } from "../modules/user/user.dao";
import { ENV } from "../config/env.config";

export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
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
    throw new ApiError(401, error instanceof Error ? error.message : "Invalid access token");
  }
});
export const isAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin role required.");
  }

  next();
});
