process.env.NODE_ENV = "test";
process.env.PORT = "8000";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_secret_key_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";
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

// Mock the Product model
const mockProducts = [
  {
    _id: "prod1",
    title: "Product 1",
    ratings: { average: 4.5, count: 10 },
    isTrending: true,
    isFeatured: false,
    createdAt: new Date("2026-01-01"),
    isActive: true,
    isDeleted: false
  },
  {
    _id: "prod2",
    title: "Product 2",
    ratings: { average: 4.8, count: 5 },
    isTrending: false,
    isFeatured: true,
    createdAt: new Date("2026-01-02"),
    isActive: true,
    isDeleted: false
  },
  {
    _id: "prod3",
    title: "Product 3",
    ratings: { average: 4.0, count: 2 },
    isTrending: false,
    isFeatured: false,
    createdAt: new Date("2026-01-03"),
    isActive: true,
    isDeleted: false
  }
];

mock.module("../modules/products/product.model", () => ({
  Product: {
    find: mock((query: any) => {
      let result = [...mockProducts];
      if (query._id && query._id.$in) {
        result = result.filter(p => query._id.$in.includes(p._id));
      } else if (query._id && query._id.$nin) {
        result = result.filter(p => !query._id.$nin.includes(p._id));
      }
      return {
        sort: mock(() => ({
          limit: mock(() => Promise.resolve(result))
        })),
        then: (cb: any) => Promise.resolve(result).then(cb)
      };
    })
  }
}));

// Mock Mongoose model method
mock.module("mongoose", () => {
  const actual = require("mongoose");
  return {
    ...actual,
    model: mock((name: string) => {
      if (name === "Order") {
        return {
          aggregate: mock(() => Promise.resolve([
            { _id: "prod1", salesCount: 15 },
            { _id: "prod3", salesCount: 5 }
          ]))
        };
      }
      return actual.model(name);
    })
  };
});

import * as ProductDAO from "../modules/products/product.dao";

describe("Top Selling Products API", () => {
  test("getTopSellingProducts should retrieve, aggregate and sort correctly", async () => {
    const result = await ProductDAO.getTopSellingProducts(10);
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);

    // prod1 should be first because it has 15 sales
    expect(result.data[0]._id).toBe("prod1");
    // prod3 should be second because it has 5 sales
    expect(result.data[1]._id).toBe("prod3");
    // prod2 should be third because it has 0 sales but fallback picks it up
    expect(result.data[2]._id).toBe("prod2");
  });
});
