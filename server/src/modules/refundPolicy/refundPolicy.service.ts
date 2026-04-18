import { RefundPolicyDAO } from "./refundPolicy.dao";
import { ApiError } from "../../utils/ApiError";

export class RefundPolicyService {
    async createPolicy(data: any) {
        return await RefundPolicyDAO.create(data);
    }

    async getActivePolicy() {
        const policy = await RefundPolicyDAO.findActive();
        if (!policy) {
            throw new ApiError(404, "Active Refund Policy not found");
        }
        return policy;
    }

    async getAllPolicies() {
        return await RefundPolicyDAO.findAll();
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
