import type { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import * as newsletterService from "./newsletter.service";
import { subscribeSchema } from "./newsletter.validator";

/**
 * Subscribes an email to the newsletter (public — used by the
 * storefront "Be the first to know" signup).
 *
 * @route POST /api/v1/newsletter/subscribe
 * @access Public
 */
export const subscribe = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = subscribeSchema.parse(req.body);

    const result = await newsletterService.subscribe(
        validatedData.email,
        validatedData.vertical,
        validatedData.source
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            result,
            result.alreadySubscribed
                ? "You're already on the list."
                : "Subscribed successfully."
        )
    );
});
