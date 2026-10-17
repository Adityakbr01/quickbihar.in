import { describe, test, expect, mock, beforeEach } from "bun:test";
import crypto from "crypto";

process.env.RAZORPAY_KEY_ID = "dummy_key";
process.env.RAZORPAY_KEY_SECRET = "dummy_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "dummy_webhook_secret_123";

import { orderService } from "@/modules/common/order/order.service";
import { User } from "@/modules/common/user/user.model";
import { SavedAddress } from "@/modules/common/savedAddress/savedAddresses.model";
import { orderDAO } from "@/modules/common/order/order.dao";
import { OrderStatus } from "@/modules/common/order/order.type";
import { verifyRazorpayWebhookSignature } from "@/utils/razorpay.util";

describe("Checkout Optimization & Anti-RTO Tests", () => {
    test("verifyRazorpayWebhookSignature validates legitimate webhook payload", () => {
        const payload = JSON.stringify({ event: "order.paid", id: "evt_123" });
        const secret = "dummy_webhook_secret_123";
        const signature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");

        const isValid = verifyRazorpayWebhookSignature(payload, signature, secret);
        expect(isValid).toBe(true);

        const isInvalid = verifyRazorpayWebhookSignature(payload, "forged_signature", secret);
        expect(isInvalid).toBe(false);
    });

    test("confirmPaidOrder transitions PENDING_PAYMENT to PENDING_SELLER_CONFIRMATION", async () => {
        const mockOrder = {
            _id: "6a8969cbc3e5c8d64eeb9a48",
            orderId: "QB-TEST-123",
            status: OrderStatus.PENDING_PAYMENT,
            items: [],
            payableAmount: 500,
        };

        orderDAO.findByRazorpayOrderId = mock(() => Promise.resolve(mockOrder as any));
        (orderService as any).deductOrderStock = mock(() => Promise.resolve());
        (orderService as any).finalizePendingConfirmation = mock(() => Promise.resolve());
        orderDAO.updateStatus = mock((id, status, payId, sig) =>
            Promise.resolve({ ...mockOrder, status, paymentInfo: { razorpayPaymentId: payId } })
        );

        const result = await orderService.confirmPaidOrder("order_rzp_123", "pay_rzp_456", "sig_rzp_789");
        expect(result.status).toBe(OrderStatus.CONFIRMED); // maskOrderForCustomer maps PENDING_SELLER_CONFIRMATION to CONFIRMED
        expect((orderService as any).deductOrderStock).toHaveBeenCalledTimes(1);
    });

    test("confirmPaidOrder is idempotent and skips duplicate payment confirmations", async () => {
        const alreadyConfirmedOrder = {
            _id: "6a8969cbc3e5c8d64eeb9a48",
            orderId: "QB-TEST-ALREADY",
            status: OrderStatus.PENDING_SELLER_CONFIRMATION,
            items: [],
            payableAmount: 500,
        };

        orderDAO.findByRazorpayOrderId = mock(() => Promise.resolve(alreadyConfirmedOrder as any));
        (orderService as any).deductOrderStock = mock(() => Promise.resolve());

        const result = await orderService.confirmPaidOrder("order_rzp_123", "pay_rzp_456");
        expect(result.status).toBe(OrderStatus.CONFIRMED);
        expect((orderService as any).deductOrderStock).not.toHaveBeenCalled();
    });

    test("createOrder blocks unverified phone numbers from placing COD orders", async () => {
        User.findById = mock(() => ({
            select: () => ({
                lean: () => Promise.resolve({ phone: "9876543210", isPhoneVerified: false }),
            }),
        })) as any;

        SavedAddress.findOne = mock(() => ({
            lean: () => Promise.resolve(null),
        })) as any;

        const codOrderData = {
            paymentMethod: "COD",
            shippingAddress: {
                fullName: "Test Customer",
                phone: "9876543210",
                street: "123 Main St",
                city: "Patna",
                state: "Bihar",
                pincode: "800001",
                latitude: 25.5941,
                longitude: 85.1376,
            },
            items: [],
        };

        expect(
            orderService.createOrder("6a8969cbc3e5c8d64eeb9a48", codOrderData)
        ).rejects.toThrow("Mobile number verification via WhatsApp OTP is required");
    });
});
