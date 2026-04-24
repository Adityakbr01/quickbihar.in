import mongoose, { Schema, Types, type SchemaOptions } from "mongoose";
import {
  type IRole,
  type IPermission,
  type IRolePermission,
  RoleEnum,
  ModuleEnum,
  DomainEnum
} from "./rbac.types";

const baseOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
};

// 🔐 ROLE SCHEMA
const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      enum: Object.values(RoleEnum),
      required: true,
      unique: true,
      index: true,
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  baseOptions,
);

// 🔑 PERMISSION SCHEMA
const PermissionSchema = new Schema<IPermission>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    module: {
      type: String,
      enum: Object.values(ModuleEnum),
      required: true,
      index: true,
    },
    domain: {
      type: String,
      enum: Object.values(DomainEnum),
      default: DomainEnum.GLOBAL,
      index: true,
    },
    description: String,
  },
  baseOptions,
);

// 🔗 ROLE ↔ PERMISSION MAPPING
const RolePermissionSchema = new Schema<IRolePermission>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    permissionId: {
      type: Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
      index: true,
    },
    description: String,
  },
  baseOptions,
);

RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

// 🚀 EXPORTS
export const Role = mongoose.model<IRole>("Role", RoleSchema);
export const Permission = mongoose.model<IPermission>("Permission", PermissionSchema);
export const RolePermission = mongoose.model<IRolePermission>("RolePermission", RolePermissionSchema);
