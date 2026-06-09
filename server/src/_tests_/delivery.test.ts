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

let currentOrder: any;
let updatedOrder: any;
let currentProfile: any;

const queryMock = (value: any) => {
  const query: any = {
    populate: mock(() => query),
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return query;
};

const adminUpdateOrderStatus = mock(() => Promise.resolve({}));
const deliveryUpdateOne = mock(() => Promise.resolve({ modifiedCount: 1 }));
const deliveryFindOne = mock(() => Promise.resolve(currentProfile));
const orderUpdateOne = mock(() => Promise.resolve({ modifiedCount: 1 }));
const payoutCreate = mock((payload) => Promise.resolve({
  _id: "payout-id",
  ...payload,
  populate: mock(() => Promise.resolve({ _id: "payout-id", ...payload })),
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
    getConfig: mock(() => Promise.resolve({ delivery: { riderPayoutAmount: 40 } })),
  },
}));

mock.module("../modules/socket/socket.service", () => ({
  socketService: {
    emitToUser: mock(() => undefined),
    emitToOrderRoom: mock(() => undefined),
  },
}));

const { deliveryService } = await import("../modules/delivery/delivery.service");

describe("DeliveryService", () => {
  beforeEach(() => {
    adminUpdateOrderStatus.mockClear();
    deliveryUpdateOne.mockClear();
    deliveryFindOne.mockClear();
    orderUpdateOne.mockClear();
    payoutCreate.mockClear();
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
});
