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
        return await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    }

    async findAll(query: any = {}) {
        return await Coupon.find(query).sort({ createdAt: -1 });
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
