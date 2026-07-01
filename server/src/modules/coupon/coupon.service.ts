/**
 * Coupon business logic.
 *
 * Owns coupon lifecycle (CRUD) plus the two redemption paths used at checkout:
 *  - `validateCouponForCart` — per-seller, item-aware validation used by the cart.
 *  - `validateCoupon`        — order-total validation with optional per-seller subtotals.
 * Both enforce activeness, window, global usage caps and per-user usage caps before
 * computing a (capped) discount. Persistence is delegated to `couponDAO`.
 */
import { ApiError } from "../../utils/ApiError";
import { Order } from "../order/order.model";
import * as couponDAO from "./coupon.dao";
import type { ICoupon } from "./coupon.type";
import { Product } from "../products/product.model";

/** Create a coupon, rejecting duplicate codes. */
export async function createCoupon(data: Partial<ICoupon>) {
    const existing = await couponDAO.findByCode(data.code || "");
    if (existing) {
        throw new ApiError(400, "Coupon code already exists");
    }
    return await couponDAO.create(data);
}

/** List coupons (paginated when query params are present). */
export async function getCoupons(query: any) {
    return await couponDAO.findAll(query);
}

/** Fetch a coupon or fail with 404. */
export async function getCouponById(id: string) {
    const coupon = await couponDAO.findById(id);
    if (!coupon) throw new ApiError(404, "Coupon not found");
    return coupon;
}

/** Update a coupon or fail with 404. */
export async function updateCoupon(id: string, data: Partial<ICoupon>) {
    const coupon = await couponDAO.update(id, data);
    if (!coupon) throw new ApiError(404, "Coupon not found");
    return coupon;
}

/** Delete a coupon or fail with 404. */
export async function deleteCoupon(id: string) {
    const coupon = await couponDAO.delete(id);
    if (!coupon) throw new ApiError(404, "Coupon not found");
    return coupon;
}

/**
 * Validate a coupon against the actual cart items.
 *
 * A coupon is seller-scoped: only items belonging to the coupon's seller (and, when
 * `appliesTo === "SPECIFIC"`, only its whitelisted products) contribute to the eligible
 * subtotal. GST is folded into the item price so the discount base matches what the buyer
 * actually pays. Returns the coupon, the (rounded) discount and the eligible subtotal.
 */
export async function validateCouponForCart(
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

    // Per-user usage cap: count the buyer's prior non-cancelled orders that used this code.
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

/**
 * Validate several coupon codes for one cart, enforcing the "one coupon per seller" rule.
 * Reuses `validateCouponForCart` per code and rejects a second code that targets a seller
 * already covered.
 */
export async function validateMultipleCouponsForCart(
    codes: string[],
    items: { productId: string; sku: string; quantity: number }[],
    userId: string
) {
    const results = [];
    const seenSellers = new Set<string>();

    for (const code of codes) {
        const validation = await validateCouponForCart(code, items, userId);
        if (seenSellers.has(validation.sellerId)) {
            throw new ApiError(400, `Only one coupon can be applied per seller. Multiple coupons found for seller.`);
        }
        seenSellers.add(validation.sellerId);
        results.push(validation);
    }

    return results;
}

/**
 * Validate a coupon against an order total (no item breakdown).
 *
 * For SELLER-scoped coupons the discount base is the matching seller subtotal from
 * `context.sellerSubtotals` rather than the whole order, so a seller coupon can't discount
 * another seller's goods. Returns coupon, discount and the resulting final amount.
 */
export async function validateCoupon(
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

    // Per-user usage cap (usageLimitPerUser).
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

/** Atomically bump a coupon's global usage counter after a successful redemption. */
export async function incrementUsage(code: string) {
    return await couponDAO.updateByCode(code, { $inc: { usedCount: 1 } });
}
