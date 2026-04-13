import { Banner } from "./banner.model";

export class BannerDAO {
    static async createBanner(bannerData: any) {
        return await Banner.create(bannerData);
    }
    
    static async getMaxPriority(placement: string) {
        const topBanner = await Banner.findOne({ placement }).sort({ priority: -1 }).select("priority").lean();
        return topBanner ? topBanner.priority : 0;
    }

    static async findAllBanners(query: any = {}) {
        return await Banner.find(query).sort({ priority: -1, createdAt: -1 });
    }

    static async findActiveBanners(filters: any = {}) {
        const now = new Date();
        const baseQuery: any = {
            isActive: true,
            $and: [
                { $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }, { startDate: null }] },
                { $or: [{ endDate: { $gte: now } }, { endDate: { $exists: false } }, { endDate: null }] }
            ]
        };

        const query = { ...baseQuery, ...filters };

        return await Banner.find(query).sort({ priority: -1, createdAt: -1 });
    }

    static async findById(id: string) {
        return await Banner.findById(id);
    }

    static async updateById(id: string, updateData: any) {
        return await Banner.findByIdAndUpdate(id, updateData, { new: true });
    }

    static async deleteById(id: string) {
        return await Banner.findByIdAndDelete(id);
    }

    static async incrementClicks(id: string) {
        return await Banner.findByIdAndUpdate(id, { $inc: { clicks: 1 } }, { new: true });
    }

    static async incrementImpressions(id: string) {
        return await Banner.findByIdAndUpdate(id, { $inc: { impressions: 1 } }, { new: true });
    }
}
