/**
 * Banner business logic.
 *
 * Sits between the HTTP controller and the data-access layer: validates input with Zod,
 * applies domain rules (auto-priority, existence checks) and normalizes errors into
 * `ApiError`s. All persistence is delegated to `BannerDAO`.
 */
import { ApiError } from "../../utils/ApiError";
import * as BannerDAO from "./banner.dao";
import { createBannerSchema, updateBannerSchema, type CreateBannerBody, type UpdateBannerBody } from "./banner.validation";
import { ZodError } from "zod";

/**
 * Convert a Zod validation failure into a 400 `ApiError` while letting every other
 * error bubble up untouched. The global error handler treats a raw `ZodError` as a
 * generic 500, so this narrowing is what preserves proper validation responses.
 */
function toApiError(error: unknown): never {
    if (error instanceof ZodError) {
        throw new ApiError(400, "Validation Error", error.issues as any);
    }
    throw error;
}

/**
 * Create a banner. When no explicit priority is supplied the banner is appended to the
 * end of its placement lane (max priority + 1) so newly added banners never jump the queue.
 */
export async function createBanner(bannerData: any) {
    try {
        if (bannerData.priority === undefined || bannerData.priority === null || bannerData.priority === "") {
            const placement = bannerData.placement || "home_top";
            const maxPriority = await BannerDAO.getMaxPriority(placement);
            bannerData.priority = maxPriority + 1;
        }

        const validatedData: CreateBannerBody = createBannerSchema.parse(bannerData);
        const banner = await BannerDAO.createBanner(validatedData);
        if (!banner) {
            throw new ApiError(500, "Failed to create banner");
        }
        return banner;
    } catch (error) {
        toApiError(error);
    }
}

/** Public storefront banners, filtered to the active/approved/in-window set. */
export async function getPublicBanners(filters: any = {}) {
    return await BannerDAO.findActiveBanners(filters);
}

/** Admin listing; expired banners are deactivated first so the list reflects reality. */
export async function getAllBanners() {
    await BannerDAO.deactivateExpired();
    return await BannerDAO.findAllBanners();
}

/** Fetch a banner or fail with 404. */
export async function getBannerById(id: string) {
    const banner = await BannerDAO.findById(id);
    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }
    return banner;
}

/** Validate and apply a partial banner update. */
export async function updateBanner(id: string, updateData: any) {
    try {
        const validatedData: UpdateBannerBody = updateBannerSchema.parse(updateData);
        const banner = await BannerDAO.updateById(id, validatedData);
        if (!banner) {
            throw new ApiError(404, "Banner not found or update failed");
        }
        return banner;
    } catch (error) {
        toApiError(error);
    }
}

/** Delete a banner or fail with 404. */
export async function deleteBanner(id: string) {
    const result = await BannerDAO.deleteById(id);
    if (!result) {
        throw new ApiError(404, "Banner not found");
    }
    return result;
}

/** Record a click and return the updated banner. */
export async function trackClick(id: string) {
    const banner = await BannerDAO.incrementClicks(id);
    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }
    return banner;
}

/** Record an impression and return the updated banner. */
export async function trackImpression(id: string) {
    const banner = await BannerDAO.incrementImpressions(id);
    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }
    return banner;
}
