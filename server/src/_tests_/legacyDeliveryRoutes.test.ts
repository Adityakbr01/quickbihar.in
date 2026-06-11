process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";

import express from "express";
import request from "supertest";
import { describe, expect, mock, test } from "bun:test";

const pass = (req: any, _res: any, next: any) => {
  req.user = { _id: "645a2c2b8f8f2b1a2c3d4e5f", roleId: { name: "ADMIN", _id: "ADMIN" } };
  next();
};

mock.module("../middlewares/auth.middleware", () => ({
  verifyJWT: pass,
  isAdmin: pass,
  isDelivery: pass,
}));

const { default: orderRouter } = await import("../modules/order/order.router");
const { default: deliveryRouter } = await import("../modules/delivery/delivery.router");

const app = express();
app.use(express.json());
app.use("/orders", orderRouter);
app.use("/delivery", deliveryRouter);

describe("legacy parent-order delivery routes", () => {
  test("returns 410 for admin parent-order delivery assignment", async () => {
    const response = await request(app)
      .patch("/orders/admin/645a2c2b8f8f2b1a2c3d4e6f/delivery-assignment")
      .send({ deliveryUserId: "645a2c2b8f8f2b1a2c3d4e70" });
    const deleteResponse = await request(app)
      .delete("/orders/admin/645a2c2b8f8f2b1a2c3d4e6f/delivery-assignment");

    expect(response.status).toBe(410);
    expect(deleteResponse.status).toBe(410);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Legacy parent-order delivery mutations are retired");
  });

  test("returns 410 for rider parent-order status and location mutations", async () => {
    const statusResponse = await request(app)
      .patch("/delivery/orders/645a2c2b8f8f2b1a2c3d4e6f/status")
      .send({ action: "DELIVERED", otp: "123456" });
    const locationResponse = await request(app)
      .post("/delivery/orders/645a2c2b8f8f2b1a2c3d4e6f/location")
      .send({ latitude: 25.6, longitude: 85.1 });

    expect(statusResponse.status).toBe(410);
    expect(locationResponse.status).toBe(410);
    expect(statusResponse.body.data.replacement).toBe("/api/v1/delivery/sub-orders/:id/*");
  });
});
