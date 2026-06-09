import { Coupon } from "./coupon.model";
import type { ICoupon } from "./coupon.type";

export class CouponDAO {
    async create(data: Partial<ICoupon>) {
        return await Coupon.create(data);
    }

    async findById(id: string) {
        return await Coupon.findById(id);
    }

    async findByCode(code: string) {
        return await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
            $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }],
        });
    }

    async findAll(query: any = {}) {
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

    async update(id: string, data: Partial<ICoupon>) {
        return await Coupon.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    }

    async delete(id: string) {
        return await Coupon.findByIdAndDelete(id);
    }

    async updateByCode(code: string, data: any) {
        return await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, data, { returnDocument: 'after' });
    }
}

export const couponDAO = new CouponDAO();
