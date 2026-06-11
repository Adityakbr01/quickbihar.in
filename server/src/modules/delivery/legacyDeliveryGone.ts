import type { RequestHandler } from "express";
import { ApiResponse } from "../../utils/ApiResponse";

export const legacyParentDeliveryGone: RequestHandler = (_req, res) => {
    return res.status(410).json(
        new ApiResponse(
            410,
            {
                replacement: "/api/v1/delivery/sub-orders/:id/*",
            },
            "Legacy parent-order delivery mutations are retired. Use sub-order fulfillment endpoints.",
        ),
    );
};
