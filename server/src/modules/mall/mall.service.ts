import { Mall } from "./mall.model";
import { Seller } from "../seller/seller.model";

const DEFAULT_MALL_IMAGE = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80";

export class MallService {
    static async listPublicMalls(limit = 100) {
        const malls = await Mall.find({
            isActive: true,
            $or: [{ status: "APPROVED" }, { status: { $exists: false } }],
        })
            .sort({ name: 1 })
            .limit(limit)
            .lean();

        return await MallService.withSellerCounts(malls);
    }

    static async getTopMalls(limit = 10) {
        const malls = await Mall.find({
            isActive: true,
            isFeatured: true,
            $or: [{ status: "APPROVED" }, { status: { $exists: false } }],
        })
            .sort({ featuredRank: 1, updatedAt: -1 })
            .limit(limit)
            .lean();

        return await MallService.withSellerCounts(malls);
    }

    private static async withSellerCounts(malls: any[]) {
        const mallIds = malls.map((mall) => mall._id);
        const sellerCounts = await Seller.aggregate([
            { $match: { mallId: { $in: mallIds } } },
            { $group: { _id: "$mallId", sellers: { $sum: 1 } } },
        ]);
        const countsByMall = new Map(sellerCounts.map((item: any) => [item._id.toString(), item.sellers]));

        return malls.map((mall: any) => ({
            ...mall,
            _id: mall._id.toString(),
            id: mall._id.toString(),
            image: mall.coverImageUrl || mall.logoUrl || DEFAULT_MALL_IMAGE,
            location: [mall.address?.line1, mall.address?.city].filter(Boolean).join(", ") || mall.address?.state || "Fashion mall",
            sellerCount: countsByMall.get(mall._id.toString()) || 0,
            tagline: mall.description || "Fashion stores and fresh collections",
        }));
    }
}
