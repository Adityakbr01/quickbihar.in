import type { Request, Response, NextFunction } from "express";
import * as rbacService from "./rbac.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";

// ⭐ PERMISSION ROUTES ⭐

export const createPermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const permission = await rbacService.createPermission(req.body);
  return res.status(201).json(
    new ApiResponse(201, permission, "Permission created successfully")
  );
});

export const getPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as Record<string, unknown>;
  const permissions = await rbacService.getPermissions(filter);
  return res.status(200).json(
    new ApiResponse(200, permissions, "Permissions fetched successfully")
  );
});

export const getPermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  const permission = await rbacService.getPermission(id);
  return res.status(200).json(
    new ApiResponse(200, permission, "Permission fetched successfully")
  );
});

export const updatePermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  const permission = await rbacService.updatePermission(id, req.body);
  return res.status(200).json(
    new ApiResponse(200, permission, "Permission updated successfully")
  );
});

export const removePermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  await rbacService.removePermission(id);
  return res.status(200).json(
    new ApiResponse(200, null, "Permission removed successfully")
  );
});

// ⭐ ROLE ROUTES ⭐

export const createRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const role = await rbacService.createRole(req.body);
  return res.status(201).json(
    new ApiResponse(201, role, "Role created successfully")
  );
});

export const getRoles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as Record<string, unknown>;
  const roles = await rbacService.getRoles(filter);
  return res.status(200).json(
    new ApiResponse(200, roles, "Roles fetched successfully")
  );
});

export const getRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  const role = await rbacService.getRole(id);
  return res.status(200).json(
    new ApiResponse(200, role, "Role fetched successfully")
  );
});

export const updateRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  const role = await rbacService.updateRole(id, req.body);
  return res.status(200).json(
    new ApiResponse(200, role, "Role updated successfully")
  );
});

export const removeRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  await rbacService.removeRole(id);
  return res.status(200).json(
    new ApiResponse(200, null, "Role removed successfully")
  );
});

// ⭐ ROLE-PERMISSION MAPPING ROUTES ⭐

export const assignPermissionToRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { roleId, permissionId } = req.params as { roleId: string; permissionId: string };
  await rbacService.assignPermissionToRole(roleId, permissionId);
  return res.status(200).json(
    new ApiResponse(200, null, "Permission assigned to role successfully")
  );
});

export const removePermissionFromRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { roleId, permissionId } = req.params as { roleId: string; permissionId: string };
  await rbacService.removePermissionFromRole(roleId, permissionId);
  return res.status(200).json(
    new ApiResponse(200, null, "Permission removed from role successfully")
  );
});

export const getPermissionsByRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { roleId } = req.params as { roleId: string };
  const permissions = await rbacService.getPermissionsByRole(roleId);
  return res.status(200).json(
    new ApiResponse(200, permissions, "Permissions fetched for role successfully")
  );
});

// ⭐ USER-ROLE MAPPING ROUTES ⭐

export const assignUserToRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, roleId } = req.body;
  await rbacService.assignUserToRole(userId, roleId);
  return res.status(200).json(
    new ApiResponse(200, null, "User assigned to role successfully")
  );
});

export const removeUserFromRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, roleId } = req.body;
  await rbacService.removeUserFromRole(userId, roleId);
  return res.status(200).json(
    new ApiResponse(200, null, "User role revoked successfully")
  );
});

export const getRolesByUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params as { userId: string };
  const roles = await rbacService.getRolesByUser(userId);
  return res.status(200).json(
    new ApiResponse(200, roles, "User roles fetched successfully")
  );
});
