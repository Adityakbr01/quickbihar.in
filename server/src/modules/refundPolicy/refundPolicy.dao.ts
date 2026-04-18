import { RefundPolicy } from "./refundPolicy.model";

export class RefundPolicyDAO {
    static async create(data: { title: string; content: string }) {
        return await RefundPolicy.create(data);
    }

    static async findAll() {
        return await RefundPolicy.find().sort({ createdAt: -1 });
    }

    static async findActive() {
        return await RefundPolicy.findOne({ isActive: true }).sort({ createdAt: -1 });
    }

    static async findById(id: string) {
        return await RefundPolicy.findById(id);
    }

    static async updateById(id: string, data: any) {
        return await RefundPolicy.findByIdAndUpdate(id, data, { new: true });
    }

    static async deleteById(id: string) {
        return await RefundPolicy.findByIdAndDelete(id);
    }
}
