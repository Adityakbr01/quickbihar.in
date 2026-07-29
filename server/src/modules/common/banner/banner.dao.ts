/**
 * Banner data-access layer.
 *
 * Thin, side-effect-free wrappers around the `Banner` Mongoose model. Keeping every
 * query in one place means the service layer never talks to Mongoose directly, so
 * query shape changes (indexes, projections, soft-delete rules) stay contained here.
 */
import { Banner } from "./banner.model";

/** Persist a new banner document. */
export async function createBanner(bannerData: any) {
    return await Banner.create(bannerData);
}

/**
 * Highest `priority` currently used within a placement bucket.
 * Used to auto-append new banners to the end of their placement lane.
 */
export async function getMaxPriority(placement: string) {
    const topBanner = await Banner.findOne({ placement }).sort({ priority: -1 }).select("priority").lean();
    return topBanner ? topBanner.priority : 0;
}

/** All banners (admin view), ordered by priority then recency. */
export async function findAllBanners(query: any = {}) {
    return await Banner.find(query).sort({ priority: -1, createdAt: -1 });
}

/**
 * Public-facing banners: active, approved (or legacy docs without an approval flag),
 * and inside their optional start/end window. Extra `filters` (e.g. placement) merge on top.
 */
export async function findActiveBanners(filters: any = {}) {
    const now = new Date();
    const baseQuery: any = {
        isActive: true,
        $and: [
            { $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }] },
            { $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }, { startDate: null }] },
            { $or: [{ endDate: { $gte: now } }, { endDate: { $exists: false } }, { endDate: null }] }
        ]
    };

    const query = { ...baseQuery, ...filters };

    return await Banner.find(query).sort({ priority: -1, createdAt: -1 });
}

/** Fetch a single banner by id. */
export async function findById(id: string) {
    return await Banner.findById(id);
}

/** Update a banner; an end date in the past auto-deactivates it. */
export async function updateById(id: string, updateData: any) {
    if (updateData.endDate && new Date(updateData.endDate) < new Date()) {
        updateData.isActive = false;
    }
    return await Banner.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
}

/** Hard-delete a banner. */
export async function deleteById(id: string) {
    return await Banner.findByIdAndDelete(id);
}

/** Bulk-deactivate banners whose window has elapsed (housekeeping before admin listing). */
export async function deactivateExpired() {
    const now = new Date();
    return await Banner.updateMany(
        { endDate: { $lte: now }, isActive: true },
        { $set: { isActive: false } }
    );
}

/** Atomic click counter increment. */
export async function incrementClicks(id: string) {
    return await Banner.findByIdAndUpdate(id, { $inc: { clicks: 1 } }, { returnDocument: "after" });
}

/** Atomic impression counter increment. */
export async function incrementImpressions(id: string) {
    return await Banner.findByIdAndUpdate(id, { $inc: { impressions: 1 } }, { returnDocument: "after" });
}
