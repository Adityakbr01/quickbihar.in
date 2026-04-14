import Razorpay from "razorpay";
import crypto from "crypto";
import { ENV } from "../config/env.config";

export const razorpay = new Razorpay({
    key_id: ENV.RAZORPAY_KEY_ID,
    key_secret: ENV.RAZORPAY_KEY_SECRET,
});

/**
 * Verifies Razorpay signature
 * @param orderId Razorpay Order ID
 * @param paymentId Razorpay Payment ID
 * @param signature Razorpay Signature
 * @returns boolean
 */
export const verifyRazorpaySignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    const body = orderId + "|" + paymentId;
    
    const expectedSignature = crypto
        .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    return expectedSignature === signature;
};
