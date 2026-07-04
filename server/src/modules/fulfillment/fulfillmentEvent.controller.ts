import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as fulfillmentEventService from "./fulfillmentEvent.service";

/**
 * Returns the authenticated user's fulfillment event feed.
 * Resolves visibility from the caller's identity and role rooms; supports
 * `limit` and `after` (cursor) query params for pagination.
 *
 * @route GET /api/v1/events
 * @access Protected
 */
export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const events = await fulfillmentEventService.listForUser((req as any).user, req.query);
  return res.status(200).json(new ApiResponse(200, events, "Fulfillment events fetched successfully"));
});
