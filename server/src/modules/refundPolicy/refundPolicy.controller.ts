/**
 * Refund-policy HTTP controllers.
 *
 * `asyncHandler`-wrapped Express handlers owning request/response concerns only — required-field
 * checks, status codes, envelope shape — while delegating all domain rules to `refundPolicyService`.
 */
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as refundPolicyService from "./refundPolicy.service";
import { ApiError } from "../../utils/ApiError";

/** POST / — create a refund policy; `name` is required. */
export const createRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400, "Name is required");
    }
    const policy = await refundPolicyService.createPolicy(req.body);
    return res.status(201).json(new ApiResponse(201, policy, "Refund policy created successfully"));
});

/** GET /active — the currently active policy for an optional type. */
export const getActiveRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const policy = await refundPolicyService.getActivePolicy(req.query.type as string | undefined);
    return res.status(200).json(new ApiResponse(200, policy, "Active refund policy fetched successfully"));
});

/** GET /all — every policy, optionally filtered by type (admin view). */
export const getAllRefundPolicies = asyncHandler(async (req: Request, res: Response) => {
    const policies = await refundPolicyService.getAllPolicies({ type: req.query.type as string | undefined });
    return res.status(200).json(new ApiResponse(200, policies, "All refund policies fetched successfully"));
});

/** PATCH /:id — update a policy. */
export const updateRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const policy = await refundPolicyService.updatePolicy(id, req.body);
    return res.status(200).json(new ApiResponse(200, policy, "Refund policy updated successfully"));
});

/** DELETE /:id — soft-delete a policy. */
export const deleteRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await refundPolicyService.deletePolicy(id);
    return res.status(200).json(new ApiResponse(200, null, "Refund policy deleted successfully"));
});
