import { RefundPolicyDAO } from "./refundPolicy.dao";
import { ApiError } from "../../utils/ApiError";

export class RefundPolicyService {
    async createPolicy(data: any) {
        return await RefundPolicyDAO.create({
            ...data,
            policyType: data.policyType || "REFUND",
        });
    }

    async getActivePolicy(policyType?: string) {
        const policy = await RefundPolicyDAO.findActive(policyType);
        if (!policy) {
            throw new ApiError(404, "Active Refund Policy not found");
        }
        return policy;
    }

    async getAllPolicies(query: { type?: string; activeOnly?: boolean } = {}) {
        const filter: Record<string, unknown> = {};
        if (query.type) filter.policyType = query.type;
        if (query.activeOnly) filter.isActive = true;
        return await RefundPolicyDAO.findAll(filter);
    }

    async updatePolicy(id: string, data: any) {
        const policy = await RefundPolicyDAO.updateById(id, data);
        if (!policy) {
            throw new ApiError(404, "Refund Policy not found");
        }
        return policy;
    }

    async deletePolicy(id: string) {
        const policy = await RefundPolicyDAO.deleteById(id);
        if (!policy) {
            throw new ApiError(404, "Refund Policy not found");
        }
        return policy;
    }
}

export const refundPolicyService = new RefundPolicyService();
