import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { fulfillmentEventService } from "./fulfillmentEvent.service";

export class FulfillmentEventController {
  static listMine = asyncHandler(async (req, res) => {
    const events = await fulfillmentEventService.listForUser((req as any).user, req.query);
    return res.status(200).json(new ApiResponse(200, events, "Fulfillment events fetched successfully"));
  });
}
