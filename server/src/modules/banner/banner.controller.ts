/**
 * Banner HTTP controllers.
 *
 * Each handler is an `asyncHandler`-wrapped Express function that owns request/response
 * concerns only — file uploads, status codes, envelope shape — and delegates all business
 * rules to `BannerService`. Errors thrown here are funneled to the global error handler.
 */
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as BannerService from "./banner.service";
import { uploadToImageKit, deleteFromImageKit } from "../../utils/imagekit.util";
import { ApiError } from "../../utils/ApiError";

/** POST / — create a banner from multipart body + required image. */
export const createBanner = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new ApiError(400, "Banner image is required");
    }

    // Upload the raw buffer to ImageKit and enrich the payload the service will validate.
    const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname);
    const bannerData = {
        ...req.body,
        image: uploadResult.url,
        imagePublicId: uploadResult.fileId
    };

    const banner = await BannerService.createBanner(bannerData);

    return res
        .status(201)
        .json(new ApiResponse(201, banner, "Banner created successfully"));
});

/** GET / — active storefront banners for the current viewer. */
export const getPublicBanners = asyncHandler(async (req: Request, res: Response) => {
    const banners = await BannerService.getPublicBanners(req.query);
    return res
        .status(200)
        .json(new ApiResponse(200, banners, "Banners fetched successfully"));
});

/** GET /all — full banner list for the admin panel. */
export const getAllBanners = asyncHandler(async (_req: Request, res: Response) => {
    const banners = await BannerService.getAllBanners();
    return res
        .status(200)
        .json(new ApiResponse(200, banners, "All banners fetched successfully"));
});

/** GET /:id — single banner. */
export const getBannerById = asyncHandler(async (req: Request, res: Response) => {
    const banner = await BannerService.getBannerById(req.params.id as unknown as string);
    return res
        .status(200)
        .json(new ApiResponse(200, banner, "Banner fetched successfully"));
});

/** PATCH /:id — update fields and optionally swap the image, cleaning up the old asset. */
export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const oldBanner = await BannerService.getBannerById(req.params.id as unknown as string);
    let bannerData = { ...req.body };

    if (req.file) {
        const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname);
        bannerData.image = uploadResult.url;
        bannerData.imagePublicId = uploadResult.fileId;
    }

    const banner = await BannerService.updateBanner(req.params.id as unknown as string, bannerData);

    // Only delete the previous asset once the DB update has succeeded, to avoid orphaning a live image.
    if (req.file && oldBanner.imagePublicId) {
        await deleteFromImageKit(oldBanner.imagePublicId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, banner, "Banner updated successfully"));
});

/** DELETE /:id — remove the ImageKit asset first, then the DB record. */
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await BannerService.getBannerById(req.params.id as unknown as string);

    if (banner.imagePublicId) {
        await deleteFromImageKit(banner.imagePublicId);
    }

    await BannerService.deleteBanner(req.params.id as unknown as string);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Banner deleted successfully"));
});

/** POST /:id/click — analytics click tracking. */
export const trackClick = asyncHandler(async (req: Request, res: Response) => {
    const banner = await BannerService.trackClick(req.params.id as unknown as string);
    return res
        .status(200)
        .json(new ApiResponse(200, banner, "Click tracked successfully"));
});
