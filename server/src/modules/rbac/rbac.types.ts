import { Types } from "mongoose";

// 🔹 ENUMS (Scalable RBAC Definitions)
export enum RoleEnum {
  USER = "USER",
  SELLER = "SELLER",
  DELIVERY = "DELIVERY",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum ModuleEnum {
  PRODUCT = "PRODUCT",
  CATEGORY = "CATEGORY",
  ATTRIBUTE = "ATTRIBUTE",
  ORDER = "ORDER",
  USER = "USER",
  SELLER = "SELLER",
  DELIVERY = "DELIVERY",
  STORE = "STORE",
  PAYMENT = "PAYMENT",
  REVIEW = "REVIEW",
  COUPON = "COUPON",
  ANALYTICS = "ANALYTICS",
  BANNER = "BANNER",
  SYSTEM_GEN = "SYSTEM_GEN",
}

export enum DomainEnum {
  CLOTHING = "CLOTHING",
  JEWELRY = "JEWELRY",
  FOOD = "FOOD",
  GLOBAL = "GLOBAL",
}

// 🔹 METADATA & DESCRIPTIONS
export const RoleDescriptions: Record<RoleEnum, string> = {
  [RoleEnum.USER]: "Standard customer with browsing and buying capabilities",
  [RoleEnum.SELLER]: "Merchant who can manage their own shop and products",
  [RoleEnum.DELIVERY]: "Rider/Courier responsible for order fulfillment",
  [RoleEnum.ADMIN]: "Internal staff with operational management access",
  [RoleEnum.SUPER_ADMIN]: "Highest level access with system-wide configuration rights",
};

export const ModuleDescriptions: Record<ModuleEnum, string> = {
  [ModuleEnum.PRODUCT]: "Product management and catalog control",
  [ModuleEnum.CATEGORY]: "Product category and hierarchy management",
  [ModuleEnum.ATTRIBUTE]: "Product variations and attribute management",
  [ModuleEnum.ORDER]: "Sales orders and transaction management",
  [ModuleEnum.USER]: "Customer and staff account management",
  [ModuleEnum.SELLER]: "Merchant onboarding and profile management",
  [ModuleEnum.DELIVERY]: "Rider verification and task management",
  [ModuleEnum.STORE]: "Physical/Virtual shop management",
  [ModuleEnum.PAYMENT]: "Financial transactions and payouts",
  [ModuleEnum.REVIEW]: "Customer feedback and rating management",
  [ModuleEnum.COUPON]: "Marketing promotions and discount codes",
  [ModuleEnum.ANALYTICS]: "Data insights and reporting",
  [ModuleEnum.BANNER]: "Promotional banners and home screen management",
  [ModuleEnum.SYSTEM_GEN]: "System-level administrative permissions",
};

export const DomainDescriptions: Record<DomainEnum, string> = {
  [DomainEnum.CLOTHING]: "Apparel and lifestyle domain",
  [DomainEnum.JEWELRY]: "Luxury jewelry and accessories domain",
  [DomainEnum.FOOD]: "Groceries and consumables domain",
  [DomainEnum.GLOBAL]: "Universal access across all business domains",
};

// 🔹 INTERFACES (Mongoose Document Structures)
export interface IRole {
  _id: Types.ObjectId;
  name: RoleEnum | string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  _id: Types.ObjectId;
  code: string;
  module: ModuleEnum | string;
  domain: DomainEnum;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRolePermission {
  _id: Types.ObjectId;
  roleId: Types.ObjectId | IRole;
  permissionId: Types.ObjectId | IPermission;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRole {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  roleId: Types.ObjectId | IRole;
  assignedBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
