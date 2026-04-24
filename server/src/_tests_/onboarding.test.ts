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

import { describe, expect, mock, test, beforeAll } from "bun:test";
import request from "supertest";
import { Types } from "mongoose";

const USER_ID = new Types.ObjectId().toString();
const ADMIN_ID = new Types.ObjectId().toString();
const APP_ID = new Types.ObjectId().toString();

// 1. Mock External Configs
mock.module("../config/db", () => ({ default: mock(() => Promise.resolve()) }));
mock.module("../config/redis.config", () => ({ redis: { get: mock(), set: mock(), del: mock() } }));
mock.module("../utils/mail.service", () => ({
    MailService: {
        sendApplicationStatus: mock(() => Promise.resolve(true))
    }
}));
mock.module("../modules/notification/notification.service", () => ({
    notificationService: {
        sendPush: mock(() => Promise.resolve("mocked_id")),
        sendToTopic: mock(() => Promise.resolve("mocked_id"))
    }
}));

// 2. Mock Models
mock.module("../modules/user/onboarding.model", () => {
    const mockApplication = {
        _id: APP_ID,
        userId: { _id: USER_ID, email: "test@test.com" },
        type: "SELLER",
        status: "PENDING",
        details: new Map([["businessName", "Test Shop"]]),
        save: mock(() => Promise.resolve())
    };

    const createQueryMock = (data: any) => {
        const query: any = Promise.resolve(data);
        query.sort = mock(() => createQueryMock(data));
        query.populate = mock(() => createQueryMock(data));
        return query;
    };

    return {
        Application: {
            create: mock((data) => Promise.resolve({ _id: APP_ID, ...data })),
            findOne: mock(() => Promise.resolve(null)),
            find: mock(() => createQueryMock([mockApplication])),
            findById: mock(() => createQueryMock(mockApplication))
        },
        ApplicationType: { SELLER: "SELLER", RIDER: "RIDER" },
        ApplicationStatus: { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" }
    };
});

mock.module("../modules/seller/seller.model", () => ({
    Seller: {
        create: mock(() => Promise.resolve({}))
    }
}));

mock.module("../modules/deliveryBoy/delivery.model", () => ({
    DeliveryBoy: {
        create: mock(() => Promise.resolve({}))
    }
}));

mock.module("../modules/user/user.model", () => ({
    User: {
        findById: mock(() => Promise.resolve({ _id: USER_ID }))
    }
}));

// 3. Mock RBAC Service
mock.module("../modules/rbac/rbac.service", () => ({
    getRoleByName: mock(() => Promise.resolve({ _id: "role_id", name: "SELLER" })),
    assignUserToRole: mock(() => Promise.resolve()),
    getRolesByUser: mock((userId) => {
        if (userId === ADMIN_ID) return Promise.resolve([{ roleId: { name: "ADMIN", _id: "admin_role_id" } }]);
        return Promise.resolve([{ roleId: { name: "USER", _id: "user_role_id" } }]);
    }),
    getPermissionsByRole: mock(() => Promise.resolve({}))
}));

// 4. Mock Auth Middleware
mock.module("../middlewares/auth.middleware", () => ({
    verifyJWT: (req: any, res: any, next: any) => {
        req.user = { _id: req.headers.isadmin === "true" ? ADMIN_ID : USER_ID };
        next();
    },
    isAdmin: (req: any, res: any, next: any) => {
        if (req.headers.isadmin === "true") return next();
        res.status(403).json({ message: "Access denied" });
    },
    isSuperAdmin: (req: any, res: any, next: any) => next(),
    isSeller: (req: any, res: any, next: any) => next(),
    isDelivery: (req: any, res: any, next: any) => next(),
    isSellerOrAdmin: (req: any, res: any, next: any) => next(),
    validateRole: () => (req: any, res: any, next: any) => next(),
    validatePermission: () => (req: any, res: any, next: any) => next(),
    checkPermissions: () => (req: any, res: any, next: any) => next(),
}));

const { app } = await import("../app");

describe("Onboarding Module Tests", () => {

    test("POST /api/v1/onboarding/apply (Submit Application)", async () => {
        const res = await request(app)
            .post("/api/v1/onboarding/apply")
            .send({
                type: "SELLER",
                details: { businessName: "My Shop", sellerType: "CLOTHING" },
                documents: [{ name: "PAN", url: "http://pan.jpg", fileId: "123" }]
            });

        expect(res.status).toBe(201);
        expect(res.body.data.type).toBe("SELLER");
    });

    test("GET /api/v1/onboarding/my-applications", async () => {
        const res = await request(app).get("/api/v1/onboarding/my-applications");
        expect(res.status).toBe(200);
        expect(res.body.data).toBeInstanceOf(Array);
    });

    test("GET /api/v1/onboarding/admin/applications (Admin Only - Failure)", async () => {
        const res = await request(app).get("/api/v1/onboarding/admin/applications");
        expect(res.status).toBe(403);
    });

    test("GET /api/v1/onboarding/admin/applications (Admin Only - Success)", async () => {
        const res = await request(app)
            .get("/api/v1/onboarding/admin/applications")
            .set("isadmin", "true");

        expect(res.status).toBe(200);
    });

    test("PATCH /api/v1/onboarding/admin/applications/:id/review (Approve)", async () => {
        const res = await request(app)
            .patch(`/api/v1/onboarding/admin/applications/${APP_ID}/review`)
            .set("isadmin", "true")
            .send({ status: "APPROVED" });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("APPROVED");
    });
});
