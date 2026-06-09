import { Seller } from "../seller/seller.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import * as rbacService from "../rbac/rbac.service";
import { RoleEnum } from "../rbac/rbac.types";

const roleNameOf = (role: any) => {
  if (!role) return null;
  if (typeof role === "string") return role;
  return role.name || null;
};

const serializeRole = (role: any) => {
  const roleName = roleNameOf(role);
  if (!roleName) return null;

  if (typeof role === "string") return role;

  return {
    _id: role._id?.toString(),
    name: roleName,
    description: role.description,
  };
};

const approvedProfileRole = async (userId: string) => {
  const [seller, rider] = await Promise.all([
    Seller.findOne({ userId, status: "APPROVED", isVerified: true }).select("_id").lean(),
    DeliveryBoy.findOne({ userId, status: "APPROVED", isVerified: true }).select("_id").lean(),
  ]);

  if (rider) return RoleEnum.DELIVERY;
  if (seller) return RoleEnum.SELLER;
  return RoleEnum.USER;
};

export const ensureAuthRole = async (user: any) => {
  if (roleNameOf(user?.roleId)) return user.roleId;

  const targetRoleName = await approvedProfileRole(user._id.toString());
  const role = await rbacService.getRoleByName(targetRoleName);

  if (!role?._id) return null;

  await rbacService.assignUserToRole(user._id.toString(), role._id.toString());
  user.roleId = role;
  return role;
};

export const serializeAuthUser = async (user: any) => {
  const role = await ensureAuthRole(user);

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: serializeRole(role),
  };
};

