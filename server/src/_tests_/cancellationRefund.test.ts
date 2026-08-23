import { describe, test, expect, mock, beforeEach } from "bun:test";

let razorpayRefundMock = mock(() => Promise.resolve({ id: "rfnd_cancellation_test_123" }));
let restoreStockMock = mock(() => Promise.resolve({}));
let reverseSettlementMock = mock(() => Promise.resolve({}));

mock.module("@/utils/razorpay.util", () => ({
    razorpay: {
        payments: {
            refund: razorpayRefundMock,
        },
    },
}));

mock.module("@/modules/clothing/products/product.dao", () => ({
    restoreStock: restoreStockMock,
}));

mock.module("@/modules/common/seller/sellerSettlement.service", () => ({
    sellerSettlementService: {
        reverseSubOrderSettlement: reverseSettlementMock,
    },
}));

// Set dummy envs
process.env.RAZORPAY_KEY_ID = "dummy_key";
process.env.RAZORPAY_KEY_SECRET = "dummy_secret";

import { SubOrderService } from "@/modules/common/order/subOrder.service";
import { SubOrderStatus } from "@/modules/common/order/subOrder.model";

describe("SubOrderService — Cancellation Auto-Refund", () => {
    beforeEach(() => {
        razorpayRefundMock.mockClear();
        restoreStockMock.mockClear();
        reverseSettlementMock.mockClear();
    });

    test("Prepaid online order triggers Razorpay refund and stock restoration on cancellation", async () => {
        const mockSubOrder = {
            _id: "6a896a08c3e5c8d64eeb9a4a",
            subOrderId: "QB-4114272318-S1",
            parentOrderId: "6a8969cbc3e5c8d64eeb9a48",
            payableAmount: 598,
            items: [
                {
                    productId: "6a809c8da011bd545c686f32",
                    sku: "QUI-CLO-E4COQ-M-WHITE",
                    quantity: 1,
                },
            ],
            delivery: { status: "UNASSIGNED" },
            timeline: [],
            save: mock(() => Promise.resolve()),
        };

        // Mock parent order retrieval
        SubOrderService.parentOrderOf = mock(() =>
            Promise.resolve({
                orderId: "QB-4114272318",
                userId: "6a8968fdc3e5c8d64eeb9a2a",
                paymentInfo: {
                    razorpayPaymentId: "pay_TSlQUG7mQGhlyN",
                },
            })
        );
        SubOrderService.syncParentOrderStatus = mock(() => Promise.resolve());
        SubOrderService.publishUpdate = mock(() => Promise.resolve());

        const result = await SubOrderService.processCancellationRefund(
            mockSubOrder,
            "AUTOMATIC_CANCELLATION: No delivery partner available within 15 KM radius after 30 minutes.",
            "SYSTEM",
            "SYSTEM"
        );

        // 1. Check Razorpay refund called with correct amount in paise (598 * 100 = 59800)
        expect(razorpayRefundMock).toHaveBeenCalledTimes(1);
        expect(razorpayRefundMock).toHaveBeenCalledWith("pay_TSlQUG7mQGhlyN", {
            amount: 59800,
            notes: {
                subOrderId: "QB-4114272318-S1",
                orderId: "QB-4114272318",
                reason: "AUTOMATIC_CANCELLATION: No delivery partner available within 15 KM radius after 30 minutes.",
                cancelledBy: "SYSTEM",
            },
        });

        // 2. Check stock was restored
        expect(restoreStockMock).toHaveBeenCalledTimes(1);

        // 3. Check status is updated to REFUNDED
        expect(result.outcome.status).toBe(SubOrderStatus.REFUNDED);
        expect(result.outcome.refunded).toBe(true);
        expect(result.outcome.refundId).toBe("rfnd_cancellation_test_123");
        expect(mockSubOrder.delivery.status).toBe("CANCELLED");
    });

    test("COD order cancels without calling Razorpay refund", async () => {
        const mockSubOrder = {
            _id: "6a896a08c3e5c8d64eeb9a4b",
            subOrderId: "QB-4114272319-S1",
            parentOrderId: "6a8969cbc3e5c8d64eeb9a49",
            payableAmount: 499,
            items: [
                {
                    productId: "6a809c8da011bd545c686f32",
                    sku: "QUI-CLO-E4COQ-M-WHITE",
                    quantity: 1,
                },
            ],
            delivery: { status: "UNASSIGNED" },
            timeline: [],
            save: mock(() => Promise.resolve()),
        };

        // Mock COD parent order (no razorpayPaymentId)
        SubOrderService.parentOrderOf = mock(() =>
            Promise.resolve({
                orderId: "QB-4114272319",
                userId: "6a8968fdc3e5c8d64eeb9a2a",
                paymentInfo: {},
            })
        );
        SubOrderService.syncParentOrderStatus = mock(() => Promise.resolve());
        SubOrderService.publishUpdate = mock(() => Promise.resolve());

        const result = await SubOrderService.processCancellationRefund(
            mockSubOrder,
            "Customer cancelled",
            "CUSTOMER_1",
            "CUSTOMER"
        );

        expect(razorpayRefundMock).not.toHaveBeenCalled();
        expect(restoreStockMock).toHaveBeenCalledTimes(1);
        expect(result.outcome.status).toBe(SubOrderStatus.CANCELLED);
        expect(result.outcome.refunded).toBe(false);
    });
});
