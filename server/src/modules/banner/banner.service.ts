import { ApiError } from "../../utils/ApiError";
import { BannerDAO } from "./banner.dao";
import { createBannerSchema, updateBannerSchema, type CreateBannerBody, type UpdateBannerBody } from "./banner.validation";
import { ZodError } from "zod";

export class BannerService {
    static async createBanner(bannerData: any) {
        try {
            const validatedData: CreateBannerBody = createBannerSchema.parse(bannerData);
            const banner = await BannerDAO.createBanner(validatedData);
            if (!banner) {
                throw new ApiError(500, "Failed to create banner");
            }
            return banner;
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ApiError(400, "Validation Error", error.issues as any);
            }
            throw error;
        }
    }

    static async getPublicBanners(placement?: string) {
        return await BannerDAO.findActiveBanners(placement);
    }

    static async getAllBanners() {
        return await BannerDAO.findAllBanners();
    }

    static async getBannerById(id: string) {
        const banner = await BannerDAO.findById(id);
        if (!banner) {
            throw new ApiError(404, "Banner not found");
        }
        return banner;
    }

    static async updateBanner(id: string, updateData: any) {
        try {
            const validatedData: UpdateBannerBody = updateBannerSchema.parse(updateData);
            const banner = await BannerDAO.updateById(id, validatedData);
            if (!banner) {
                throw new ApiError(404, "Banner not found or update failed");
            }
            return banner;
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ApiError(400, "Validation Error", error.issues as any);
            }
            throw error;
        }
    }

    static async deleteBanner(id: string) {
        const result = await BannerDAO.deleteById(id);
        if (!result) {
            throw new ApiError(404, "Banner not found");
        }
        return result;
    }

    static async trackClick(id: string) {
        const banner = await BannerDAO.incrementClicks(id);
        if (!banner) {
            throw new ApiError(404, "Banner not found");
        }
        return banner;
    }

    static async trackImpression(id: string) {
        const banner = await BannerDAO.incrementImpressions(id);
        if (!banner) {
            throw new ApiError(404, "Banner not found");
        }
        return banner;
    }
}
