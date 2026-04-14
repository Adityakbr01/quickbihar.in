import { ApiError } from "../../utils/ApiError";
import { Order } from "../order/order.model";
import { couponDAO } from "./coupon.dao";
import type { ICoupon } from "./coupon.type";

export class CouponService {
    async createCoupon(data: Partial<ICoupon>) {
        const existing = await couponDAO.findByCode(data.code || "");
        if (existing) {
            throw new ApiError(400, "Coupon code already exists");
        }
        return await couponDAO.create(data);
    }

    async getCoupons(query: any) {
        return await couponDAO.findAll(query);
    }

    async getCouponById(id: string) {
        const coupon = await couponDAO.findById(id);
        if (!coupon) throw new ApiError(404, "Coupon not found");
        return coupon;
    }

    async updateCoupon(id: string, data: Partial<ICoupon>) {
        const coupon = await couponDAO.update(id, data);
        if (!coupon) throw new ApiError(404, "Coupon not found");
        return coupon;
    }

    async deleteCoupon(id: string) {
        const coupon = await couponDAO.delete(id);
        if (!coupon) throw new ApiError(404, "Coupon not found");
        return coupon;
    }

    async validateCoupon(code: string, orderAmount: number, userId: string) {
        const coupon = await couponDAO.findByCode(code);

        if (!coupon) {
            throw new ApiError(404, "Invalid coupon code");
        }

        if (!coupon.isActive) {
            throw new ApiError(400, "Coupon is inactive");
        }

        if (new Date() > coupon.endDate) {
            throw new ApiError(400, "Coupon has expired");
        }

        if (new Date() < coupon.startDate) {
            throw new ApiError(400, "Coupon is not yet active");
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            throw new ApiError(400, "Coupon usage limit reached");
        }

        if (orderAmount < coupon.minOrderValue) {
            throw new ApiError(400, `Minimum order value of ₹${coupon.minOrderValue} required`);
        }

        // Check user usage limit (usageLimitPerUser)
        const userUsageCount = await Order.countDocuments({ 
            userId, 
            couponCode: code,
            status: { $nin: ["CANCELLED", "FAILED"] } 
        });

        if (userUsageCount >= coupon.usageLimitPerUser) {
            throw new ApiError(400, `You have already used this coupon ${coupon.usageLimitPerUser} time(s)`);
        }

        let discountAmount = 0;
        if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (orderAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        return {
            coupon,
            discountAmount,
            finalAmount: orderAmount - discountAmount,
        };
    }

    async incrementUsage(code: string) {
        return await couponDAO.updateByCode(code, { $inc: { usedCount: 1 } });
    }
}

export const couponService = new CouponService();
