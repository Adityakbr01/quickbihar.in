import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { refundPolicyService } from "./refundPolicy.service";
import { ApiError } from "../../utils/ApiError";

export const createRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const { name, category } = req.body;
    if (!name || !category) {
        throw new ApiError(400, "Name and Category are required");
    }
    const policy = await refundPolicyService.createPolicy(req.body);
    return res.status(201).json(new ApiResponse(201, policy, "Refund policy created successfully"));
});

export const getActiveRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const policy = await refundPolicyService.getActivePolicy();
    return res.status(200).json(new ApiResponse(200, policy, "Active refund policy fetched successfully"));
});

export const getAllRefundPolicies = asyncHandler(async (req: Request, res: Response) => {
    const policies = await refundPolicyService.getAllPolicies();
    return res.status(200).json(new ApiResponse(200, policies, "All refund policies fetched successfully"));
});

export const updateRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const policy = await refundPolicyService.updatePolicy(id, req.body);
    return res.status(200).json(new ApiResponse(200, policy, "Refund policy updated successfully"));
});

export const deleteRefundPolicy = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await refundPolicyService.deletePolicy(id);
    return res.status(200).json(new ApiResponse(200, null, "Refund policy deleted successfully"));
});
