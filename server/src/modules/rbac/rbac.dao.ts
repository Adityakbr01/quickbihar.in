import { Types } from "mongoose";
import { Role, Permission, RolePermission } from "./rbac.model";
import { redis } from "../../config/redis.config";

// ⭐ REDIS CACHING KEYS (Optional)
const REDIS_KEY_PREFIX = "rbac:role_perm:";
const ROLE_PERMISSION_CACHE_KEY = (roleId: string) => `${REDIS_KEY_PREFIX}${roleId}`;
const CACHE_TTL = 60 * 60 * 24; // 24 hours

// ⭐ Permission-Role Logic
export const rolePermissionDao = {
  // Get cached permissions for a role (populates cache if missing)
  async getCachedPermissions(roleId: string): Promise<Record<string, string>> {
    try {
      const key = ROLE_PERMISSION_CACHE_KEY(roleId);
      let cache = await redis.hgetall(key);

      // If empty or doesn't have the "meta" field, fetch from DB
      if (!cache || Object.keys(cache).length === 0 || !cache["_populated"]) {
        const rolePermissions = await RolePermission.find({ roleId }).populate("permissionId").lean();
        
        const mapping: Record<string, string> = { "_populated": "1" };
        rolePermissions.forEach((rp: any) => {
          if (rp.permissionId && rp.permissionId.code) {
            mapping[rp.permissionId.code] = "1";
          }
        });

        await redis.hset(key, mapping);
        await redis.expire(key, CACHE_TTL);
        cache = mapping;
      }

      // Remove meta field before returning
      const { _populated, ...validPermissions } = cache;
      return validPermissions;
    } catch (error) {
      console.error("Redis getCachedPermissions Error:", error);
      return {};
    }
  },

  // Clear cache when role changes
  async invalidateCache(roleId: string | string[]): Promise<void> {
    try {
      const ids = Array.isArray(roleId) ? roleId : [roleId];
      if (ids.length === 0) return;
      
      const keys = ids.map(id => ROLE_PERMISSION_CACHE_KEY(id));
      await redis.del(...keys);
    } catch (error) {
      console.error("Redis invalidateCache Error:", error);
    }
  },

  // Check if role has permission
  async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
    const key = ROLE_PERMISSION_CACHE_KEY(roleId);

    // 1. Try to check if specific permission exists in hash
    const cachedValue = await redis.hget(key, permissionId);
    if (cachedValue === "1") return true;

    // 2. If not found, check if the key itself exists (to avoid multiple DB hits if role has NO permissions)
    const exists = await redis.exists(key);
    if (exists) return false;

    // 3. Fallback: Fetch ALL permissions for this role and populate cache
    const rolePermissions = await RolePermission.find({ roleId }).populate("permissionId").lean();
    
    if (rolePermissions.length === 0) {
      await redis.hset(key, { "_populated": "1" });
      await redis.expire(key, CACHE_TTL);
      return false;
    }

    const mapping: Record<string, string> = { "_populated": "1" };
    rolePermissions.forEach((rp: any) => {
      if (rp.permissionId && rp.permissionId.code) {
        mapping[rp.permissionId.code] = "1";
      }
    });

    await redis.hset(key, mapping);
    await redis.expire(key, CACHE_TTL);

    return !!mapping[permissionId];
  }
};

export const permissionDao = {
  async create(data: any): Promise<any> {
    const permission = await Permission.create(data);
    await this.invalidateCacheIfRoleExists(permission._id.toString());
    return permission;
  },

  async findById(id: string): Promise<any | null> {
    return Permission.findOne({ _id: id }).lean();
  },

  async findAll(filter?: Record<string, unknown>): Promise<any[]> {
    return Permission.find(filter || {}).lean();
  },

  async update(id: string, update: any): Promise<any> {
    const updated = await Permission.findByIdAndUpdate(id, update, { new: true }).lean();
    if (updated) await this.invalidateCacheIfRoleExists(id);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await Permission.deleteOne({ _id: id });
    await this.invalidateCacheIfRoleExists(id);
  },

  async invalidateCacheIfRoleExists(permissionId: string): Promise<void> {
    const rolePermission = await RolePermission.findOne({ permissionId }).lean();
    if (rolePermission) {
      await rolePermissionDao.invalidateCache(rolePermission.roleId.toString());
    }
  }
};

export const roleDao = {
  async create(data: any): Promise<any> {
    const role = await Role.create(data);
    return role;
  },

  async findById(id: string): Promise<any | null> {
    return Role.findOne({ _id: id }).lean();
  },

  async findAll(filter?: Record<string, unknown>): Promise<any[]> {
    return Role.find(filter || {}).lean();
  },

  async update(id: string, update: any): Promise<any> {
    const updated = await Role.findByIdAndUpdate(id, update, { new: true }).lean();
    if (updated) await rolePermissionDao.invalidateCache(id);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await Role.deleteOne({ _id: id });
    await rolePermissionDao.invalidateCache(id);
  }
};
