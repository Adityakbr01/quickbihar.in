/**
 * App-config HTTP controllers.
 *
 * Expose the public read and admin-only update endpoints for the singleton application
 * configuration, handling validation and response shaping while delegating logic to
 * `appConfigService`.
 */
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as appConfigService from "./appConfig.service";
import { updateAppConfigSchema } from "./appConfig.validation";
import { ApiError } from "../../utils/ApiError";

/** GET / — public read of the current application configuration. */
export const getAppConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = await appConfigService.getConfig();
    return res.status(200).json(new ApiResponse(200, config, "App configuration fetched successfully"));
});

/** PATCH / — admin update of the configuration; rejects invalid payloads with a 400. */
export const updateAppConfig = asyncHandler(async (req: Request, res: Response) => {
    const validation = updateAppConfigSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ApiError(400, "Invalid configuration data", validation.error.issues.map(err => err.message));
    }

    const userId = (req as any).user?._id;
    const config = await appConfigService.updateConfig(validation.data, userId);

    return res.status(200).json(new ApiResponse(200, config, "App configuration updated successfully"));
});
