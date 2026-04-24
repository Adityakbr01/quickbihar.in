// ⭐ Set environment variables before any module loading
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";
process.env.IMAGEKIT_PUBLIC_KEY = "dummy_key";
process.env.IMAGEKIT_PRIVATE_KEY = "dummy_private_key";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/dummy";
process.env.RAZORPAY_KEY_ID = "dummy_razorpay_id";
process.env.RAZORPAY_KEY_SECRET = "dummy_razorpay_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "dummy_webhook_secret";
process.env.FIREBASE_PROJECT_ID = "dummy_project";
process.env.FIREBASE_CLIENT_EMAIL = "dummy@test.com";
process.env.FIREBASE_PRIVATE_KEY = "dummy_key";

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
mock.module("../config/redis.config", () => ({
    redis: {
        get: mock((key) => {
            if (key === "otp:otpuser@test.com") return "123456";
            if (key === "otp_cooldown:cooldown@test.com") return "true";
            return null;
        }),
        set: mock(() => Promise.resolve()),
        del: mock(() => Promise.resolve())
    }
}));
mock.module("../utils/mail.service", () => ({
    MailService: {
        sendOTP: mock(() => Promise.resolve(true)),
        sendApplicationStatus: mock(() => Promise.resolve(true))
    }
}));
mock.module("../config/db", () => ({ default: mock(() => Promise.resolve()) }));
mock.module("../config/imagekit.config", () => ({ imagekit: {} }));

// 2. Mock UserDAO & User Model behavior
mock.module("../modules/user/user.dao", () => ({
    UserDAO: {
        findByUsernameOrEmail: mock((username, email) => {
            if (email === "existing@test.com" || email === "otpuser@test.com") {
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
    getRole: mock(() => Promise.resolve({ _id: VALID_ID, name: "USER" })),
    assignUserToRole: mock(() => Promise.resolve()),
    getRolesByUser: mock(() => Promise.resolve([]))
}));

// 4. Delayed Import of App
const { app } = await import("../app");

describe("Authentication Routes", () => {

    test("POST /api/v1/auth/register (Success - Verification Needed)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                email: "newuser@test.com",
                password: "password123",
                fullName: "New User"
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toContain("verify your email");
        expect(res.body.data.accessToken).toBeUndefined();
    });

    test("POST /api/v1/auth/request-otp (Success)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/request-otp")
            .send({ email: "otpuser@test.com" });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("OTP sent");
    });

    test("POST /api/v1/auth/request-otp (Cooldown Error)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/request-otp")
            .send({ email: "cooldown@test.com" });

        expect(res.status).toBe(429);
        expect(res.body.message).toContain("Too many requests");
    });

    test("POST /api/v1/auth/login (Unverified Failure - Triggers OTP)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "otpuser@test.com", password: "password123" });

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Email not verified");
    });

    test("POST /api/v1/auth/verify-otp (Success)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/verify-otp")
            .send({ email: "otpuser@test.com", otp: "123456" });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.message).toContain("verified");
    });

    test("POST /api/v1/auth/verify-otp (Invalid OTP)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/verify-otp")
            .send({ email: "otpuser@test.com", otp: "wrong" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Invalid OTP");
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
