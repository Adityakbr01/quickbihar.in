// ⭐ Set environment variables before any module loading
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";
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
import request from "supertest";

const VALID_ID = "645a2c2b8f8f2b1a2c3d4e5f";

// 1. Mock External Configs/Side-effects
mock.module("jsonwebtoken", () => ({
  default: {
    sign: mock(() => "mocked_token"),
    verify: mock((token) => {
        if (token === "valid_refresh_token") return { _id: VALID_ID };
        throw new Error("Invalid token");
    }),
  }
}));
mock.module("../config/redis.config", () => ({ redis: { hget: mock(), hset: mock(), del: mock() } }));
mock.module("../config/db", () => ({ default: mock(() => Promise.resolve()) }));
mock.module("../config/imagekit.config", () => ({ imagekit: {} }));

// 2. Mock UserDAO & User Model behavior
mock.module("../modules/user/user.dao", () => ({
  UserDAO: {
    findByUsernameOrEmail: mock((username, email) => {
        if (email === "existing@test.com") {
            return Promise.resolve({
                _id: VALID_ID,
                email,
                username: "existing",
                isPasswordCorrect: mock(() => Promise.resolve(true)),
                generateAccessToken: () => "valid_access_token",
                generateRefreshToken: () => "valid_refresh_token",
                save: mock(() => Promise.resolve())
            });
        }
        return Promise.resolve(null);
    }),
    createUser: mock((data) => Promise.resolve({
        _id: VALID_ID,
        ...data,
        isPasswordCorrect: mock(() => Promise.resolve(true)),
        generateAccessToken: () => "valid_access_token",
        generateRefreshToken: () => "valid_refresh_token",
        save: mock(() => Promise.resolve())
    })),
    findById: mock((id) => Promise.resolve({
        _id: id,
        email: "test@test.com",
        username: "test",
        refreshToken: "valid_refresh_token",
        generateAccessToken: () => "new_access_token",
        generateRefreshToken: () => "new_refresh_token",
        save: mock(() => Promise.resolve())
    })),
    updateById: mock(() => Promise.resolve({}))
  }
}));

// 3. Mock RBAC Service
mock.module("../modules/rbac/rbac.service", () => ({
  getRoleByName: mock(() => Promise.resolve({ _id: VALID_ID, name: "USER" })),
  assignUserToRole: mock(() => Promise.resolve()),
  getRolesByUser: mock(() => Promise.resolve([]))
}));

// 4. Delayed Import of App
const { app } = await import("../app");

describe("Authentication Routes", () => {
    
    test("POST /api/v1/auth/authenticate (Register New User)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/authenticate")
            .send({
                email: "newuser@test.com",
                password: "password123"
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe("newuser@test.com");
        expect(res.body.data.accessToken).toBeDefined();
    });

    test("POST /api/v1/auth/authenticate (Login Existing User)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/authenticate")
            .send({
                email: "existing@test.com",
                password: "password123"
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("logged in");
        expect(res.body.data.accessToken).toBeDefined();
    });

    test("POST /api/v1/auth/authenticate (Validation Failure)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/authenticate")
            .send({
                email: "invalid-email",
                password: "123"
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /api/v1/auth/refresh-token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/refresh-token")
            .set("Cookie", ["refreshToken=valid_refresh_token"])
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
    });

    test("POST /api/v1/auth/logout (Requires Auth)", async () => {
        const res = await request(app).post("/api/v1/auth/logout");
        expect(res.status).toBe(401);
    });
});
