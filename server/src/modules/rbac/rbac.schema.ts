import { z } from "zod";
import { RoleEnum, ModuleEnum, DomainEnum } from "./rbac.types";

// Helper for ObjectId validation
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// 🔐 ROLE SCHEMAS
export const createRoleSchema = z.object({
  name: z.nativeEnum(RoleEnum),
  description: z.string().optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

// 🔑 PERMISSION SCHEMAS
export const createPermissionSchema = z.object({
  code: z.string().min(3, "Permission code is required"),
  module: z.nativeEnum(ModuleEnum),
  domain: z.nativeEnum(DomainEnum).default(DomainEnum.GLOBAL),
  description: z.string().optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// 🔗 ROLE-PERMISSION SCHEMAS
export const createRolePermissionSchema = z.object({
  roleId: objectIdSchema,
  permissionId: objectIdSchema,
  description: z.string().optional(),
});

// 👤 USER-ROLE SCHEMAS
export const assignUserRoleSchema = z.object({
  userId: objectIdSchema,
  roleId: objectIdSchema,
});

// ⭐ Types inferred from schemas
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type CreateRolePermissionInput = z.infer<typeof createRolePermissionSchema>;
