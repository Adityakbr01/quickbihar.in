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
process.env.GOOGLE_CLIENT_ID = "dummy_google_client";

import { describe, expect, mock, test } from "bun:test";
import request from "supertest";

const VALID_ID = "645a2c2b8f8f2b1a2c3d4e5f";
const RIDER_ID = "645a2c2b8f8f2b1a2c3d4e60";
const getRoleByName = mock((name: string = "USER") => Promise.resolve({ _id: VALID_ID, name }));
const assignUserToRole = mock(() => Promise.resolve());
const profileQuery = (value: any) => ({
    select: () => ({
        lean: () => Promise.resolve(value),
    }),
});

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
        get: mock(() => Promise.resolve(null)),
        set: mock(() => Promise.resolve()),
        del: mock(() => Promise.resolve())
    }
}));
const mockMailService = {
    MailService: {
        sendApplicationStatus: mock(() => Promise.resolve(true)),
        sendAdminInvite: mock(() => Promise.resolve(true)),
        sendPayoutNotice: mock(() => Promise.resolve(true)),
        sendResetPasswordLink: mock(() => Promise.resolve(true))
    }
};
mock.module("../utils/mail.service", () => mockMailService);
mock.module("@/utils/mail.service", () => mockMailService);
mock.module("../config/db", () => ({ default: mock(() => Promise.resolve()) }));
mock.module("../config/imagekit.config", () => ({ imagekit: {} }));

// Mock the Google OAuth verifier so the new /auth/google endpoint can
// be exercised in tests without real Google credentials.
mock.module("../modules/common/auth/googleOAuth.service", () => ({
    verifyGoogleIdToken: mock(() => Promise.resolve({
        sub: "google-sub-123",
        email: "google@test.com",
        email_verified: true,
        name: "Google User",
        picture: null,
    })),
}));

mock.module("../modules/common/user/user.model", () => ({
    User: {
        findOne: mock(() => Promise.resolve(null)),
    }
}));

// 2. Mock UserDAO & User Model behavior
mock.module("../modules/common/user/user.dao", () => ({
    UserDAO: {
        findByUsernameOrEmail: mock((username, email) => {
            if (email === "approvedrider@test.com") {
                return Promise.resolve({
                    _id: RIDER_ID,
                    email,
                    username: "approvedrider",
                    fullName: "Approved Rider",
                    isVerified: true,
                    roleId: null,
                    isPasswordCorrect: mock(() => Promise.resolve(true)),
                    generateAccessToken: () => "valid_access_token",
                    generateRefreshToken: () => "valid_refresh_token",
                    save: mock(() => Promise.resolve())
                });
            }
            if (email === "existing@test.com") {
                return Promise.resolve({
                    _id: VALID_ID,
                    email,
                    username: "existing",
                    fullName: "Existing User",
                    isVerified: true,
                    isPasswordCorrect: mock(() => Promise.resolve(true)),
                    generateAccessToken: () => "valid_access_token",
                    generateRefreshToken: () => "valid_refresh_token",
                    save: mock(() => Promise.resolve())
                });
            }
            return Promise.resolve(null);
        }),
        findByEmail: mock((email) => {
            if (email === "existing@test.com") {
                return Promise.resolve({
                    _id: VALID_ID,
                    email,
                    username: "existing",
                    fullName: "Existing User",
                    identities: [{ provider: "password", providerId: email }],
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
mock.module("../modules/common/rbac/rbac.service", () => ({
    getRoleByName,
    getRole: mock(() => Promise.resolve({ _id: VALID_ID, name: "USER" })),
    assignUserToRole,
    getRolesByUser: mock(() => Promise.resolve([]))
}));

mock.module("../modules/common/seller/seller.model", () => ({
    Seller: {
        findOne: mock(() => profileQuery(null)),
    }
}));

mock.module("../modules/common/deliveryBoy/delivery.model", () => ({
    DeliveryBoy: {
        findOne: mock((query) => profileQuery(query.userId?.toString?.() === RIDER_ID ? { _id: "delivery-profile" } : null)),
    }
}));

// 4. Delayed Import of App
const { app } = await import("../app");

describe("Authentication Routes (post-OTP cutover)", () => {

    test("POST /api/v1/auth/register (Success)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                email: "newuser@test.com",
                password: "password123",
                fullName: "New User"
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();
    });

    test("POST /api/v1/auth/login self-heals approved delivery role", async () => {
        assignUserToRole.mockClear();
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "approvedrider@test.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(res.body.data.user.role.name).toBe("DELIVERY");
        expect(assignUserToRole).toHaveBeenCalledWith(RIDER_ID, VALID_ID);
    });

    test("POST /api/v1/auth/google (New user)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/google")
            .send({ idToken: "mock_google_id_token", client: "web" });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.user.email).toBe("google@test.com");
    });

    test("POST /api/v1/auth/request-reset (Always 200)", async () => {
        const res = await request(app)
            .post("/api/v1/auth/request-reset")
            .send({ email: "anyuser@test.com" });

        expect(res.status).toBe(200);
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
