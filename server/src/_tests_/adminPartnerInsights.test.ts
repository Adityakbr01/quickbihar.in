process.env.NODE_ENV = "test";
process.env.PORT = "8000";
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

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Types } from "mongoose";

const SELLER_ID = "645a2c2b8f8f2b1a2c3d4e5f";
const RIDER_ID = "645a2c2b8f8f2b1a2c3d4e60";
const STORE_ID = "645a2c2b8f8f2b1a2c3d4e61";
const ADMIN_ID = "645a2c2b8f8f2b1a2c3d4e62";
const USER_ID = "645a2c2b8f8f2b1a2c3d4e63";

let currentUser: any;
let currentSeller: any;
let currentRider: any;
let currentStore: any;
let emailConflict: any = null;
let usernameExistsQueue: boolean[] = [];
let aggregateRows: any[][] = [];
let productAggregateRows: any[][] = [];
let payoutRows: any[] = [];
let sellerEarningRows: any[] = [];
let deliveredSubOrderRows: any[] = [];
let codSettlementRows: any[] = [];
let createdUserCounter = 1;

const roleIds: Record<string, Types.ObjectId> = {
  USER: new Types.ObjectId(),
  SELLER: new Types.ObjectId(),
  DELIVERY: new Types.ObjectId(),
  ADMIN: new Types.ObjectId(),
  SUPER_ADMIN: new Types.ObjectId(),
};

const roleNameById = new Map(Object.entries(roleIds).map(([name, id]) => [id.toString(), name]));

const chain = (value: any) => {
  const query: any = {
    select: mock(() => query),
    populate: mock(() => query),
    sort: mock(() => query),
    skip: mock(() => query),
    limit: mock(() => query),
    lean: mock(() => Promise.resolve(value)),
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return query;
};

const userFindById = mock(() => chain(currentUser));
const userFindOne = mock(() => chain(emailConflict));
const userExists = mock(() => Promise.resolve(usernameExistsQueue.length ? usernameExistsQueue.shift() : false));
const userCreate = mock(async (data: any) => {
  const roleName = roleNameById.get(data.roleId?.toString?.() || "") || "USER";
  currentUser = makeMutableUser({
    _id: `645a2c2b8f8f2b1a2c3d4f${createdUserCounter.toString(16).padStart(2, "0")}`.slice(0, 24),
    ...data,
    role: roleName,
    roleId: { _id: data.roleId, name: roleName },
  });
  createdUserCounter += 1;
  return currentUser;
});
const sellerFindOne = mock(() => chain(currentSeller));
const sellerFindOneAndUpdate = mock(async (_filter: any, update: any) => {
  currentSeller = {
    _id: new Types.ObjectId(),
    ...(update.$setOnInsert || {}),
  };
  return currentSeller;
});
const riderFindOne = mock(() => chain(currentRider));
const riderFindOneAndUpdate = mock(async (_filter: any, update: any) => {
  currentRider = {
    _id: new Types.ObjectId(),
    ...(update.$setOnInsert || {}),
  };
  return currentRider;
});
const storeFindOne = mock(() => chain(currentStore));
const subOrderAggregate = mock(() => Promise.resolve(aggregateRows.shift() || []));
const subOrderFind = mock(() => chain(deliveredSubOrderRows));
const productAggregate = mock(() => Promise.resolve(productAggregateRows.shift() || []));
const payoutFind = mock(() => chain(payoutRows));
const sellerEarningFind = mock(() => chain(sellerEarningRows));
const codSettlementFind = mock(() => chain(codSettlementRows));
const auditLogCreate = mock(() => Promise.resolve({}));
const activityLogCreate = mock(() => Promise.resolve({}));

const makeMutableUser = (overrides: any = {}) => {
  const role = overrides.role || "USER";
  const user: any = {
    _id: overrides._id || USER_ID,
    fullName: overrides.fullName || "User One",
    email: overrides.email || "user@example.com",
    username: overrides.username || "user",
    phone: overrides.phone || "9999999999",
    password: overrides.password || "old-password",
    roleId: overrides.roleId || { _id: roleIds[role], name: role },
    isVerified: overrides.isVerified ?? true,
    isBlocked: overrides.isBlocked ?? false,
    refreshToken: overrides.refreshToken,
    deletedAt: overrides.deletedAt,
    deletedBy: overrides.deletedBy,
    deletionReason: overrides.deletionReason,
    createdAt: overrides.createdAt || new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: overrides.updatedAt || new Date("2026-06-01T00:00:00.000Z"),
  };
  user.save = mock(async () => {
    const roleId = user.roleId?._id?.toString?.() || user.roleId?.toString?.();
    const roleName = roleNameById.get(roleId);
    if (roleName) user.roleId = { _id: roleIds[roleName], name: roleName };
    return user;
  });
  user.toObject = () => ({ ...user, save: undefined, toObject: undefined });
  return user;
};

mock.module("../modules/user/user.model", () => ({
  User: {
    findById: userFindById,
    findOne: userFindOne,
    exists: userExists,
    create: userCreate,
    find: mock(() => chain([])),
    countDocuments: mock(() => Promise.resolve(0)),
  },
}));

mock.module("../modules/seller/seller.model", () => ({
  Seller: {
    findOne: sellerFindOne,
    findOneAndUpdate: sellerFindOneAndUpdate,
    find: mock(() => chain([])),
    countDocuments: mock(() => Promise.resolve(0)),
  },
}));

mock.module("../modules/deliveryBoy/delivery.model", () => ({
  DeliveryBoy: {
    findOne: riderFindOne,
    findOneAndUpdate: riderFindOneAndUpdate,
    find: mock(() => chain([])),
    countDocuments: mock(() => Promise.resolve(0)),
  },
}));

mock.module("../modules/store/store.model", () => ({
  Store: {
    findOne: storeFindOne,
    find: mock(() => chain([])),
  },
}));

mock.module("../modules/order/subOrder.model", () => ({
  SubOrder: {
    aggregate: subOrderAggregate,
    find: subOrderFind,
  },
  SubOrderStatus: {
    DELIVERED: "DELIVERED",
    DELIVERY_CONFIRMED: "DELIVERY_CONFIRMED",
    COMPLETED: "COMPLETED",
    RIDER_CANCELLED: "RIDER_CANCELLED",
  },
}));

mock.module("../modules/products/product.model", () => ({
  Product: {
    aggregate: productAggregate,
    countDocuments: mock(() => Promise.resolve(0)),
    updateMany: mock(() => Promise.resolve({ modifiedCount: 0 })),
  },
}));

mock.module("../modules/admin/admin.model", () => ({
  AdminPayout: {
    find: payoutFind,
    create: mock(() => Promise.resolve({})),
    countDocuments: mock(() => Promise.resolve(0)),
    aggregate: mock(() => Promise.resolve([])),
  },
}));

const adminFullModel = {
  create: mock(() => Promise.resolve({})),
  find: mock(() => chain([])),
  findOne: mock(() => chain(null)),
  findById: mock(() => chain(null)),
  findByIdAndUpdate: mock(() => chain(null)),
  findByIdAndDelete: mock(() => chain(null)),
  countDocuments: mock(() => Promise.resolve(0)),
  aggregate: mock(() => Promise.resolve([])),
};

mock.module("../modules/admin/adminFull.model", () => ({
  ActivityLog: { ...adminFullModel, create: activityLogCreate },
  AdminSystemConfig: adminFullModel,
  Announcement: adminFullModel,
  AuditLog: { ...adminFullModel, create: auditLogCreate },
  BackupJob: adminFullModel,
  BlogPost: adminFullModel,
  CMSPage: adminFullModel,
  FAQ: adminFullModel,
  FlashSale: adminFullModel,
  ShippingProvider: adminFullModel,
  Warehouse: adminFullModel,
}));

mock.module("../modules/seller/sellerPanel.model", () => ({
  InventoryMovement: {
    find: mock(() => chain([])),
    create: mock(() => Promise.resolve({})),
  },
  SellerCategoryRequest: {
    countDocuments: mock(() => Promise.resolve(0)),
    find: mock(() => chain([])),
  },
  SellerEarning: {
    find: sellerEarningFind,
  },
  SellerNotification: {
    create: mock(() => Promise.resolve({})),
  },
}));

mock.module("../modules/fulfillment/codSettlement.model", () => ({
  CodSettlement: {
    find: codSettlementFind,
    create: mock(() => Promise.resolve({})),
  },
}));

mock.module("../modules/rbac/rbac.model", () => ({
  Role: {
    findOne: mock((filter: any) => chain({ _id: roleIds[filter?.name || "USER"], name: filter?.name || "USER" })),
  },
}));

const getRoleByName = mock((name: string) => Promise.resolve({ _id: roleIds[name], name }));

mock.module("../modules/rbac/rbac.service", () => ({
  getRoleByName,
  assignUserToRole: mock(() => Promise.resolve(undefined)),
}));

mock.module("../utils/mail.service", () => ({
  MailService: {
    sendAdminInvite: mock(() => Promise.resolve(true)),
    sendPayoutNotice: mock(() => Promise.resolve(true)),
  },
}));

const { AdminService } = await import("../modules/admin/admin.service");

describe("AdminService partner insights", () => {
  beforeEach(() => {
    currentUser = {
      _id: SELLER_ID,
      fullName: "Seller One",
      email: "seller@example.com",
      username: "seller",
      phone: "9999999999",
      roleId: { name: "SELLER" },
      isVerified: true,
      isBlocked: false,
    };
    currentSeller = {
      _id: new Types.ObjectId(),
      userId: SELLER_ID,
      businessName: "Seller Store",
      status: "APPROVED",
      isVerified: true,
      wallet: { availableBalance: 500, pendingPayoutBalance: 100, lifetimeEarnings: 1200 },
      payoutMethods: [{ status: "VERIFIED" }],
    };
    currentRider = {
      _id: new Types.ObjectId(),
      userId: RIDER_ID,
      status: "APPROVED",
      isVerified: true,
      isOnline: true,
      vehicleType: "BIKE",
      vehicleNumber: "BR01AB1234",
      wallet: {
        availableBalance: 300,
        pendingPayoutBalance: 50,
        lifetimeEarnings: 900,
        collectedCodLiability: 250,
      },
      payoutMethods: [{ status: "PENDING_VERIFICATION" }],
    };
    currentStore = { _id: STORE_ID, sellerId: SELLER_ID, name: "Seller Store", isActive: true };
    aggregateRows = [];
    productAggregateRows = [];
    payoutRows = [];
    sellerEarningRows = [];
    deliveredSubOrderRows = [];
    codSettlementRows = [];
    emailConflict = null;
    usernameExistsQueue = [];
    userFindById.mockClear();
    userFindOne.mockClear();
    userExists.mockClear();
    userCreate.mockClear();
    sellerFindOne.mockClear();
    sellerFindOneAndUpdate.mockClear();
    riderFindOne.mockClear();
    riderFindOneAndUpdate.mockClear();
    storeFindOne.mockClear();
    subOrderAggregate.mockClear();
    subOrderFind.mockClear();
    productAggregate.mockClear();
    payoutFind.mockClear();
    sellerEarningFind.mockClear();
    codSettlementFind.mockClear();
    auditLogCreate.mockClear();
    activityLogCreate.mockClear();
  });

  test("summarizes seller orders, earnings, payouts, and inventory", async () => {
    aggregateRows = [
      [{ totalOrders: 4, deliveredOrders: 3, cancelledOrders: 1, grossAmount: 2400, partnerEarnings: 1800 }],
      [{ _id: "DELIVERED", count: 3, grossAmount: 1800, partnerEarnings: 1350 }],
      [{ _id: "2026-06-10", orders: 2, deliveredOrders: 2, grossAmount: 1200, partnerEarnings: 900 }],
      [{ _id: "product-1", title: "Kurta", sku: "K-1", quantity: 4, revenue: 1600 }],
    ];
    productAggregateRows = [
      [{ totalProducts: 7, activeProducts: 6, totalStock: 44, lowStockProducts: 1, outOfStockProducts: 0 }],
    ];
    payoutRows = [
      { _id: "payout-1", amount: 300, status: "PAID", method: "UPI", createdAt: new Date("2026-06-10") },
      { _id: "payout-2", amount: 100, status: "PENDING", method: "BANK", createdAt: new Date("2026-06-11") },
    ];
    sellerEarningRows = [
      {
        _id: "earning-1",
        netAmount: 450,
        grossAmount: 600,
        commissionAmount: 150,
        status: "AVAILABLE",
        subOrderId: "SO-1",
        creditedAt: new Date("2026-06-11"),
      },
    ];

    const result = await AdminService.getSellerInsights(SELLER_ID, {
      dateFrom: new Date("2026-06-01T00:00:00.000Z"),
      dateTo: new Date("2026-06-11T00:00:00.000Z"),
    });

    expect(result.partner.sellerProfile.businessName).toBe("Seller Store");
    expect(result.summary.totalOrders).toBe(4);
    expect(result.summary.partnerEarnings).toBe(1800);
    expect(result.summary.paidPayoutAmount).toBe(300);
    expect(result.summary.pendingPayoutAmount).toBe(100);
    expect(result.inventory.totalProducts).toBe(7);
    expect(result.productPerformance[0].title).toBe("Kurta");
    expect(result.transactions.map((row: any) => row.type)).toContain("EARNING");
    expect(result.transactions.map((row: any) => row.type)).toContain("PAYOUT");

    const firstAggregateMatch = (subOrderAggregate.mock.calls[0] as any[])[0][0].$match;
    expect(firstAggregateMatch.sellerId.toString()).toBe(SELLER_ID);
    expect(firstAggregateMatch.createdAt.$gte).toBeInstanceOf(Date);
    const earningFilter = (sellerEarningFind.mock.calls[0] as any[])[0];
    expect(earningFilter.createdAt.$lte).toBeInstanceOf(Date);
  });

  test("summarizes rider deliveries, payouts, and COD settlements", async () => {
    currentUser = {
      _id: RIDER_ID,
      fullName: "Rider One",
      email: "rider@example.com",
      username: "rider",
      roleId: { name: "DELIVERY" },
      isVerified: true,
      isBlocked: false,
    };
    aggregateRows = [
      [{ totalOrders: 5, deliveredOrders: 4, cancelledOrders: 1, grossAmount: 3000, partnerEarnings: 360, riderPayoutAmount: 360, distanceKm: 42 }],
      [{ _id: "DELIVERED", count: 4, grossAmount: 2400, partnerEarnings: 360 }],
      [{ _id: "2026-06-11", orders: 1, deliveredOrders: 1, grossAmount: 600, partnerEarnings: 90 }],
      [{ totalPayout: 360, totalDistanceKm: 42, rainBonus: 20, peakBonus: 15, festivalBonus: 0, nightBonus: 0, codCollected: 900 }],
    ];
    payoutRows = [
      { _id: "rider-payout", amount: 150, status: "PROCESSING", method: "UPI", createdAt: new Date("2026-06-11") },
    ];
    deliveredSubOrderRows = [
      {
        _id: "sub-order-1",
        subOrderId: "SO-R1",
        status: "DELIVERED",
        payableAmount: 600,
        delivery: { payoutAmount: 90, distanceKm: 8 },
        packageDetails: { isCod: true },
        updatedAt: new Date("2026-06-11"),
      },
    ];
    codSettlementRows = [
      {
        _id: "cod-1",
        amount: 250,
        status: "VERIFIED",
        referenceId: "CASH-1",
        createdAt: new Date("2026-06-11"),
      },
    ];

    const result = await AdminService.getRiderInsights(RIDER_ID, {});

    expect(result.partner.deliveryProfile.vehicleNumber).toBe("BR01AB1234");
    expect(result.summary.totalOrders).toBe(5);
    expect(result.summary.collectedCodLiability).toBe(250);
    expect(result.summary.pendingPayoutAmount).toBe(150);
    expect(result.riderPerformance.codCollected).toBe(900);
    expect(result.codSettlements[0].referenceId).toBe("CASH-1");
    expect(result.transactions.map((row: any) => row.type)).toContain("COD_SETTLEMENT");
    expect(result.transactions.map((row: any) => row.type)).toContain("EARNING");

    const firstAggregateMatch = (subOrderAggregate.mock.calls[0] as any[])[0][0].$match;
    expect(firstAggregateMatch["delivery.riderId"].toString()).toBe(RIDER_ID);
  });

  test("throws 404 for missing seller or rider profiles", async () => {
    currentSeller = null;
    await expect(AdminService.getSellerInsights(SELLER_ID, {})).rejects.toThrow("Seller profile not found");

    currentUser = { _id: RIDER_ID, roleId: { name: "DELIVERY" } };
    currentRider = null;
    await expect(AdminService.getRiderInsights(RIDER_ID, {})).rejects.toThrow("Rider profile not found");
  });
});

describe("AdminService user CRUD", () => {
  beforeEach(() => {
    currentUser = makeMutableUser();
    currentSeller = null;
    currentRider = null;
    currentStore = null;
    emailConflict = null;
    usernameExistsQueue = [];
    createdUserCounter = 1;
    userFindById.mockClear();
    userFindOne.mockClear();
    userExists.mockClear();
    userCreate.mockClear();
    sellerFindOne.mockClear();
    sellerFindOneAndUpdate.mockClear();
    riderFindOne.mockClear();
    riderFindOneAndUpdate.mockClear();
    storeFindOne.mockClear();
    auditLogCreate.mockClear();
    activityLogCreate.mockClear();
    getRoleByName.mockClear();
  });

  test("creates a normal user account", async () => {
    const result = await AdminService.createUser(ADMIN_ID, {
      fullName: "Buyer One",
      email: "buyer@example.com",
      username: "buyer",
      phone: "9000000000",
      password: "secret123",
      role: "USER",
    });

    expect(result.email).toBe("buyer@example.com");
    expect(result.role).toBe("USER");
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(sellerFindOneAndUpdate).not.toHaveBeenCalled();
    expect(riderFindOneAndUpdate).not.toHaveBeenCalled();
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    expect(activityLogCreate).toHaveBeenCalledTimes(1);
  });

  test("creates seller and rider users with pending partner profiles", async () => {
    await AdminService.createUser(ADMIN_ID, {
      fullName: "Seller Create",
      email: "new-seller@example.com",
      password: "secret123",
      role: "SELLER",
    });

    const sellerUpdate = (sellerFindOneAndUpdate.mock.calls[0] as any[])[1];
    expect(sellerUpdate.$setOnInsert.status).toBe("PENDING");
    expect(sellerUpdate.$setOnInsert.businessName).toBe("Seller Create");

    await AdminService.createUser(ADMIN_ID, {
      fullName: "Rider Create",
      email: "new-rider@example.com",
      password: "secret123",
      role: "DELIVERY",
    });

    const riderUpdate = (riderFindOneAndUpdate.mock.calls[0] as any[])[1];
    expect(riderUpdate.$setOnInsert.status).toBe("PENDING");
    expect(riderUpdate.$setOnInsert.wallet.collectedCodLiability).toBe(0);
  });

  test("updates account fields, role, blocked state, verification, and password", async () => {
    currentUser = makeMutableUser({ _id: USER_ID, role: "USER", isVerified: true, isBlocked: false });

    const result = await AdminService.updateUser(ADMIN_ID, USER_ID, {
      fullName: "Updated User",
      email: "updated@example.com",
      username: "updated",
      phone: "9111111111",
      password: "new-secret",
      role: "DELIVERY",
      isVerified: false,
      isBlocked: true,
    });

    expect(result.fullName).toBe("Updated User");
    expect(result.email).toBe("updated@example.com");
    expect(result.role).toBe("DELIVERY");
    expect(currentUser.password).toBe("new-secret");
    expect(currentUser.isVerified).toBe(false);
    expect(currentUser.isBlocked).toBe(true);
    expect(currentUser.save).toHaveBeenCalledTimes(1);
    expect(riderFindOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  test("soft deletes a user and preserves references", async () => {
    currentUser = makeMutableUser({ _id: USER_ID, refreshToken: "refresh-token" });

    const result = await AdminService.deleteUser(ADMIN_ID, USER_ID, "duplicate account");

    expect(result.isBlocked).toBe(true);
    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(result.deletionReason).toBe("duplicate account");
    expect(currentUser.refreshToken).toBeUndefined();
    expect(currentUser.save).toHaveBeenCalledTimes(1);
    const auditPayload = (auditLogCreate.mock.calls[0] as any[])[0];
    expect(auditPayload.resourceId).toBe(USER_ID);
    expect(auditPayload.action).toBe("SOFT_DELETE_USER");
  });

  test("rejects self delete, self block, and self demotion", async () => {
    currentUser = makeMutableUser({ _id: ADMIN_ID, role: "ADMIN" });

    await expect(AdminService.deleteUser(ADMIN_ID, ADMIN_ID, "cleanup")).rejects.toThrow(
      "You cannot delete your own admin account",
    );

    await expect(AdminService.updateUser(ADMIN_ID, ADMIN_ID, { isBlocked: true })).rejects.toThrow(
      "You cannot block your own admin account",
    );

    await expect(AdminService.updateUser(ADMIN_ID, ADMIN_ID, { role: "USER" })).rejects.toThrow(
      "You cannot remove your own admin role",
    );
  });
});
