import { RefundPolicy } from "./refundPolicy.model";
import type { IRefundPolicy } from "./refundPolicy.type";

export class RefundPolicyDAO {
    static async create(data: Partial<IRefundPolicy>) {
        return await RefundPolicy.create(data);
    }

    static async findAll(filter: Record<string, unknown> = {}) {
        return await RefundPolicy.find(filter).sort({ policyType: 1, createdAt: -1 });
    }

    static async findActive(policyType?: string) {
        return await RefundPolicy.findOne({ isActive: true, ...(policyType ? { policyType } : {}) }).sort({ createdAt: -1 });
    }

    static async findById(id: string) {
        return await RefundPolicy.findById(id);
    }

    static async updateById(id: string, data: any) {
        return await RefundPolicy.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    }

    static async deleteById(id: string) {
        return await RefundPolicy.findByIdAndUpdate(id, { isActive: false }, { returnDocument: "after" });
    }
}
