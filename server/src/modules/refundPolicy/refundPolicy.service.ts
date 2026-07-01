/**
 * Refund-policy business logic.
 *
 * Applies domain defaults (e.g. `policyType` fallback), builds list filters and maps missing
 * records to 404 `ApiError`s. All persistence is delegated to `RefundPolicyDAO`.
 */
import * as RefundPolicyDAO from "./refundPolicy.dao";
import { ApiError } from "../../utils/ApiError";

/** Create a policy, defaulting its type to `REFUND` when the caller omits one. */
export async function createPolicy(data: any) {
    return await RefundPolicyDAO.create({
        ...data,
        policyType: data.policyType || "REFUND",
    });
}

/** Return the active policy for a type, or 404 if none is currently active. */
export async function getActivePolicy(policyType?: string) {
    const policy = await RefundPolicyDAO.findActive(policyType);
    if (!policy) {
        throw new ApiError(404, "Active Refund Policy not found");
    }
    return policy;
}

/** List policies, translating the query flags into a DAO filter. */
export async function getAllPolicies(query: { type?: string; activeOnly?: boolean } = {}) {
    const filter: Record<string, unknown> = {};
    if (query.type) filter.policyType = query.type;
    if (query.activeOnly) filter.isActive = true;
    return await RefundPolicyDAO.findAll(filter);
}

/** Apply a partial update or fail with 404 if the policy is missing. */
export async function updatePolicy(id: string, data: any) {
    const policy = await RefundPolicyDAO.updateById(id, data);
    if (!policy) {
        throw new ApiError(404, "Refund Policy not found");
    }
    return policy;
}

/** Soft-delete a policy or fail with 404 if it does not exist. */
export async function deletePolicy(id: string) {
    const policy = await RefundPolicyDAO.deleteById(id);
    if (!policy) {
        throw new ApiError(404, "Refund Policy not found");
    }
    return policy;
}
