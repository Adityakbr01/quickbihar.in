/**
 * 🛡️ Centralized Client-Side RBAC (Role-Based Access Control) Utilities
 * Standardized across Web & Mobile apps to match backend RBAC definitions.
 */

export enum RoleEnum {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  SELLER = "SELLER",
  DELIVERY = "DELIVERY",
  USER = "USER",
}

/**
 * Extracts and normalizes all roles assigned to a user as an array of uppercase string role names.
 * Supports all backend & frontend serialization shapes:
 * - user.roles (Array of strings or objects)
 * - user.role (String or object)
 * - user.roleId (String or object)
 */
export function getUserRoles(user: any): string[] {
  if (!user) return [];

  const rolesSet = new Set<string>();

  // 1. Array user.roles
  if (Array.isArray(user.roles)) {
    user.roles.forEach((r: any) => {
      if (typeof r === "string") rolesSet.add(r.toUpperCase());
      else if (r && typeof r.name === "string") rolesSet.add(r.name.toUpperCase());
    });
  }

  // 2. Single user.role
  if (typeof user.role === "string") {
    rolesSet.add(user.role.toUpperCase());
  } else if (user.role && typeof user.role.name === "string") {
    rolesSet.add(user.role.name.toUpperCase());
  }

  // 3. user.roleId
  if (user.roleId && typeof user.roleId.name === "string") {
    rolesSet.add(user.roleId.name.toUpperCase());
  }

  return Array.from(rolesSet);
}

/**
 * Extracts all permission codes assigned to a user.
 */
export function getUserPermissions(user: any): string[] {
  if (!user || !Array.isArray(user.permissions)) return [];
  return user.permissions
    .map((p: any) => (typeof p === "string" ? p : p?.code || p?.name || ""))
    .filter(Boolean);
}

/**
 * Checks if a user possesses AT LEAST ONE of the specified roles.
 */
export function hasRole(user: any, ...roles: (string | RoleEnum)[]): boolean {
  if (!user) return false;
  const userRoles = getUserRoles(user);
  return roles.some((role) => userRoles.includes(String(role).toUpperCase()));
}

/**
 * Checks if a user possesses a specific permission code.
 * Super Admin and Admin automatically pass permission checks.
 */
export function hasPermission(user: any, permissionCode: string): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permissionCode);
}

/**
 * Role Convenience Helpers
 */
export const isAdmin = (user: any): boolean => hasRole(user, RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN);
export const isSeller = (user: any): boolean => hasRole(user, RoleEnum.SELLER);
export const isRider = (user: any): boolean => hasRole(user, RoleEnum.DELIVERY);
export const isCustomer = (user: any): boolean => hasRole(user, RoleEnum.USER);
