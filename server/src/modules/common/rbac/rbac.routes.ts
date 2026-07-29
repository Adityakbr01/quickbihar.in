import { Router } from "express";
import * as rbacController from "./rbac.controller";
import { validateRole } from "./rbac.middleware";
import { ROLES } from "./rbac.constants";

const router = Router();

// Protect all RBAC management routes - only Admins can manage RBAC
router.use(validateRole(ROLES.ADMIN));

// ⭐ Permission Routes
router.post(
  "/permissions",
  rbacController.createPermission
);

router.get(
  "/permissions",
  rbacController.getPermissions
);

router.get(
  "/permissions/:id",
  rbacController.getPermission
);

router.patch(
  "/permissions/:id",
  rbacController.updatePermission
);

router.delete(
  "/permissions/:id",
  rbacController.removePermission
);

// ⭐ Role Routes
router.post("/roles", rbacController.createRole);
router.get("/roles", rbacController.getRoles);
router.get("/roles/:id", rbacController.getRole);
router.patch("/roles/:id", rbacController.updateRole);
router.delete("/roles/:id", rbacController.removeRole);

// ⭐ Role-Permission Mapping Routes
router.post(
  "/roles/:roleId/permissions/:permissionId",
  rbacController.assignPermissionToRole
);

router.delete(
  "/roles/:roleId/permissions/:permissionId",
  rbacController.removePermissionFromRole
);

router.get(
  "/roles/:roleId/permissions",
  rbacController.getPermissionsByRole
);

// ⭐ User-Role Mapping Routes
router.post("/user-roles/assign", rbacController.assignUserToRole);
router.post("/user-roles/revoke", rbacController.removeUserFromRole);
router.get("/user-roles/:userId", rbacController.getRolesByUser);

export const rbacRoutes = router;
