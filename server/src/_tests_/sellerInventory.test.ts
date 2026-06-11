process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Types } from "mongoose";

const SELLER_ID = "645a2c2b8f8f2b1a2c3d4e5f";
const PRODUCT_ID = "645a2c2b8f8f2b1a2c3d4e6f";
const STORE_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e70");

let productDoc: any;

const productFindOne = mock(() => Promise.resolve(productDoc));
const movementCreate = mock((payload: any) => Promise.resolve({ _id: new Types.ObjectId(), ...payload }));
const notificationCreate = mock((payload: any) => Promise.resolve({ _id: new Types.ObjectId(), ...payload }));

mock.module("../modules/products/product.model", () => ({
  Product: {
    findOne: productFindOne,
  },
}));

mock.module("../modules/seller/sellerPanel.model", () => ({
  InventoryMovement: {
    create: movementCreate,
  },
  SellerNotification: {
    create: notificationCreate,
  },
  SellerCategoryRequest: {},
  SellerEarning: {},
}));

const { SellerService } = await import("../modules/seller/seller.service");
const { sellerStockUpdateSchema } = await import("../modules/seller/seller.validation");

const stockProduct = (stock = 3) => ({
  _id: new Types.ObjectId(PRODUCT_ID),
  storeId: STORE_ID,
  title: "Inventory Shirt",
  variants: [
    { sku: "INV-M-BLK", size: "M", color: "Black", stock },
    { sku: "INV-L-BLK", size: "L", color: "Black", stock: 2 },
  ],
  totalStock: stock + 2,
  markModified: mock(() => undefined),
  save: mock(() => Promise.resolve(undefined)),
});

describe("seller inventory stock updates", () => {
  beforeEach(() => {
    productDoc = stockProduct();
    productFindOne.mockClear();
    movementCreate.mockClear();
    notificationCreate.mockClear();
  });

  test("validates non-negative integer stock and cleans reason", () => {
    const parsed = sellerStockUpdateSchema.parse({
      productId: ` ${PRODUCT_ID} `,
      sku: " INV-M-BLK ",
      stock: "7",
      reason: "  Restock count  ",
    });

    expect(parsed).toEqual({
      productId: PRODUCT_ID,
      sku: "INV-M-BLK",
      stock: 7,
      reason: "Restock count",
    });
    expect(() => sellerStockUpdateSchema.parse({ productId: PRODUCT_ID, sku: "INV-M-BLK", stock: -1 })).toThrow();
    expect(() => sellerStockUpdateSchema.parse({ productId: PRODUCT_ID, sku: "INV-M-BLK", stock: 2.5 })).toThrow();
    expect(sellerStockUpdateSchema.parse({ productId: PRODUCT_ID, sku: "INV-M-BLK", stock: 1, reason: " " }).reason).toBeUndefined();
  });

  test("updates only an owned product variant and records a movement", async () => {
    const result = await SellerService.updateVariantStock(SELLER_ID, {
      productId: PRODUCT_ID,
      sku: "INV-M-BLK",
      stock: 8,
      reason: "Restock",
    });

    expect(productFindOne).toHaveBeenCalledWith({ _id: PRODUCT_ID, sellerId: SELLER_ID, isDeleted: false });
    expect(productDoc.variants[0].stock).toBe(8);
    expect(productDoc.totalStock).toBe(10);
    expect(productDoc.markModified).toHaveBeenCalledWith("variants");
    expect(productDoc.save).toHaveBeenCalled();
    expect(movementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: productDoc._id,
        sku: "INV-M-BLK",
        movementType: "IN",
        quantity: 5,
        previousStock: 3,
        newStock: 8,
        reason: "Restock",
      }),
    );
    expect(result.product).toBe(productDoc);
  });

  test("rejects stock update when the product is not owned by the seller", async () => {
    productDoc = null;

    await expect(
      SellerService.updateVariantStock(SELLER_ID, {
        productId: PRODUCT_ID,
        sku: "INV-M-BLK",
        stock: 8,
      }),
    ).rejects.toThrow("Product not found");

    expect(productFindOne).toHaveBeenCalledWith({ _id: PRODUCT_ID, sellerId: SELLER_ID, isDeleted: false });
    expect(movementCreate).not.toHaveBeenCalled();
  });
});
