process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Types } from "mongoose";

const ORDER_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e6f");
const SUB_ORDER_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e7f");
const SELLER_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e8f");
const STORE_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e9f");

let parentOrder: any;
let earningByKey = new Map<string, any>();
let subOrderRows: any[] = [];
let earningRows: any[] = [];

const singleQueryMock = (value: any) => {
  const query: any = {
    select: mock(() => query),
    lean: mock(() => Promise.resolve(value)),
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return query;
};

const listQueryMock = (value: any[]) => {
  const query: any = {
    populate: mock(() => query),
    sort: mock(() => query),
    limit: mock(() => query),
    select: mock(() => query),
    lean: mock(() => Promise.resolve(value)),
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return query;
};

const orderFindById = mock(() => singleQueryMock(parentOrder));
const sellerUpdateOne = mock(() => Promise.resolve({ matchedCount: 1, modifiedCount: 1 }));
const earningFindOne = mock((filter: any) => singleQueryMock(earningByKey.get(filter?.idempotencyKey) || null));
const earningCreate = mock((payload: any) => {
  const earning = { _id: new Types.ObjectId(), ...payload };
  earningByKey.set(payload.idempotencyKey, earning);
  return Promise.resolve(earning);
});
const earningFind = mock(() => listQueryMock(earningRows));
const subOrderFind = mock(() => listQueryMock(subOrderRows));

mock.module("../modules/order/order.model", () => ({
  Order: {
    findById: orderFindById,
  },
}));

mock.module("../modules/order/subOrder.model", () => ({
  SubOrderStatus: {
    DELIVERED: "DELIVERED",
    DELIVERY_CONFIRMED: "DELIVERY_CONFIRMED",
    COMPLETED: "COMPLETED",
  },
  SubOrder: {
    find: subOrderFind,
  },
}));

mock.module("../modules/seller/seller.model", () => ({
  Seller: {
    updateOne: sellerUpdateOne,
  },
}));

mock.module("../modules/seller/sellerPanel.model", () => ({
  SellerEarning: {
    findOne: earningFindOne,
    create: earningCreate,
    find: earningFind,
  },
}));

const { sellerSettlementService } = await import("../modules/seller/sellerSettlement.service");

const deliveredSubOrder = (overrides: any = {}) => ({
  _id: SUB_ORDER_ID,
  subOrderId: "QB-TEST-S1",
  parentOrderId: ORDER_ID,
  sellerId: SELLER_ID,
  storeId: STORE_ID,
  status: "DELIVERED",
  subtotal: 1000,
  platformCommission: 120,
  sellerNet: 880,
  payableAmount: 1000,
  delivery: { status: "DELIVERED" },
  items: [{ quantity: 2, sellerSubtotal: 1000 }],
  ...overrides,
});

describe("SellerSettlementService", () => {
  beforeEach(() => {
    parentOrder = { _id: ORDER_ID, orderId: "QB-TEST" };
    earningByKey = new Map();
    subOrderRows = [];
    earningRows = [];
    orderFindById.mockClear();
    sellerUpdateOne.mockClear();
    earningFindOne.mockClear();
    earningCreate.mockClear();
    earningFind.mockClear();
    subOrderFind.mockClear();
  });

  test("credits seller wallet once for a delivered sub-order", async () => {
    const result = await sellerSettlementService.settleSubOrder(deliveredSubOrder(), {
      source: "RIDER_DELIVERY",
    });

    expect(result.settled).toBe(true);
    expect(result.amount).toBe(880);
    expect(earningCreate).toHaveBeenCalledTimes(1);
    const createdPayload = (earningCreate.mock.calls[0] as any[])[0];
    expect(createdPayload).toMatchObject({
      orderId: "QB-TEST",
      subOrderId: "QB-TEST-S1",
      idempotencyKey: `seller-suborder:${SUB_ORDER_ID.toString()}`,
      grossAmount: 1000,
      commissionAmount: 120,
      netAmount: 880,
      settlementSource: "RIDER_DELIVERY",
    });
    expect(sellerUpdateOne).toHaveBeenCalledWith(
      { userId: SELLER_ID },
      {
        $inc: {
          "wallet.availableBalance": 880,
          "wallet.lifetimeEarnings": 880,
        },
      },
    );
  });

  test("does not double-credit an already settled sub-order", async () => {
    earningByKey.set(`seller-suborder:${SUB_ORDER_ID.toString()}`, {
      idempotencyKey: `seller-suborder:${SUB_ORDER_ID.toString()}`,
      netAmount: 880,
    });

    const result = await sellerSettlementService.settleSubOrder(deliveredSubOrder());

    expect(result.settled).toBe(false);
    expect(result.alreadySettled).toBe(true);
    expect(result.reason).toBe("ALREADY_SETTLED");
    expect(earningCreate).not.toHaveBeenCalled();
    expect(sellerUpdateOne).not.toHaveBeenCalled();
  });

  test("settles delivered sub-orders for a parent order without legacy fallback", async () => {
    subOrderRows = [deliveredSubOrder(), deliveredSubOrder({
      _id: new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e80"),
      subOrderId: "QB-TEST-S2",
      sellerNet: 250,
      subtotal: 300,
      platformCommission: 50,
    })];

    const result = await sellerSettlementService.settleDeliveredSubOrdersForOrder(ORDER_ID, {
      source: "ADMIN_DELIVERY",
    });

    expect(result.found).toBe(2);
    expect(result.settled).toBe(2);
    expect(result.amount).toBe(1130);
    expect(earningCreate).toHaveBeenCalledTimes(2);
    expect(sellerUpdateOne).toHaveBeenCalledTimes(2);
  });

  test("reports delivered sub-orders missing seller settlements", async () => {
    subOrderRows = [deliveredSubOrder(), deliveredSubOrder({
      _id: new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e80"),
      subOrderId: "QB-TEST-S2",
      sellerNet: 250,
    })];
    earningRows = [{ subOrderObjectId: SUB_ORDER_ID }];

    const report = await sellerSettlementService.missingDeliveredSubOrderSettlements({ limit: 100 });

    expect(report.scanned).toBe(2);
    expect(report.missing).toBe(1);
    expect(report.totalNetAmount).toBe(250);
    expect(report.rows[0]).toMatchObject({
      subOrderId: "QB-TEST-S2",
      netAmount: 250,
    });
  });
});
