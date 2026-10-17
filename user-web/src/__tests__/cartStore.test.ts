import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/api/axiosInstance", () => ({ default: {} }));
vi.mock("@/src/features/common/auth/store/authStore", () => ({
  useAuthStore: {},
}));
vi.mock("@/src/lib/secureZustandStorage", () => ({
  secureZustandStorage: {},
}));
vi.mock("@/src/analytics/googleAnalytics", () => ({
  trackAddToCartLine: vi.fn(),
  trackRemoveFromCartLine: vi.fn(),
}));

import {
  resolveCartItemModule,
  filterItemsByModule,
  totalsForItems,
  pickCouponItems,
} from "../features/common/cart/store/cartStore";
import type { CartItem } from "../features/common/cart/store/cartStore";
import { ICoupon } from "../features/common/coupon/types/coupon.types";

describe("Cart Domain Calculations", () => {
  const sampleClothingItem: CartItem = {
    productId: "prod_clothing_1",
    sku: "SKU-CLOTH-M",
    quantity: 2,
    price: 499,
    taxAmount: 25,
    sellerId: "seller_clothing_123",
    module: "clothing",
  };

  const sampleJeweleryItem: CartItem = {
    productId: "prod_jewel_1",
    sku: "SKU-JEWEL-GOLD",
    quantity: 1,
    price: 2499,
    taxAmount: 75,
    sellerId: "seller_jewel_456",
    module: "jewelery",
  };

  const unclassifiedItem: CartItem = {
    productId: "prod_legacy_1",
    sku: "SKU-LEGACY",
    quantity: 1,
    price: 199,
  };

  describe("resolveCartItemModule", () => {
    it("preserves explicit module tagging", () => {
      expect(resolveCartItemModule(sampleClothingItem)).toBe("clothing");
      expect(resolveCartItemModule(sampleJeweleryItem)).toBe("jewelery");
    });

    it("defaults unclassified or legacy items to clothing", () => {
      expect(resolveCartItemModule(unclassifiedItem)).toBe("clothing");
      expect(resolveCartItemModule({ module: undefined })).toBe("clothing");
    });
  });

  describe("filterItemsByModule", () => {
    it("partitions items cleanly between clothing and jewelery storefronts", () => {
      const allItems = [sampleClothingItem, sampleJeweleryItem, unclassifiedItem];

      const clothingItems = filterItemsByModule(allItems, "clothing");
      expect(clothingItems).toHaveLength(2);
      expect(clothingItems.map((i) => i.productId)).toEqual([
        "prod_clothing_1",
        "prod_legacy_1",
      ]);

      const jeweleryItems = filterItemsByModule(allItems, "jewelery");
      expect(jeweleryItems).toHaveLength(1);
      expect(jeweleryItems[0].productId).toBe("prod_jewel_1");
    });
  });

  describe("totalsForItems", () => {
    it("calculates subtotals, tax, and item count accurately", () => {
      const items = [sampleClothingItem, sampleJeweleryItem];
      const totals = totalsForItems(items);

      // (499 * 2) + (2499 * 1) = 998 + 2499 = 3497
      expect(totals.subtotal).toBe(3497);
      // (25 * 2) + (75 * 1) = 50 + 75 = 125
      expect(totals.totalTax).toBe(125);
      expect(totals.itemCount).toBe(2);
    });

    it("returns zero for an empty cart", () => {
      const totals = totalsForItems([]);
      expect(totals.subtotal).toBe(0);
      expect(totals.totalTax).toBe(0);
      expect(totals.itemCount).toBe(0);
    });
  });

  describe("pickCouponItems", () => {
    const globalCoupon: ICoupon = {
      _id: "coupon_global",
      code: "FESTIVE10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 500,
      appliesTo: "ALL",
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      currentUses: 0,
    } as any;

    const sellerSpecificCoupon: ICoupon = {
      _id: "coupon_seller",
      code: "SELLER20",
      sellerId: "seller_clothing_123" as any,
      discountType: "FIXED",
      discountValue: 100,
      appliesTo: "ALL",
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      currentUses: 0,
    } as any;

    it("applies a global coupon across all matching items", () => {
      const coverage = pickCouponItems(globalCoupon, [
        sampleClothingItem,
        sampleJeweleryItem,
      ]);
      expect(coverage).toHaveLength(2);
      expect(coverage[0].sku).toBe("SKU-CLOTH-M");
      expect(coverage[0].lineSubtotal).toBe(998);
      expect(coverage[1].sku).toBe("SKU-JEWEL-GOLD");
      expect(coverage[1].lineSubtotal).toBe(2499);
    });

    it("isolates seller-specific coupons so competitor items are not discounted", () => {
      const coverage = pickCouponItems(sellerSpecificCoupon, [
        sampleClothingItem,
        sampleJeweleryItem,
      ]);
      // Only clothing item matches sellerId "seller_clothing_123"
      expect(coverage).toHaveLength(1);
      expect(coverage[0].sku).toBe("SKU-CLOTH-M");
      expect(coverage[0].lineSubtotal).toBe(998);
    });
  });
});
