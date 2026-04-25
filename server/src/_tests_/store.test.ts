// ⭐ Set environment variables before any module loading
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";

import { describe, expect, mock, test } from "bun:test";
import request from "supertest";

const VALID_USER_ID = "645a2c2b8f8f2b1a2c3d4e5f";
const VALID_STORE_ID = "645a2c2b8f8f2b1a2c3d4e6f";

// 1. Mock Authentication & Middleware Dependencies
mock.module("jsonwebtoken", () => ({
    default: {
        verify: mock(() => ({ _id: VALID_USER_ID })),
    }
}));

mock.module("../modules/user/user.dao", () => ({
    UserDAO: {
        findById: mock(() => Promise.resolve({
            _id: VALID_USER_ID,
            roleId: { _id: "role_id" }
        }))
    }
}));

// Mock RBAC to bypass requirePermission and other auth middlewares
mock.module("../middlewares/auth.middleware", () => {
    const pass = (req: any, res: any, next: any) => next();
    return {
        verifyJWT: async (req: any, res: any, next: any) => {
            req.user = { _id: VALID_USER_ID, roleId: { name: "SELLER" } };
            next();
        },
        checkPermissions: () => pass,
        validateRole: () => pass,
        validatePermission: () => pass,
        isAdmin: pass,
        isSuperAdmin: pass,
        isSeller: pass,
        isDelivery: pass,
        isSellerOrAdmin: pass
    };
});

// Mock Seller Model for createStore validation
mock.module("../modules/seller/seller.model", () => ({
    Seller: {
        findOne: mock((query: any) => {
            if (query.userId === VALID_USER_ID) {
                return Promise.resolve({
                    userId: VALID_USER_ID,
                    sellerType: "CLOTHING"
                });
            }
            return Promise.resolve(null);
        })
    }
}));

// 2. Mock Store DAO
mock.module("../modules/store/store.dao", () => ({
    createStoreDAO: mock((data) => Promise.resolve({
        _id: VALID_STORE_ID,
        ...data
    })),
    createStoreConfigDAO: mock(() => Promise.resolve({})),
    updateStoreDAO: mock((id, data) => Promise.resolve({
        _id: id,
        ...data,
        type: "CLOTHING"
    })),
    updateStoreConfigDAO: mock(() => Promise.resolve({})),
    getNearbyStoresDAO: mock(() => Promise.resolve([
        { _id: VALID_STORE_ID, name: "Nearby Store" }
    ])),
    getStoreByIdDAO: mock((id) => Promise.resolve(
        id === VALID_STORE_ID ? { _id: id, type: "CLOTHING", name: "Test Store", toObject: () => ({ _id: id, type: "CLOTHING", name: "Test Store" }) } : null
    )),
    getStoresBySellerDAO: mock(() => Promise.resolve([
        { _id: VALID_STORE_ID, name: "My Store" }
    ])),
    getStoreConfigDAO: mock(() => Promise.resolve({ hasTrial: true }))
}));

// 3. Import App
const { app } = await import("../app");

describe("Store Routes", () => {

    test("GET /api/v1/stores/nearby (Success)", async () => {
        const res = await request(app)
            .get("/api/v1/stores/nearby?lng=85.1&lat=25.6&radius=5");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.message).toContain("Nearby stores fetched successfully");
    });

    test("GET /api/v1/stores/nearby (Validation Error)", async () => {
        const res = await request(app)
            .get("/api/v1/stores/nearby");

        expect(res.status).toBe(400); // Missing lng/lat
    });

    test("GET /api/v1/stores/:id (Success)", async () => {
        const res = await request(app).get(`/api/v1/stores/${VALID_STORE_ID}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Test Store");
        expect(res.body.data.config.hasTrial).toBe(true);
    });

    test("GET /api/v1/stores/:id (Not Found)", async () => {
        const res = await request(app).get("/api/v1/stores/invalid_id");

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test("POST /api/v1/stores (Success)", async () => {
        const res = await request(app)
            .post("/api/v1/stores")
            .set("Authorization", "Bearer mocked_token")
            .send({
                name: "New Clothing Store",
                type: "CLOTHING",
                address: {
                    line1: "123 Street",
                    city: "Patna",
                    state: "Bihar",
                    pincode: "800001"
                },
                currentLocation: {
                    lng: 85.1,
                    lat: 25.6
                },
                timings: [],
                deliveryRadiusKm: 5,
                minOrderAmount: 100,
                deliveryFee: 10,
                config: {
                    availableBrands: ["Nike"],
                    returnDays: 7
                }
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("New Clothing Store");
    });

    test("POST /api/v1/stores (Validation Error - Type Mismatch)", async () => {
        // Seller type is "CLOTHING" in mock, trying to create "FOOD" should fail validation
        // Wait, the Zod schema checks the shape, then the service checks type match.
        const res = await request(app)
            .post("/api/v1/stores")
            .set("Authorization", "Bearer mocked_token")
            .send({
                name: "New Food Store",
                type: "FOOD",
                address: {
                    line1: "123 Street",
                    city: "Patna",
                    state: "Bihar",
                    pincode: "800001"
                },
                currentLocation: {
                    lng: 85.1,
                    lat: 25.6
                },
                timings: [],
                deliveryRadiusKm: 5,
                minOrderAmount: 100,
                deliveryFee: 10
            });

        // The error comes from ApiError(400, "You are registered as a CLOTHING seller. You cannot create a FOOD store.")
        expect(res.status).toBe(400);
    });

    test("PATCH /api/v1/stores/:id (Success)", async () => {
        const res = await request(app)
            .patch(`/api/v1/stores/${VALID_STORE_ID}`)
            .set("Authorization", "Bearer mocked_token")
            .send({
                name: "Updated Store Name"
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Updated Store Name");
    });

    test("PATCH /api/v1/stores/:id/status (Success)", async () => {
        const res = await request(app)
            .patch(`/api/v1/stores/${VALID_STORE_ID}/status`)
            .set("Authorization", "Bearer mocked_token")
            .send({
                isOpen: true
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.isOpen).toBe(true);
    });
});
