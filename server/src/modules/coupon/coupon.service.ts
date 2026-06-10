import { ApiError } from "../../utils/ApiError";
import { Order } from "../order/order.model";
import { couponDAO } from "./coupon.dao";
import type { ICoupon } from "./coupon.type";
import { Product } from "../products/product.model";

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

    async validateCouponForCart(
        code: string,
        items: { productId: string; sku: string; quantity: number }[],
        userId: string
    ) {
        const coupon = await couponDAO.findByCode(code);
        if (!coupon) throw new ApiError(404, "Invalid coupon code");
        if (!coupon.isActive) throw new ApiError(400, "Coupon is inactive");
        if (new Date() > coupon.endDate) throw new ApiError(400, "Coupon has expired");
        if (new Date() < coupon.startDate) throw new ApiError(400, "Coupon is not yet active");
        if (coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, "Coupon usage limit reached");

        // Check user usage limit
        const userUsageCount = await Order.countDocuments({
            userId,
            $or: [
                { couponCode: code },
                { couponCodes: code }
            ],
            status: { $nin: ["CANCELLED", "FAILED"] }
        });
        if (userUsageCount >= coupon.usageLimitPerUser) {
            throw new ApiError(400, `You have already used this coupon ${coupon.usageLimitPerUser} time(s)`);
        }

        const couponSellerIdStr = coupon.sellerId?.toString();
        const productIds = items.map(item => item.productId);
        const productsFromDb = await Product.find({ _id: { $in: productIds }, isDeleted: false });

        let eligibleSubtotal = 0;
        let eligibleItemsCount = 0;

        for (const item of items) {
            const product = productsFromDb.find(p => p._id.toString() === item.productId.toString());
            if (!product) continue;

            const itemSellerIdStr = product.sellerId?.toString();
            if (itemSellerIdStr !== couponSellerIdStr) {
                continue; // Coupon is seller-specific, ignore other seller items
            }

            if (coupon.appliesTo === "SPECIFIC") {
                const isEligibleProduct = coupon.productIds?.some(id => id.toString() === product._id.toString());
                if (!isEligibleProduct) continue;
            }

            const variant = product.variants.find(v => v.sku === item.sku);
            if (!variant) continue;

            const basePrice = product.price;
            const itemPrice = Math.round(product.isGstApplicable
                ? basePrice * (1 + (product.gstPercentage || 0) / 100)
                : basePrice);

            eligibleSubtotal += itemPrice * item.quantity;
            eligibleItemsCount++;
        }

        if (eligibleItemsCount === 0) {
            throw new ApiError(400, "This coupon is not applicable to any products in your cart");
        }

        if (eligibleSubtotal < coupon.minOrderValue) {
            throw new ApiError(400, `Minimum order value of ₹${coupon.minOrderValue} required for this seller's products`);
        }

        let discountAmount = 0;
        if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }
        } else {
            discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
        }

        discountAmount = Math.round(discountAmount);

        return {
            coupon,
            discountAmount,
            eligibleSubtotal,
            sellerId: couponSellerIdStr || "",
        };
    }

    async validateMultipleCouponsForCart(
        codes: string[],
        items: { productId: string; sku: string; quantity: number }[],
        userId: string
    ) {
        const results = [];
        const seenSellers = new Set<string>();

        for (const code of codes) {
            const validation = await this.validateCouponForCart(code, items, userId);
            if (seenSellers.has(validation.sellerId)) {
                throw new ApiError(400, `Only one coupon can be applied per seller. Multiple coupons found for seller.`);
            }
            seenSellers.add(validation.sellerId);
            results.push(validation);
        }

        return results;
    }

    async validateCoupon(
        code: string,
        orderAmount: number,
        userId: string,
        context: { sellerSubtotals?: Record<string, number> } = {},
    ) {
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

        const couponScope = (coupon as any).scope || "GLOBAL";
        const couponSellerId = (coupon as any).sellerId?.toString();
        const discountBaseAmount = couponScope === "SELLER"
            ? context.sellerSubtotals?.[couponSellerId || ""] || 0
            : orderAmount;

        if (couponScope === "SELLER" && !discountBaseAmount) {
            throw new ApiError(400, "This seller coupon is not applicable to your cart");
        }

        if (discountBaseAmount < coupon.minOrderValue) {
            throw new ApiError(400, `Minimum order value of ₹${coupon.minOrderValue} required`);
        }

        // Check user usage limit (usageLimitPerUser)
        const userUsageCount = await Order.countDocuments({ 
            userId, 
            $or: [
                { couponCode: code },
                { couponCodes: code }
            ],
            status: { $nin: ["CANCELLED", "FAILED"] } 
        });

        if (userUsageCount >= coupon.usageLimitPerUser) {
            throw new ApiError(400, `You have already used this coupon ${coupon.usageLimitPerUser} time(s)`);
        }

        let discountAmount = 0;
        if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (discountBaseAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }
        } else {
            discountAmount = Math.min(coupon.discountValue, discountBaseAmount);
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
