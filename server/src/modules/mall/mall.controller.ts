import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as MallService from "./mall.service";

/**
 * Lists all publicly visible malls.
 *
 * @route GET /api/v1/malls
 * @access Public
 */
export const listPublic = asyncHandler(async (_req: Request, res: Response) => {
    const malls = await MallService.listPublicMalls();
    return res.status(200).json(new ApiResponse(200, malls, "Malls fetched successfully"));
});

/**
 * Lists the top (featured) malls for the homepage rail.
 *
 * @route GET /api/v1/malls/top
 * @access Public
 */
export const top = asyncHandler(async (_req: Request, res: Response) => {
    const malls = await MallService.getTopMalls(10);
    return res.status(200).json(new ApiResponse(200, malls, "Top malls fetched successfully"));
});

/**
 * Returns the full detail view for a single mall.
 *
 * @route GET /api/v1/malls/:id
 * @access Public
 */
export const getDetail = asyncHandler(async (req: Request, res: Response) => {
    const data = await MallService.getMallDetail(req.params.id as string);
    // console.log("[SERVER_DEBUG] Mall details response data:", JSON.stringify(data, null, 2));
    return res.status(200).json(new ApiResponse(200, data, "Mall details fetched successfully"));
});

/**
 * Submits (creates or updates) the authenticated user's review for a mall.
 *
 * @route POST /api/v1/malls/:id/reviews
 * @access Protected
 */
export const postReview = asyncHandler(async (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    const review = await MallService.postMallReview(req.params.id as string, (req as any).user._id, { rating, comment });
    return res.status(200).json(new ApiResponse(200, review, "Review submitted successfully"));
});
