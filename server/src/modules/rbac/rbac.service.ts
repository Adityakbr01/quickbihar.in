import { Types } from "mongoose";
import { Role, Permission, RolePermission, UserRole } from "./rbac.model";
import { permissionDao, roleDao, rolePermissionDao, userRoleDao } from "./rbac.dao";
import {
  createRoleSchema,
  createPermissionSchema,
  createRolePermissionSchema,
  updateRoleSchema,
  updatePermissionSchema
} from "./rbac.schema";
import { ApiError } from "../../utils/ApiError";

// ⭐ PERMISSION OPERATIONS ⭐

export const createPermission = async (data: any): Promise<any> => {
  const validated = createPermissionSchema.safeParse(data);
  if (!validated.success) {
    throw new ApiError(400, "Validation Error", validated.error.issues);
  }

  return await permissionDao.create(validated.data);
};

export const getPermission = async (id: string): Promise<any | null> => {
  const permission = await permissionDao.findById(id);
  if (!permission) throw new ApiError(404, "Permission not found");
  return permission;
};

export const getPermissions = async (filter?: Record<string, unknown>): Promise<any[]> => {
  return await permissionDao.findAll(filter);
};

export const updatePermission = async (id: string, data: any): Promise<any> => {
  const validated = updatePermissionSchema.safeParse(data);
  if (!validated.success) {
    throw new ApiError(400, "Validation Error", validated.error.issues);
  }

  const updated = await permissionDao.update(id, validated.data);
  if (!updated) throw new ApiError(404, "Permission not found");
  return updated;
};

export const removePermission = async (id: string): Promise<void> => {
  await permissionDao.delete(id);
};

// ⭐ ROLE OPERATIONS ⭐

export const createRole = async (data: any): Promise<any> => {
  const validated = createRoleSchema.safeParse(data);
  if (!validated.success) {
    throw new ApiError(400, "Validation Error", validated.error.issues);
  }

  return await roleDao.create(validated.data);
};

export const getRole = async (id: string): Promise<any | null> => {
  const role = await roleDao.findById(id);
  if (!role) throw new ApiError(404, "Role not found");
  return role;
};

export const getRoles = async (filter?: Record<string, unknown>): Promise<any[]> => {
  return await roleDao.findAll(filter);
};

export const getRoleByName = async (name: string): Promise<any | null> => {
  const role = await Role.findOne({ name }).lean();
  if (!role) throw new ApiError(404, `Role '${name}' not found`);
  return role;
};

export const updateRole = async (id: string, data: any): Promise<any> => {
  const validated = updateRoleSchema.safeParse(data);
  if (!validated.success) {
    throw new ApiError(400, "Validation Error", validated.error.issues);
  }

  const updated = await roleDao.update(id, validated.data);
  if (!updated) throw new ApiError(404, "Role not found");
  return updated;
};

export const removeRole = async (id: string): Promise<void> => {
  // Check if role in use
  const roleInUse = await RolePermission.countDocuments({ roleId: id });
  if (roleInUse > 0) {
    throw new ApiError(400, "Cannot delete a role that has assigned permissions");
  }
  await roleDao.delete(id);
};

// ⭐ ROLE-PERMISSION OPERATIONS ⭐

export const assignPermissionToRole = async (roleId: string, permissionId: string): Promise<void> => {
  const validated = createRolePermissionSchema.safeParse({ roleId, permissionId });
  if (!validated.success) {
    throw new ApiError(400, "Validation Error", validated.error.issues);
  }

  const exists = await RolePermission.findOne({ roleId, permissionId }).lean();
  if (exists) throw new ApiError(400, "Permission already assigned to role");

  await RolePermission.create({ 
    roleId: new Types.ObjectId(roleId), 
    permissionId: new Types.ObjectId(permissionId) 
  });
  await rolePermissionDao.invalidateCache(roleId);
};

export const removePermissionFromRole = async (roleId: string, permissionId: string): Promise<void> => {
  await RolePermission.deleteOne({ roleId, permissionId });
  await rolePermissionDao.invalidateCache(roleId);
};

export const getPermissionsByRole = async (roleId: string): Promise<Record<string, string>> => {
  return await rolePermissionDao.getCachedPermissions(roleId);
};

// ⭐ USER-ROLE OPERATIONS ⭐

export const assignUserToRole = async (userId: string, roleId: string): Promise<void> => {
  await userRoleDao.assign(userId, roleId);
};

export const removeUserFromRole = async (userId: string, roleId: string): Promise<void> => {
  await userRoleDao.revoke(userId, roleId);
};

export const getRolesByUser = async (userId: string): Promise<any[]> => {
  return await userRoleDao.findByUser(userId);
};
