import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { BannerService } from "./banner.service";
import { uploadToImageKit, deleteFromImageKit } from "../../utils/imagekit.util";
import { ApiError } from "../../utils/ApiError";

export class BannerController {
    static createBanner = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            throw new ApiError(400, "Banner image is required");
        }

        // Upload to ImageKit
        const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname);
        
        // Add image info to body for service/validation
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

    static getPublicBanners = asyncHandler(async (req: Request, res: Response) => {
        const banners = await BannerService.getPublicBanners(req.query);
        return res
            .status(200)
            .json(new ApiResponse(200, banners, "Banners fetched successfully"));
    });

    static getAllBanners = asyncHandler(async (req: Request, res: Response) => {
        const banners = await BannerService.getAllBanners();
        return res
            .status(200)
            .json(new ApiResponse(200, banners, "All banners fetched successfully"));
    });

    static getBannerById = asyncHandler(async (req: Request, res: Response) => {
        const banner = await BannerService.getBannerById(req.params.id as unknown as string);
        return res
            .status(200)
            .json(new ApiResponse(200, banner, "Banner fetched successfully"));
    });

    static updateBanner = asyncHandler(async (req: Request, res: Response) => {
        const oldBanner = await BannerService.getBannerById(req.params.id as unknown as string);
        let bannerData = { ...req.body };

        // If a new file is uploaded
        if (req.file) {
            const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname);
            bannerData.image = uploadResult.url;
            bannerData.imagePublicId = uploadResult.fileId;
        }

        const banner = await BannerService.updateBanner(req.params.id as unknown as string, bannerData);
        
        // If update successful and new image was uploaded, delete old one
        if (req.file && oldBanner.imagePublicId) {
            await deleteFromImageKit(oldBanner.imagePublicId);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, banner, "Banner updated successfully"));
    });

    static deleteBanner = asyncHandler(async (req: Request, res: Response) => {
        const banner = await BannerService.getBannerById(req.params.id as unknown as string);
        
        // Delete from ImageKit first
        if (banner.imagePublicId) {
            await deleteFromImageKit(banner.imagePublicId);
        }

        await BannerService.deleteBanner(req.params.id as unknown as string);
        
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Banner deleted successfully"));
    });

    static trackClick = asyncHandler(async (req: Request, res: Response) => {
        const banner = await BannerService.trackClick(req.params.id as unknown as string);
        return res
            .status(200)
            .json(new ApiResponse(200, banner, "Click tracked successfully"));
    });
}
