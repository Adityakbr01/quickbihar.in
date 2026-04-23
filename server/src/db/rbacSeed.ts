import mongoose from "mongoose";
import { ENV } from "../config/env.config";
import { PERMISSIONS, ROLES } from "../modules/rbac/rbac.constants";
import { ROLE_PERMISSION_MAP } from "../modules/rbac/ROLE_PERMISSION_MAP";
import { Permission, Role, RolePermission } from "../modules/rbac/rbac.model";
import { RoleDescriptions, RoleEnum } from "../modules/rbac/rbac.types";

async function seedRBAC() {
  console.log("🚀 Starting RBAC Seed Process...");

  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Seed Permissions
    console.log("\n🔑 Seeding Permissions...");
    const permissionEntries = Object.values(PERMISSIONS);
    let permCount = 0;

    for (const perm of permissionEntries) {
      await Permission.findOneAndUpdate(
        { code: (perm as any).code },
        { 
          code: (perm as any).code, 
          description: (perm as any).description,
          module: (perm as any).module || "SYSTEM_GEN",
        },
        { upsert: true, new: true, returnDocument: 'after' }
      );
      permCount++;
    }
    console.log(`✨ Processed ${permCount} permissions`);

    // 2. Seed Roles
    console.log("\n🔐 Seeding Roles...");
    const roleEntries = Object.values(RoleEnum);
    let roleCount = 0;

    for (const roleName of roleEntries) {
      await Role.findOneAndUpdate(
        { name: roleName },
        { 
          name: roleName, 
          isActive: true,
          description: RoleDescriptions[roleName] || `System role for ${roleName}`
        },
        { upsert: true, new: true, returnDocument: 'after' }
      );
      roleCount++;
    }
    console.log(`✨ Processed ${roleCount} roles`);

    // 3. Seed Role-Permission Mappings
    console.log("\n🔗 Seeding Role-Permission Mappings...");
    let mappingCount = 0;

    for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        console.warn(`⚠️ Role ${roleName} not found, skipping mapping.`);
        continue;
      }

      console.log(`📡 Mapping permissions for role: [${roleName}]`);

      // Find all permissions that are in the array
      const permissions = await Permission.find({
        code: { $in: permissionCodes }
      });

      for (const perm of permissions) {
        await RolePermission.findOneAndUpdate(
          { roleId: role._id, permissionId: perm._id },
          { roleId: role._id, permissionId: perm._id },
          { upsert: true }
        );
        mappingCount++;
      }
    }
    console.log(`✨ Processed ${mappingCount} role-permission links`);

    console.log("\n✅ RBAC Seeding Completed Successfully!");

  } catch (error) {
    console.error("❌ RBAC Seed Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

seedRBAC();
