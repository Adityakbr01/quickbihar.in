process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_long_enough";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_long_enough";

// NOTE: run this file standalone (`bun run test:return`), NOT inside `test:all`.
// bun's mock.module is process-global; this suite stubs sellerSettlement.service /
// razorpay / product.dao, which would bleed into sellerSettlement.test.ts if co-run.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Types } from "mongoose";
import { ApiError } from "../utils/ApiError";

const ORDER_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0001");
const SUB_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0002");
const SELLER_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0003");
const CUSTOMER_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0004");
const RIDER_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0005");
const RIDER2_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0006");
const RIDER_PROFILE_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0007");
const STORE_ID = new Types.ObjectId("645a2c2b8f8f2b1a2c3d0008");

// ---- in-memory state -------------------------------------------------------
let subOrder: any;
let returnRequest: any;
let parentOrder: any;
let refundShouldThrow = false;

const restoreStock = mock(() => Promise.resolve({}));
const reverseSettlement = mock(() => Promise.resolve({ reversed: true, amount: 880 }));
const razorpayRefund = mock(() => (refundShouldThrow ? Promise.reject(new Error("gateway down")) : Promise.resolve({ id: "rfnd_1" })));
const emitToUser = mock(() => undefined);
const recordEvent = mock(() => Promise.resolve({}));

// A chained query whose await/lean resolves to `value` (same reference, so mutations persist).
const queryOf = (value: any) => ({
    populate: function () { return this; },
    sort: function () { return this; },
    limit: function () { return this; },
    select: function () { return this; },
    lean: () => Promise.resolve(value),
    then: (resolve: any) => Promise.resolve(value).then(resolve),
});
const matchesId = (filter: any, doc: any) => {
    const or = filter?.$or || [];
    return or.some((c: any) => c.subOrderId === doc.subOrderId || (c._id && String(c._id) === String(doc._id)));
};

const SubOrder = {
    findOne: mock((filter: any) => {
        if (!subOrder || !matchesId(filter, subOrder)) return queryOf(null);
        if (filter.sellerId && !filter.sellerId.equals(subOrder.sellerId)) return queryOf(null);
        return queryOf(subOrder);
    }),
    find: mock((filter: any) => {
        if (filter?.status && subOrder?.status !== filter.status) return queryOf([]);
        return queryOf(subOrder ? [subOrder] : []);
    }),
};

const ReturnRequest = {
    findOne: mock((filter: any) => {
        if (!returnRequest) return queryOf(null);
        if (filter.status && returnRequest.status !== filter.status) return queryOf(null);
        return queryOf(returnRequest);
    }),
    find: mock(() => queryOf(returnRequest && !returnRequest.riderId ? [returnRequest] : [])),
    // Race-safe claim: only succeeds while RETURN_APPROVED and unclaimed.
    findOneAndUpdate: mock((filter: any, update: any) => {
        if (!returnRequest || returnRequest.status !== filter.status) return Promise.resolve(null);
        if (filter.riderId?.$exists === false && returnRequest.riderId) return Promise.resolve(null);
        Object.assign(returnRequest, update.$set);
        return Promise.resolve(returnRequest);
    }),
};

const Order = {
    findById: mock(() => queryOf(parentOrder)),
    findByIdAndUpdate: mock((_id: any, update: any) => { parentOrder.status = update.status; return Promise.resolve(parentOrder); }),
};

const DeliveryBoy = {
    findOne: mock(() => queryOf({ _id: RIDER_PROFILE_ID, userId: RIDER_ID, isOnline: true, status: "APPROVED" })),
};

mock.module("../modules/common/order/subOrder.model", () => ({
    SubOrder,
    SubOrderStatus: {
        PICKED_UP: "PICKED_UP", IN_TRANSIT: "IN_TRANSIT", NEAR_CUSTOMER: "NEAR_CUSTOMER",
        DELIVERED: "DELIVERED", DELIVERY_CONFIRMED: "DELIVERY_CONFIRMED", COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED", REJECTED: "REJECTED", SELLER_REJECTED: "SELLER_REJECTED",
        SELLER_CANCELLED: "SELLER_CANCELLED", CUSTOMER_CANCELLED: "CUSTOMER_CANCELLED",
        PICKUP_FAILED: "PICKUP_FAILED", DELIVERY_FAILED: "DELIVERY_FAILED",
        CUSTOMER_UNREACHABLE: "CUSTOMER_UNREACHABLE", DISPUTED: "DISPUTED",
        RETURN_INITIATED: "RETURN_INITIATED", RETURN_REQUESTED: "RETURN_REQUESTED",
        RETURN_APPROVED: "RETURN_APPROVED", RETURN_PICKUP_SCHEDULED: "RETURN_PICKUP_SCHEDULED",
        RETURN_PICKED_UP: "RETURN_PICKED_UP", RETURNED: "RETURNED", REFUNDED: "REFUNDED",
    },
}));
mock.module("../modules/common/fulfillment/returnRequest.model", () => ({ ReturnRequest }));
mock.module("../modules/common/order/order.model", () => ({ Order }));
mock.module("../modules/common/deliveryBoy/delivery.model", () => ({ DeliveryBoy }));
mock.module("../modules/common/socket/socket.service", () => ({ socketService: { emitToUser } }));
mock.module("../modules/common/order/timeline.helper", () => ({
    TimelineHelper: { createEvent: (status: string, actor: string, actorId: any, _req: any, meta: any) => ({ status, actor, actorId, ...meta }) },
}));
mock.module("../modules/common/fulfillment/fulfillmentEvent.service", () => ({ record: recordEvent }));
mock.module("../modules/common/delivery/riderEligibility", () => ({
    assertRiderCanAcceptOffers: () => undefined, assertRiderCanAcceptCod: () => undefined,
}));
mock.module("../modules/common/seller/sellerSettlement.service", () => ({
    sellerSettlementService: { reverseSubOrderSettlement: reverseSettlement },
}));
mock.module("../modules/clothing/products/product.dao", () => ({ restoreStock }));
mock.module("../utils/razorpay.util", () => ({ razorpay: { payments: { refund: razorpayRefund } } }));

const { SubOrderService } = await import("../modules/common/order/subOrder.service");

const makeSubOrder = () => {
    const doc: any = {
        _id: SUB_ID, subOrderId: "QB-RET-1", parentOrderId: parentOrder, sellerId: SELLER_ID,
        storeId: STORE_ID, status: "RETURN_INITIATED", payableAmount: 1000,
        items: [{ productId: new Types.ObjectId(), sku: "SKU-1", quantity: 2 }],
        delivery: {}, timeline: [{ status: "DELIVERED", actor: "RIDER" }],
    };
    doc.save = async () => doc;
    return doc;
};
const makeReturnRequest = () => {
    const doc: any = {
        _id: new Types.ObjectId(), returnId: "ret_test_1", subOrderObjectId: SUB_ID, subOrderId: "QB-RET-1",
        parentOrderId: ORDER_ID, customerId: CUSTOMER_ID, sellerId: SELLER_ID,
        status: "RETURN_REQUESTED", reason: "Wrong size", pickupOtp: "123456", timeline: [],
    };
    doc.save = async () => doc;
    return doc;
};
const REQ = { ipAddress: "127.0.0.1", deviceInfo: "test" };
const RIDER = RIDER_ID.toString();
const SELLER = SELLER_ID.toString();
const ADMIN = new Types.ObjectId().toString();

describe("SubOrderService — return lifecycle (M2)", () => {
    beforeEach(() => {
        refundShouldThrow = false;
        parentOrder = { _id: ORDER_ID, orderId: "QB-RET", userId: CUSTOMER_ID, status: "DELIVERED", payableAmount: 1000, paymentInfo: { razorpayPaymentId: "pay_1" } };
        subOrder = makeSubOrder();
        returnRequest = makeReturnRequest();
        restoreStock.mockClear();
        reverseSettlement.mockClear();
        razorpayRefund.mockClear();
    });

    test("happy path: approve → claim → pickup → receipt → REFUNDED", async () => {
        await SubOrderService.sellerReviewReturn("QB-RET-1", SELLER, true, "ok", REQ);
        expect(subOrder.status).toBe("RETURN_APPROVED");
        expect(returnRequest.status).toBe("RETURN_APPROVED");

        await SubOrderService.riderClaimReturn("QB-RET-1", RIDER, REQ);
        expect(subOrder.status).toBe("RETURN_PICKUP_SCHEDULED");
        expect(String(returnRequest.riderId)).toBe(RIDER);

        await SubOrderService.riderReturnPickup("QB-RET-1", RIDER, "123456", "photo.jpg", REQ);
        expect(subOrder.status).toBe("RETURN_PICKED_UP");
        expect(returnRequest.proofPhoto).toBe("photo.jpg");

        const result = await SubOrderService.sellerConfirmReturnReceipt("QB-RET-1", SELLER, true, undefined, REQ);
        expect(subOrder.status).toBe("REFUNDED");
        expect(returnRequest.status).toBe("REFUNDED");
        expect(restoreStock).toHaveBeenCalledTimes(1);
        expect(reverseSettlement).toHaveBeenCalledTimes(1);
        expect(razorpayRefund).toHaveBeenCalledTimes(1);
        expect(result.refund?.refunded).toBe(true);
    });

    test("seller rejects the return → reverts to DELIVERED", async () => {
        const result = await SubOrderService.sellerReviewReturn("QB-RET-1", SELLER, false, "not eligible", REQ);
        expect(subOrder.status).toBe("DELIVERED");
        expect(returnRequest.status).toBe("RETURN_REJECTED");
        expect(result.approved).toBe(false);
    });
    test("QC fail → DISPUTED, then admin resolves with a refund", async () => {
        subOrder.status = "RETURN_PICKED_UP";
        subOrder.delivery.riderId = RIDER_ID;
        returnRequest.status = "RETURN_PICKED_UP";
        returnRequest.riderId = RIDER_ID;

        await SubOrderService.sellerConfirmReturnReceipt("QB-RET-1", SELLER, false, "damaged", REQ);
        expect(subOrder.status).toBe("DISPUTED");
        expect(returnRequest.status).toBe("DISPUTED");
        expect(razorpayRefund).not.toHaveBeenCalled();

        const result = await SubOrderService.adminResolveReturnDispute("QB-RET-1", "refund", ADMIN, REQ);
        expect(subOrder.status).toBe("REFUNDED");
        expect(result.refund?.refunded).toBe(true);
        expect(razorpayRefund).toHaveBeenCalledTimes(1);
    });

    test("second rider claiming an already-claimed return is rejected (409)", async () => {
        subOrder.status = "RETURN_APPROVED";
        returnRequest.status = "RETURN_APPROVED";

        await SubOrderService.riderClaimReturn("QB-RET-1", RIDER, REQ);

        let error: any;
        try {
            await SubOrderService.riderClaimReturn("QB-RET-1", RIDER2_ID.toString(), REQ);
        } catch (err) {
            error = err;
        }
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(409);
    });

    test("COD return refunds without calling Razorpay (manual cash)", async () => {
        parentOrder.paymentInfo = {};
        subOrder.status = "RETURN_PICKED_UP";
        subOrder.delivery.riderId = RIDER_ID;
        returnRequest.status = "RETURN_PICKED_UP";
        returnRequest.riderId = RIDER_ID;

        const result = await SubOrderService.sellerConfirmReturnReceipt("QB-RET-1", SELLER, true, undefined, REQ);
        expect(subOrder.status).toBe("REFUNDED");
        expect(razorpayRefund).not.toHaveBeenCalled();
        expect(result.refund?.refundMethod).toBe("MANUAL_CASH");
    });

});


