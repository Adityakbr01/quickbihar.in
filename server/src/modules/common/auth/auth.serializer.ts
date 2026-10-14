import { Seller } from "@/modules/common/seller/seller.model";
import { DeliveryBoy } from "@/modules/common/deliveryBoy/delivery.model";
import * as rbacService from "@/modules/common/rbac/rbac.service";
import { RoleEnum } from "@/modules/common/rbac/rbac.types";

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
  const identities = (user?.identities ?? []) as Array<{ provider?: string }>;

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: serializeRole(role),
    // Tells clients whether email+password sign-in is available. True when a
    // "password" identity exists OR a password hash is set (covers accounts
    // created before identities were backfilled). Google-only users get false
    // and see "Add password" instead of "Change password" in the UI.
    hasPassword:
      identities.some((i) => i?.provider === "password") ||
      Boolean(user.password),
    // Avatar + createdAt must travel with the user: the mobile store and the
    // profile screens render `user.avatar` / `createdAt` directly, and
    // avatar-update responses go through setAuth (a missing key would wipe it).
    avatar: user.avatar?.url
      ? { url: user.avatar.url, fileId: user.avatar.fileId }
      : undefined,
    createdAt: user.createdAt ?? undefined,
  };
};

