/**
 * Refund-policy data-access layer.
 *
 * Thin wrappers around the `RefundPolicy` model. Note that "delete" is a soft toggle
 * (`isActive: false`) rather than a hard removal — that policy-retention rule lives here.
 */
import { RefundPolicy } from "./refundPolicy.model";
import type { IRefundPolicy } from "./refundPolicy.type";

/** Persist a new refund policy. */
export async function create(data: Partial<IRefundPolicy>) {
    return await RefundPolicy.create(data);
}

/** List policies, optionally filtered, ordered by type then recency. */
export async function findAll(filter: Record<string, unknown> = {}) {
    return await RefundPolicy.find(filter).sort({ policyType: 1, createdAt: -1 });
}

/** Most recent active policy, optionally scoped to a policy type. */
export async function findActive(policyType?: string) {
    return await RefundPolicy.findOne({ isActive: true, ...(policyType ? { policyType } : {}) }).sort({ createdAt: -1 });
}

/** Fetch a single policy by id. */
export async function findById(id: string) {
    return await RefundPolicy.findById(id);
}

/** Apply a partial update and return the fresh document. */
export async function updateById(id: string, data: any) {
    return await RefundPolicy.findByIdAndUpdate(id, data, { returnDocument: 'after' });
}

/** Soft-delete: mark the policy inactive rather than removing it, preserving history. */
export async function deleteById(id: string) {
    return await RefundPolicy.findByIdAndUpdate(id, { isActive: false }, { returnDocument: "after" });
}
