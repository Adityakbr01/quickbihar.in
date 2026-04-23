// ⭐ Set environment variables at the very beginning to satisfy Zod validation in env.config.ts
process.env.NODE_ENV = "test";
process.env.PORT = "8000";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_secret_key_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";
process.env.IMAGEKIT_PUBLIC_KEY = "dummy";
process.env.IMAGEKIT_PRIVATE_KEY = "dummy";
process.env.IMAGEKIT_URL_ENDPOINT = "dummy";
process.env.RAZORPAY_KEY_ID = "dummy";
process.env.RAZORPAY_KEY_SECRET = "dummy";
process.env.RAZORPAY_WEBHOOK_SECRET = "dummy";
process.env.FIREBASE_PROJECT_ID = "dummy";
process.env.FIREBASE_CLIENT_EMAIL = "dummy";
process.env.FIREBASE_PRIVATE_KEY = "dummy";

import { describe, expect, mock, test } from "bun:test";

// ⭐ Mock Modules
mock.module("../config/redis.config", () => ({
  redis: {
    hgetall: mock(() => Promise.resolve({})),
    hset: mock(() => Promise.resolve(1)),
    expire: mock(() => Promise.resolve(1)),
    del: mock(() => Promise.resolve(1)),
    hget: mock(() => Promise.resolve(null)),
    exists: mock(() => Promise.resolve(0)),
  }
}));

mock.module("../modules/rbac/rbac.middleware", () => ({
  validateRole: () => (req: any, res: any, next: any) => {
    req.user = { userId: "645a2c2b8f8f2b1a2c3d4e5f" };
    next();
  },
  validatePermission: () => (req: any, res: any, next: any) => next(),
  checkPermissions: () => (req: any, res: any, next: any) => next(),
}));

const VALID_ID = "645a2c2b8f8f2b1a2c3d4e5f";
mock.module("../modules/rbac/rbac.model", () => ({
  Permission: {
    create: mock((data) => Promise.resolve({ _id: VALID_ID, ...data })),
    findOne: mock(() => Promise.resolve(null)),
    find: mock(() => ({ lean: mock(() => Promise.resolve([])) })),
    deleteOne: mock(() => Promise.resolve({ deletedCount: 1 })),
    findByIdAndUpdate: mock(() => ({ lean: mock(() => Promise.resolve({ _id: VALID_ID })) })),
  },
  Role: {
    create: mock((data) => Promise.resolve({ _id: VALID_ID, ...data })),
    countDocuments: mock(() => Promise.resolve(0)),
    findOne: mock(() => Promise.resolve(null)),
    findByIdAndUpdate: mock(() => ({ lean: mock(() => Promise.resolve({ _id: VALID_ID })) })),
    deleteOne: mock(() => Promise.resolve({ deletedCount: 1 })),
    find: mock(() => ({ lean: mock(() => Promise.resolve([])) })),
  },
  RolePermission: {
    create: mock((data) => Promise.resolve({ _id: VALID_ID, ...data })),
    findOne: mock(() => ({ lean: mock(() => Promise.resolve(null)) })),
    find: mock(() => ({ lean: mock(() => Promise.resolve([])) })),
    countDocuments: mock(() => Promise.resolve(0)),
    deleteOne: mock(() => Promise.resolve({ deletedCount: 1 })),
  },
  UserRole: {
    create: mock((data) => Promise.resolve({ _id: VALID_ID, ...data })),
    findOne: mock(() => ({ lean: mock(() => Promise.resolve(null)) })),
    find: mock(() => ({ 
      populate: mock(() => ({ lean: mock(() => Promise.resolve([])) })) 
    })),
    deleteOne: mock(() => Promise.resolve({ deletedCount: 1 })),
    findByUser: mock(() => Promise.resolve([])),
  }
}));

// ⭐ Delayed imports to ensure env vars are set
import request from "supertest";
const { app } = await import("../app");
const rbacService = await import("../modules/rbac/rbac.service");

describe("RBAC Service Logic", () => {
  test("should create a permission via service", async () => {
    const permissionData = {
      code: "TEST_PERMISSION",
      module: "PRODUCT",
      domain: "GLOBAL"
    };

    const result = await rbacService.createPermission(permissionData as any);
    expect(result).toBeDefined();
    expect(result.code).toBe("TEST_PERMISSION");
  });
});

describe("RBAC Endpoints", () => {
  test("POST /api/v1/rbac/permissions should create permission", async () => {
    const res = await request(app)
      .post("/api/v1/rbac/permissions")
      .send({
        code: "SUPERTEST_PERM",
        module: "PRODUCT"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/v1/rbac/roles should fetch all roles", async () => {
    const res = await request(app).get("/api/v1/rbac/roles");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("POST /api/v1/rbac/user-roles/assign should assign role", async () => {
    const res = await request(app)
      .post("/api/v1/rbac/user-roles/assign")
      .send({
        userId: VALID_ID,
        roleId: VALID_ID
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/v1/rbac/user-roles/:userId should fetch user roles", async () => {
    const res = await request(app).get(`/api/v1/rbac/user-roles/${VALID_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
