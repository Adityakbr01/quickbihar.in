process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Types } from "mongoose";
import { DeliveryStatus, OrderStatus } from "../modules/order/order.type";

const USER_ID = "645a2c2b8f8f2b1a2c3d4e5f";
const ORDER_ID = "645a2c2b8f8f2b1a2c3d4e6f";
const METHOD_ID = "645a2c2b8f8f2b1a2c3d4e71";
const SubOrderStatus = {
  RIDER_CANCELLED: "RIDER_CANCELLED",
  DELIVERED: "DELIVERED",
} as const;

let currentOrder: any;
let updatedOrder: any;
let currentProfile: any;
let subOrderRows: any[] = [];
let subOrderCount = 0;
let productRows = new Map<string, any>();
let storeRows: any[] = [];
let couponValidations: any[] = [];
let appConfigValue: any = { delivery: { riderPayoutAmount: 40 } };

const queryMock = (value: any) => {
  const query: any = {
    populate: mock(() => query),
    lean: mock(() => Promise.resolve(value)),
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return query;
};

const listQueryMock = (value: any[]) => {
  const query: any = {
    populate: mock(() => query),
    sort: mock(() => query),
    skip: mock(() => query),
    limit: mock(() => query),
    lean: mock(() => Promise.resolve(value)),
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return query;
};

const adminUpdateOrderStatus = mock(() => Promise.resolve({}));
const deliveryUpdateOne = mock(() => Promise.resolve({ modifiedCount: 1 }));
const deliveryFindOne = mock(() => queryMock(currentProfile));
const orderUpdateOne = mock(() => Promise.resolve({ modifiedCount: 1 }));
const payoutCreate = mock((payload) => Promise.resolve({
  _id: "payout-id",
  ...payload,
  populate: mock(() => Promise.resolve({ _id: "payout-id", ...payload })),
}));
const subOrderFind = mock(() => listQueryMock(subOrderRows));
const subOrderCountDocuments = mock(() => Promise.resolve(subOrderCount));
const productFindById = mock((id: string) => Promise.resolve(productRows.get(id) || null));
const couponValidateMultiple = mock(() => Promise.resolve(couponValidations));
const appConfigGetConfig = mock(() => Promise.resolve(appConfigValue));
const storeFind = mock(() => ({
  lean: mock(() => Promise.resolve(storeRows)),
}));

mock.module("../modules/order/order.service", () => ({
  orderService: {
    adminUpdateOrderStatus,
  },
}));

mock.module("../modules/order/order.model", () => ({
  Order: {
    findById: mock(() => queryMock(currentOrder)),
    findOne: mock(() => queryMock(null)),
    findByIdAndUpdate: mock(() => queryMock(updatedOrder)),
    countDocuments: mock(() => Promise.resolve(0)),
    updateOne: orderUpdateOne,
  },
}));

mock.module("../modules/deliveryBoy/delivery.model", () => ({
  DeliveryBoy: {
    findOne: deliveryFindOne,
    updateOne: deliveryUpdateOne,
  },
}));

mock.module("../modules/order/subOrder.model", () => ({
  SubOrder: {
    find: subOrderFind,
    countDocuments: subOrderCountDocuments,
  },
  SubOrderStatus,
}));

mock.module("../modules/admin/admin.model", () => ({
  AdminPayout: {
    create: payoutCreate,
    find: mock(() => ({ populate: () => ({ sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }) }) })),
    countDocuments: mock(() => Promise.resolve(0)),
  },
}));

mock.module("../modules/user/user.model", () => ({
  User: {
    updateOne: mock(() => Promise.resolve({ modifiedCount: 1 })),
  },
}));

mock.module("../modules/appConfig/appConfig.service", () => ({
  appConfigService: {
    getConfig: appConfigGetConfig,
  },
}));

mock.module("../modules/products/product.dao", () => ({
  ProductDAO: {
    findById: productFindById,
  },
}));

mock.module("../modules/coupon/coupon.service", () => ({
  couponService: {
    validateMultipleCouponsForCart: couponValidateMultiple,
    incrementUsage: mock(() => Promise.resolve(undefined)),
  },
}));

mock.module("../modules/store/store.model", () => ({
  Store: {
    find: storeFind,
  },
}));

mock.module("../modules/socket/socket.service", () => ({
  socketService: {
    emitToUser: mock(() => undefined),
    emitToOrderRoom: mock(() => undefined),
  },
}));

const { deliveryService } = await import("../modules/delivery/delivery.service");
const { calculateRiderPayout } = await import("../modules/order/subOrder.service");
const { orderPricingService } = await import("../modules/order/orderPricing.service");

const productForQuote = (overrides: any = {}) => ({
  _id: new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e81"),
  title: "Quote Shirt",
  price: 799,
  originalPrice: 799,
  isActive: true,
  approvalStatus: "APPROVED",
  isGstApplicable: false,
  gstPercentage: 0,
  sellerId: new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e82"),
  storeId: new Types.ObjectId("645a2c2b8f8f2b1a2c3d4e83"),
  variants: [{ sku: "QS-M-BLK", size: "M", color: "Black", stock: 10 }],
  logistics: { latitude: 25.5941, longitude: 85.1376 },
  ...overrides,
});

describe("DeliveryService", () => {
  beforeEach(() => {
    adminUpdateOrderStatus.mockClear();
    deliveryUpdateOne.mockClear();
    deliveryFindOne.mockClear();
    orderUpdateOne.mockClear();
    payoutCreate.mockClear();
    subOrderFind.mockClear();
    subOrderCountDocuments.mockClear();
    subOrderRows = [];
    subOrderCount = 0;
    productRows = new Map();
    storeRows = [];
    couponValidations = [];
    appConfigValue = { delivery: { riderPayoutAmount: 40 } };
    productFindById.mockClear();
    couponValidateMultiple.mockClear();
    appConfigGetConfig.mockClear();
    storeFind.mockClear();
    currentProfile = null;
    currentOrder = {
      _id: ORDER_ID,
      orderId: "QB-TEST",
      userId: { _id: "645a2c2b8f8f2b1a2c3d4e70" },
      status: OrderStatus.SHIPPED,
      shippingFee: 30,
      delivery: {
        partnerUserId: USER_ID,
        status: DeliveryStatus.ASSIGNED,
        otp: { code: "123456" },
      },
    };
    updatedOrder = {
      ...currentOrder,
      delivery: { ...currentOrder.delivery },
    };
  });

  test("rejects invalid delivery transitions", async () => {
    await expect(
      deliveryService.updateOrderStatus(USER_ID, ORDER_ID, { action: DeliveryStatus.PICKED_UP }),
    ).rejects.toThrow("Cannot move delivery from ASSIGNED to PICKED_UP");
  });

  test("requires the customer OTP before delivery completion", async () => {
    currentOrder.delivery.status = DeliveryStatus.OUT_FOR_DELIVERY;
    await expect(
      deliveryService.updateOrderStatus(USER_ID, ORDER_ID, { action: DeliveryStatus.DELIVERED, otp: "000000" }),
    ).rejects.toThrow("Valid delivery OTP is required");
  });

  test("marks delivered and credits rider earnings once OTP is valid", async () => {
    currentOrder.delivery.status = DeliveryStatus.OUT_FOR_DELIVERY;
    currentOrder.delivery.payoutAmount = 55;
    updatedOrder.delivery.status = DeliveryStatus.DELIVERED;
    updatedOrder.delivery.payoutAmount = 55;

    const result = await deliveryService.updateOrderStatus(USER_ID, ORDER_ID, {
      action: DeliveryStatus.DELIVERED,
      otp: "123456",
    });

    expect(result.delivery.status).toBe(DeliveryStatus.DELIVERED);
    expect(adminUpdateOrderStatus).toHaveBeenCalledWith(
      ORDER_ID,
      OrderStatus.DELIVERED,
      undefined,
      { allowUnverifiedDeliveryOtp: true },
    );
    expect(deliveryUpdateOne).toHaveBeenCalled();
    expect(orderUpdateOne).toHaveBeenCalled();
  });

  test("accepts assigned rider checks when authenticated user id is an ObjectId", async () => {
    currentOrder.delivery.partnerUserId = { _id: USER_ID };
    currentOrder.delivery.status = DeliveryStatus.ACCEPTED;
    updatedOrder.delivery.partnerUserId = { _id: USER_ID };
    updatedOrder.delivery.status = DeliveryStatus.ACCEPTED;

    const result = await deliveryService.updateOrderLocation(new Types.ObjectId(USER_ID) as any, ORDER_ID, {
      latitude: 25.6,
      longitude: 85.1,
    });

    expect(result.orderId).toBe("QB-TEST");
    expect(deliveryUpdateOne).toHaveBeenCalledWith(
      { userId: USER_ID },
      { $set: { currentLocation: { type: "Point", coordinates: [85.1, 25.6] } } },
    );
  });

  test("adds a payout method pending admin verification", async () => {
    const save = mock(() => Promise.resolve());
    currentProfile = {
      payoutMethods: [],
      save,
    };

    const method = await deliveryService.addPayoutMethod(USER_ID, {
      type: "UPI",
      label: "Main UPI",
      upi: { upiId: "rider@upi" },
    });

    expect(method.status).toBe("PENDING_VERIFICATION");
    expect(method.isDefault).toBe(true);
    expect(save).toHaveBeenCalled();
  });

  test("creates a rider payout request and reserves wallet balance", async () => {
    const save = mock(() => Promise.resolve());
    const verifiedMethod = {
      _id: { toString: () => METHOD_ID },
      type: "UPI",
      status: "VERIFIED",
      upi: { upiId: "rider@upi" },
    };
    const methods: any = [verifiedMethod];
    methods.id = (id: string) => id === METHOD_ID ? verifiedMethod : null;
    currentProfile = {
      wallet: { availableBalance: 120, pendingPayoutBalance: 0, lifetimeEarnings: 120 },
      payoutMethods: methods,
      save,
    };

    const payout = await deliveryService.createPayoutRequest(USER_ID, {
      amount: 70,
      payoutMethodId: METHOD_ID,
    });

    expect(currentProfile.wallet.availableBalance).toBe(50);
    expect(currentProfile.wallet.pendingPayoutBalance).toBe(70);
    expect(payout.partnerType).toBe("DELIVERY");
    expect(payoutCreate).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });

  test("creates a rider payout request with verified profile UPI", async () => {
    const save = mock(() => Promise.resolve());
    currentProfile = {
      status: "APPROVED",
      isVerified: true,
      userId: { _id: USER_ID, fullName: "Rider One", phone: "9999999999" },
      wallet: { availableBalance: 150, pendingPayoutBalance: 0, lifetimeEarnings: 150 },
      bankDetails: { upi: "rider@upi" },
      payoutMethods: { id: mock(() => null) },
      save,
    };

    const payout = await deliveryService.createPayoutRequest(USER_ID, {
      amount: 100,
      payoutMethodId: "PROFILE_UPI",
    });

    const payload = (payoutCreate.mock.calls[payoutCreate.mock.calls.length - 1] as any[])[0] as any;
    expect(currentProfile.wallet.availableBalance).toBe(50);
    expect(currentProfile.wallet.pendingPayoutBalance).toBe(100);
    expect(payload.method).toBe("Profile UPI - rider@upi");
    expect(payload.payoutMethodId).toBeUndefined();
    expect(payout.partnerType).toBe("DELIVERY");
    expect(save).toHaveBeenCalled();
  });

  test("calculates rider payout from configured slabs and active bonuses", () => {
    const payout = calculateRiderPayout(
      8.2,
      { rain: 1, peak: 0, festival: 0, night: 0 },
      {
        upto3Km: 22,
        upto5Km: 35,
        upto8Km: 50,
        extraPerKmAfter8: 7,
        rainBonus: 12,
      },
    );

    expect(payout.basePayout).toBe(57);
    expect(payout.totalPayout).toBe(69);
    expect(payout.bonuses.rain).toBe(12);
  });

  test("quotes free-shipping order with rider paid from platform commission", async () => {
    const product = productForQuote();
    productRows.set(product._id.toString(), product);
    appConfigValue = {
      shipping: { freeShippingThreshold: 1, shippingFee: 99 },
      marketplace: { commissionPercent: 15 },
      delivery: {
        riderPayoutRules: { upto3Km: 20, upto5Km: 30, upto8Km: 45, extraPerKmAfter8: 5 },
        bonusRules: {
          rainBonus: 12,
          peakBonus: 10,
          festivalBonus: 15,
          nightBonus: 8,
          rainMode: "FORCE_OFF",
          peakMode: "FORCE_OFF",
          festivalMode: "FORCE_OFF",
          nightMode: "FORCE_OFF",
        },
      },
    };

    const quote = await orderPricingService.buildQuote(USER_ID, {
      items: [{ productId: product._id.toString(), sku: "QS-M-BLK", quantity: 1 }],
      shippingAddress: {
        fullName: "Customer",
        phone: "9999999999",
        street: "Main Road",
        city: "Patna",
        state: "Bihar",
        pincode: "800001",
        latitude: 25.5942,
        longitude: 85.1377,
      },
    });

    expect(quote.payableAmount).toBe(799);
    expect(quote.shippingFee).toBe(0);
    expect(quote.dynamicDeliverySurcharge).toBe(0);
    expect(quote.platformCommissionTotal).toBe(119.85);
    expect(quote.riderPayoutEstimateTotal).toBe(20);
    expect(quote.appNetAfterRiderEstimate).toBe(99.85);
    expect(quote.sellerBreakdowns[0]?.sellerNet).toBe(679.15);
  });

  test("adds visible dynamic surcharge when delivery bonuses are active", async () => {
    const product = productForQuote();
    productRows.set(product._id.toString(), product);
    appConfigValue = {
      shipping: { freeShippingThreshold: 1, shippingFee: 99 },
      marketplace: { commissionPercent: 15 },
      delivery: {
        riderPayoutRules: { upto3Km: 20, upto5Km: 30, upto8Km: 45, extraPerKmAfter8: 5 },
        bonusRules: {
          rainBonus: 12,
          peakBonus: 10,
          festivalBonus: 15,
          nightBonus: 8,
          rainMode: "FORCE_ON",
          peakMode: "FORCE_ON",
          festivalMode: "FORCE_OFF",
          nightMode: "FORCE_OFF",
        },
      },
    };

    const quote = await orderPricingService.buildQuote(USER_ID, {
      items: [{ productId: product._id.toString(), sku: "QS-M-BLK", quantity: 1 }],
      shippingAddress: {
        fullName: "Customer",
        phone: "9999999999",
        street: "Main Road",
        city: "Patna",
        state: "Bihar",
        pincode: "800001",
        latitude: 25.5942,
        longitude: 85.1377,
      },
    });

    expect(quote.dynamicDeliverySurcharge).toBe(22);
    expect(quote.payableAmount).toBe(821);
    expect(quote.sellerBreakdowns[0]?.riderBonuses).toEqual({ rain: 12, peak: 10, festival: 0, night: 0 });
    expect(quote.riderPayoutEstimateTotal).toBe(42);
  });

  test("blocks offer acceptance until rider profile is complete and approved", async () => {
    currentProfile = {
      status: "PENDING",
      isVerified: false,
      userId: { _id: USER_ID, phone: "" },
      vehicleType: "",
      vehicleNumber: "",
      licenseNumber: "",
      address: {},
      bankDetails: {},
    };

    await expect(deliveryService.acceptOffer(USER_ID, "offer-123")).rejects.toThrow("Complete your rider profile first");
  });

  test("filters rider history by sub-order status and date range", async () => {
    subOrderRows = [
      {
        _id: new Types.ObjectId(),
        subOrderId: "SO-HISTORY",
        parentOrderId: { shippingAddress: { fullName: "Customer" } },
        shippingAddress: { fullName: "Customer" },
        items: [],
        status: SubOrderStatus.RIDER_CANCELLED,
        payableAmount: 100,
        delivery: { riderId: USER_ID, payoutAmount: 0 },
        updatedAt: new Date("2026-06-10T10:00:00.000Z"),
      },
    ];
    subOrderCount = 1;

    const result = await deliveryService.listHistory(USER_ID, {
      status: SubOrderStatus.RIDER_CANCELLED,
      dateFrom: new Date("2026-06-10T00:00:00.000Z"),
      dateTo: new Date("2026-06-10T00:00:00.000Z"),
      page: 1,
      limit: 10,
    });

    const filter = (subOrderFind.mock.calls[0] as any[])[0] as any;
    expect(filter.status).toBe(SubOrderStatus.RIDER_CANCELLED);
    expect(filter.$or.length).toBeGreaterThan(0);
    expect(filter.$or.some((entry: any) => entry.updatedAt?.$gte)).toBe(true);
    expect((subOrderCountDocuments.mock.calls[0] as any[])[0]).toEqual(filter);
    expect(result.total).toBe(1);
    expect((result.data[0] as any).orderId).toBe("SO-HISTORY");
  });

  test("filters rider earnings ledger by updated date range", async () => {
    currentProfile = {
      wallet: { availableBalance: 80, pendingPayoutBalance: 0, lifetimeEarnings: 80 },
    };
    subOrderRows = [
      {
        _id: new Types.ObjectId(),
        subOrderId: "SO-EARN",
        parentOrderId: { shippingAddress: { fullName: "Rider Customer" } },
        status: SubOrderStatus.DELIVERED,
        delivery: { riderId: USER_ID, payoutAmount: 80 },
        updatedAt: new Date("2026-06-09T10:00:00.000Z"),
      },
    ];

    const result = await deliveryService.getEarnings(USER_ID, {
      dateFrom: new Date("2026-06-09T00:00:00.000Z"),
      dateTo: new Date("2026-06-09T00:00:00.000Z"),
    });

    const filter = (subOrderFind.mock.calls[0] as any[])[0] as any;
    expect(filter.status).toBe(SubOrderStatus.DELIVERED);
    expect(filter.updatedAt.$gte).toBeInstanceOf(Date);
    expect(filter.updatedAt.$lte).toBeInstanceOf(Date);
    expect(result.totalCredited).toBe(80);
    expect((result.ledger[0] as any).customerName).toBe("Rider Customer");
  });
});
