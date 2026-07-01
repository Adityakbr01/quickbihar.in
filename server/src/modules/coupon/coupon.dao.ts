/**
 * Coupon data-access layer.
 *
 * All Mongoose queries for the `Coupon` collection live here so the service layer stays
 * persistence-agnostic. `findByCode` intentionally filters to active + approved coupons so
 * validation flows can never redeem a draft/rejected code.
 */
import { Coupon } from "./coupon.model";
import type { ICoupon } from "./coupon.type";

/** Persist a new coupon. */
export async function create(data: Partial<ICoupon>) {
    return await Coupon.create(data);
}

/** Fetch a coupon by id (no status filtering — admin/detail use). */
export async function findById(id: string) {
    return await Coupon.findById(id);
}

/** Resolve a redeemable coupon by code: uppercased, active, and approved (or legacy un-flagged). */
export async function findByCode(code: string) {
    return await Coupon.findOne({
        code: code.toUpperCase(),
        isActive: true,
        $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }],
    });
}

/**
 * List coupons. With no query params returns the full list (admin bootstrap); with any
 * filter/pagination param it returns a paginated envelope. Sort field is whitelisted to
 * avoid arbitrary-field sort injection.
 */
export async function findAll(query: any = {}) {
    const hasQuery = Object.keys(query || {}).length > 0;
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (query.search) {
        const searchRegex = new RegExp(String(query.search).trim(), "i");
        filter.$or = [
            { code: searchRegex },
            { description: searchRegex },
        ];
    }

    if (query.discountType && query.discountType !== "ALL") {
        filter.discountType = query.discountType;
    }

    if (query.status === "active") {
        filter.isActive = true;
        filter.endDate = { $gte: new Date() };
    }

    if (query.status === "inactive") filter.isActive = false;
    if (query.status === "expired") filter.endDate = { $lt: new Date() };
    if (query.scope && query.scope !== "ALL") filter.scope = query.scope;
    if (query.sellerId) filter.sellerId = query.sellerId;
    if (query.storeId) filter.storeId = query.storeId;
    if (query.approvalStatus && query.approvalStatus !== "ALL") filter.approvalStatus = query.approvalStatus;

    const sortField = ["createdAt", "code", "discountValue", "endDate", "usageLimit"].includes(query.sortBy)
        ? query.sortBy
        : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;

    if (!hasQuery) {
        return await Coupon.find(filter).sort({ createdAt: -1 });
    }

    const [data, total] = await Promise.all([
        Coupon.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit),
        Coupon.countDocuments(filter),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/** Update a coupon by id. */
export async function update(id: string, data: Partial<ICoupon>) {
    return await Coupon.findByIdAndUpdate(id, data, { returnDocument: 'after' });
}

/**
 * Delete a coupon by id.
 * Declared as `deleteCoupon` because `delete` is a reserved word; re-exported below as
 * `delete` so call sites keep using `couponDAO.delete(id)`.
 */
async function deleteCoupon(id: string) {
    return await Coupon.findByIdAndDelete(id);
}
export { deleteCoupon as delete };

/** Apply an atomic update (e.g. `$inc` usage) keyed by coupon code. */
export async function updateByCode(code: string, data: any) {
    return await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, data, { returnDocument: 'after' });
}
