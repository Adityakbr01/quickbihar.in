process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";

import { describe, expect, mock, test } from "bun:test";
import { Types } from "mongoose";
import { idString, toObjectId } from "../utils/id.util";

mock.module("axios", () => ({
  default: {
    get: mock(() => Promise.resolve({ data: {} })),
  },
}));

const SELLER_OBJECT_ID = new Types.ObjectId("6a808f16a011bd545c686e9f");
const STORE_OBJECT_ID = new Types.ObjectId("6a809190a011bd545c686ea8");
const PRODUCT_OBJECT_ID = new Types.ObjectId("6a809c8da011bd545c686f32");

describe("id.util", () => {
  test("idString correctly extracts string representation", () => {
    expect(idString(SELLER_OBJECT_ID)).toBe("6a808f16a011bd545c686e9f");
    expect(idString("6a808f16a011bd545c686e9f")).toBe("6a808f16a011bd545c686e9f");
    expect(idString({ _id: SELLER_OBJECT_ID, fullName: "Seller Test" })).toBe("6a808f16a011bd545c686e9f");
    expect(idString({ _id: "6a808f16a011bd545c686e9f" })).toBe("6a808f16a011bd545c686e9f");
    expect(idString(null)).toBe("");
    expect(idString(undefined)).toBe("");
  });

  test("toObjectId returns Types.ObjectId or undefined", () => {
    const objId = toObjectId({ _id: SELLER_OBJECT_ID });
    expect(objId).toBeInstanceOf(Types.ObjectId);
    expect(objId?.toString()).toBe("6a808f16a011bd545c686e9f");
    expect(toObjectId("invalid-id")).toBeUndefined();
    expect(toObjectId(null)).toBeUndefined();
  });
});

describe("Order Pricing with Populated Seller and Store Objects", () => {
  test("buildQuote produces valid hex sellerId and storeId in breakdowns, avoiding [object Object]", async () => {
    const populatedProduct = {
      _id: PRODUCT_OBJECT_ID,
      title: "Men Regular Fit Cotton T-Shirt",
      isActive: true,
      approvalStatus: "APPROVED",
      price: 499,
      isGstApplicable: false,
      sellerId: {
        _id: SELLER_OBJECT_ID,
        fullName: "Akshay Kumar",
        email: "seller@test.com",
        phone: "9798666046",
      },
      storeId: {
        _id: STORE_OBJECT_ID,
        name: "Akshay Kumar Business Name",
      },
      variants: [
        { sku: "QUI-CLO-WHITE-M", size: "M", color: "WHITE", stock: 10 },
      ],
      logistics: {
        latitude: 25.5834919,
        longitude: 84.152005,
      },
    };

    mock.module("../modules/clothing/products/product.dao", () => ({
      findById: mock(() => Promise.resolve(populatedProduct)),
    }));

    mock.module("../modules/common/store/store.model", () => ({
      Store: {
        find: mock(() => ({
          lean: () => Promise.resolve([
            {
              _id: STORE_OBJECT_ID,
              name: "Akshay Kumar Business Name",
              currentLocation: { coordinates: [84.152005, 25.5834919] },
            },
          ]),
        })),
      },
    }));

    mock.module("../modules/common/appConfig/appConfig.service", () => ({
      getConfig: mock(() => Promise.resolve({
        marketplace: { commissionPercent: 15 },
        shipping: { freeShippingThreshold: 900, shippingFee: 99 },
        delivery: {
          riderPayoutRules: { upto3Km: 25, upto5Km: 30, upto8Km: 45 },
          bonusRules: { rainBonus: 0, peakBonus: 0, festivalBonus: 0, nightBonus: 0 },
        },
      })),
    }));

    mock.module("../modules/common/coupon/coupon.service", () => ({
      validateMultipleCouponsForCart: mock(() => Promise.resolve([])),
    }));

    const { orderPricingService } = await import("../modules/common/order/orderPricing.service");

    const quote = await orderPricingService.buildQuote("user-123", {
      items: [{ productId: PRODUCT_OBJECT_ID.toString(), sku: "QUI-CLO-WHITE-M", quantity: 2 }],
      shippingAddress: {
        fullName: "Vidyawati Devi",
        phone: "9507712255",
        street: "Sasaram Road",
        city: "Naya Bhojpur",
        state: "Bihar",
        pincode: "802133",
        latitude: 25.5835162,
        longitude: 84.1522065,
      },
    });

    expect(quote.totalAmount).toBe(998);
    expect(quote.platformCommissionTotal).toBe(149.7);
    expect(quote.sellerBreakdowns.length).toBe(1);

    const breakdown = quote.sellerBreakdowns[0]!;
    expect(breakdown.sellerId).toBe("6a808f16a011bd545c686e9f");
    expect(breakdown.sellerId).not.toBe("[object Object]");
    expect(breakdown.platformCommission).toBe(149.7);
    expect(breakdown.sellerNet).toBe(848.3);
  });
});
