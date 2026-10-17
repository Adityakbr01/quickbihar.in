import { describe, expect, it } from "bun:test";
import {
  RoleEnum,
  getUserRoles,
  getUserPermissions,
  hasRole,
  hasPermission,
  isAdmin,
  isSeller,
  isRider,
  isCustomer,
} from "../lib/rbac";

describe("Client-side RBAC & Access Control", () => {
  describe("getUserRoles", () => {
    it("returns empty array for falsy user", () => {
      expect(getUserRoles(null)).toEqual([]);
      expect(getUserRoles(undefined)).toEqual([]);
    });

    it("normalizes array of string roles to uppercase", () => {
      const user = { roles: ["admin", "seller"] };
      expect(getUserRoles(user)).toEqual(["ADMIN", "SELLER"]);
    });

    it("extracts names from array of role objects", () => {
      const user = { roles: [{ name: "delivery" }, { name: "user" }] };
      expect(getUserRoles(user)).toEqual(["DELIVERY", "USER"]);
    });

    it("extracts and normalizes single user.role (string or object)", () => {
      expect(getUserRoles({ role: "seller" })).toEqual(["SELLER"]);
      expect(getUserRoles({ role: { name: "admin" } })).toEqual(["ADMIN"]);
    });

    it("extracts user.roleId object shape", () => {
      const user = { roleId: { _id: "role_123", name: "SUPER_ADMIN" } };
      expect(getUserRoles(user)).toEqual(["SUPER_ADMIN"]);
    });

    it("deduplicates roles when present in multiple properties", () => {
      const user = {
        role: "ADMIN",
        roles: ["admin", "ADMIN"],
        roleId: { name: "Admin" },
      };
      expect(getUserRoles(user)).toEqual(["ADMIN"]);
    });
  });

  describe("hasRole", () => {
    it("returns false for falsy user", () => {
      expect(hasRole(null, RoleEnum.ADMIN)).toBe(false);
    });

    it("returns true when user has at least one of the queried roles", () => {
      const user = { roles: ["SELLER"] };
      expect(hasRole(user, RoleEnum.SELLER)).toBe(true);
      expect(hasRole(user, RoleEnum.ADMIN, RoleEnum.SELLER)).toBe(true);
      expect(hasRole(user, RoleEnum.ADMIN, RoleEnum.DELIVERY)).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("always grants permissions to Admin and Super Admin", () => {
      const admin = { roles: ["ADMIN"] };
      const superAdmin = { roles: ["SUPER_ADMIN"] };

      expect(hasPermission(admin, "CATALOG_DELETE")).toBe(true);
      expect(hasPermission(superAdmin, "ANY_PERMISSION")).toBe(true);
    });

    it("checks explicit permissions array for standard roles", () => {
      const seller = {
        roles: ["SELLER"],
        permissions: ["PRODUCT_CREATE", "PRODUCT_UPDATE"],
      };

      expect(hasPermission(seller, "PRODUCT_CREATE")).toBe(true);
      expect(hasPermission(seller, "PRODUCT_DELETE")).toBe(false);
    });
  });

  describe("Role Convenience Helpers", () => {
    it("accurately identifies administrative and partner roles", () => {
      const adminUser = { roles: ["ADMIN"] };
      const sellerUser = { roles: ["SELLER"] };
      const riderUser = { roles: ["DELIVERY"] };
      const customerUser = { roles: ["USER"] };

      expect(isAdmin(adminUser)).toBe(true);
      expect(isAdmin(sellerUser)).toBe(false);

      expect(isSeller(sellerUser)).toBe(true);
      expect(isSeller(adminUser)).toBe(false);

      expect(isRider(riderUser)).toBe(true);
      expect(isRider(customerUser)).toBe(false);

      expect(isCustomer(customerUser)).toBe(true);
      expect(isCustomer(sellerUser)).toBe(false);
    });
  });
});
