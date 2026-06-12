import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Product } from "../products/product.model";
import { Seller } from "../seller/seller.model";
import { Mall } from "./mall.model";
import { MallReview } from "./mallReview.model";

const DEFAULT_MALL_IMAGE = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80";
const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80";

const publicMallFilter = {
    isActive: true,
    $or: [{ status: "APPROVED" }, { status: { $exists: false } }],
};

export class MallService {
    static async listPublicMalls(limit = 100) {
        const malls = await Mall.find(publicMallFilter)
            .sort({ name: 1 })
            .limit(limit)
            .lean();

        return await MallService.withSellerCounts(malls);
    }

    static async getTopMalls(limit = 10) {
        const malls = await Mall.find({
            ...publicMallFilter,
            isFeatured: true,
        })
            .sort({ featuredRank: 1, rating: -1, updatedAt: -1 })
            .limit(limit)
            .lean();

        return await MallService.withSellerCounts(malls);
    }

    static async getMallDetail(mallId: string) {
        if (!Types.ObjectId.isValid(mallId)) {
            throw new ApiError(400, "Invalid mall ID");
        }

        const mall = await Mall.findOne({
            _id: mallId,
            ...publicMallFilter,
        }).lean();

        if (!mall) {
            throw new ApiError(404, "Mall not found");
        }

        const formattedMall = (await MallService.withSellerCounts([mall]))[0];
        const mallObjectId = new Types.ObjectId(mallId);

        const sellers = await Seller.find({ mallId: mallObjectId }).select("userId").lean();
        const sellerUserIds = sellers.map((seller: any) => seller.userId).filter(Boolean);

        const products = await Product.find({
            sellerId: { $in: sellerUserIds },
            approvalStatus: "APPROVED",
            isActive: true,
            isDeleted: false,
        })
            .sort({ isTrending: -1, isFeatured: -1, createdAt: -1 })
            .limit(24)
            .lean();

        const reviews = await MallReview.find({ mallId: mallObjectId })
            .populate("userId", "fullName email avatar")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const city = mall.address?.city;
        let matchingMalls: any[] = [];
        if (city) {
            matchingMalls = await Mall.find({
                _id: { $ne: mall._id },
                ...publicMallFilter,
                "address.city": city,
            })
                .sort({ isFeatured: -1, featuredRank: 1, rating: -1 })
                .limit(5)
                .lean();
        }

        if (!matchingMalls.length) {
            matchingMalls = await Mall.find({
                _id: { $ne: mall._id },
                ...publicMallFilter,
            })
                .sort({ isFeatured: -1, featuredRank: 1, rating: -1 })
                .limit(5)
                .lean();
        }

        return {
            mall: formattedMall,
            products: products.map(MallService.formatProduct),
            reviews: reviews.map(MallService.formatReview),
            matchingMalls: await MallService.withSellerCounts(matchingMalls),
        };
    }

    static async postMallReview(mallId: string, userId: string, data: { rating: number; comment?: string }) {
        if (!Types.ObjectId.isValid(mallId)) {
            throw new ApiError(400, "Invalid mall ID");
        }
        if (!Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }

        const rating = Number(data.rating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            throw new ApiError(400, "Rating must be between 1 and 5");
        }

        const comment = data.comment?.trim();
        if (comment && comment.length > 500) {
            throw new ApiError(400, "Review comment must be 500 characters or less");
        }

        const mall = await Mall.findOne({ _id: mallId, ...publicMallFilter }).lean();
        if (!mall) {
            throw new ApiError(404, "Mall not found");
        }

        const mallObjectId = new Types.ObjectId(mallId);
        const review = await MallReview.findOneAndUpdate(
            { mallId: mallObjectId, userId: new Types.ObjectId(userId) },
            { $set: { rating, comment } },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );

        const stats = await MallReview.aggregate([
            { $match: { mallId: mallObjectId } },
            {
                $group: {
                    _id: "$mallId",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 },
                },
            },
        ]);

        const nextStats = stats[0];
        await Mall.findByIdAndUpdate(mallId, {
            rating: nextStats ? Math.round(nextStats.averageRating * 10) / 10 : 0,
            reviewCount: nextStats?.reviewCount || 0,
        });

        const populated = await MallReview.findById(review._id)
            .populate("userId", "fullName email avatar")
            .lean();

        return MallService.formatReview(populated || review);
    }

    private static async withSellerCounts(malls: any[]) {
        const mallIds = malls.map((mall) => mall._id).filter(Boolean);
        if (!mallIds.length) return [];

        const [sellerCounts, reviewCounts] = await Promise.all([
            Seller.aggregate([
                { $match: { mallId: { $in: mallIds } } },
                { $group: { _id: "$mallId", sellers: { $sum: 1 } } },
            ]),
            MallReview.aggregate([
                { $match: { mallId: { $in: mallIds } } },
                { $group: { _id: "$mallId", reviews: { $sum: 1 } } },
            ]),
        ]);

        const countsByMall = new Map(sellerCounts.map((item: any) => [item._id.toString(), item.sellers]));
        const reviewsByMall = new Map(reviewCounts.map((item: any) => [item._id.toString(), item.reviews]));

        return malls.map((mall: any) => {
            const id = mall._id.toString();
            return {
                ...mall,
                _id: id,
                id,
                image: mall.coverImageUrl || mall.logoUrl || DEFAULT_MALL_IMAGE,
                location: [mall.address?.line1, mall.address?.city].filter(Boolean).join(", ") || mall.address?.state || "Fashion mall",
                sellerCount: countsByMall.get(id) || 0,
                reviewCount: mall.reviewCount ?? reviewsByMall.get(id) ?? 0,
                tagline: mall.description || "Fashion stores and fresh collections",
            };
        });
    }

    private static formatProduct(product: any) {
        return {
            ...product,
            id: product._id.toString(),
            _id: product._id.toString(),
            name: product.title,
            image: product.images?.[0]?.url || DEFAULT_PRODUCT_IMAGE,
            price: product.price,
            originalPrice: product.originalPrice,
            rating: product.ratings?.average || 0,
            reviews: product.ratings?.count || 0,
            discount: product.discountPercentage ? `${Math.round(product.discountPercentage)}% OFF` : null,
        };
    }

    private static formatReview(review: any) {
        return {
            id: review._id?.toString?.() || review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            user: {
                id: review.userId?._id?.toString?.() || review.userId?.toString?.() || "",
                fullName: review.userId?.fullName || "Verified User",
                email: review.userId?.email || "",
                avatarUrl: review.userId?.avatar?.url || "",
            },
        };
    }
}
