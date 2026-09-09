import type { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import { ApiError } from "@/utils/ApiError";
import { Review } from "./review.model";
import { Product } from "./product.model";
import { SubOrder, SubOrderStatus } from "@/modules/common/order/subOrder.model";
import { Order } from "@/modules/common/order/order.model";

/**
 * Recalculate and update the aggregate ratings for a product.
 */
async function updateProductRatingStats(productId: Types.ObjectId | string) {
    const stats = await Review.aggregate([
        { $match: { productId: new Types.ObjectId(productId.toString()), status: "APPROVED" } },
        {
            $group: {
                _id: "$productId",
                averageRating: { $avg: "$rating" },
                totalCount: { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        const average = Number(stats[0].averageRating.toFixed(1));
        const count = stats[0].totalCount;
        await Product.findByIdAndUpdate(productId, {
            $set: {
                "ratings.average": average,
                "ratings.count": count,
            },
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            $set: {
                "ratings.average": 0,
                "ratings.count": 0,
            },
        });
    }
}

/**
 * GET /api/v1/products/:id/reviews
 * Fetch paginated reviews and aggregate rating breakdown for a product.
 */
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const filter = {
        productId: new Types.ObjectId(id as string),
        status: "APPROVED",
    };

    const [reviews, totalCount, distributionAgg] = await Promise.all([
        Review.find(filter)
            .populate("userId", "fullName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Review.countDocuments(filter),
        Review.aggregate([
            { $match: filter },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
        ]),
    ]);

    // Build star distribution map (5, 4, 3, 2, 1)
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumScore = 0;

    distributionAgg.forEach((item: { _id: number; count: number }) => {
        if (distribution[item._id] !== undefined) {
            distribution[item._id] = item.count;
            sumScore += item._id * item.count;
        }
    });

    const averageRating = totalCount > 0 ? Number((sumScore / totalCount).toFixed(1)) : 0;
    const positiveCount = (distribution[5] ?? 0) + (distribution[4] ?? 0);
    const positivePercentage = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 100;

    const currentUserId = (req as any).user?._id?.toString();

    // Map reviews with helpful count & voted boolean
    const formattedReviews = reviews.map((r: any) => ({
        _id: r._id,
        id: r._id,
        rating: r.rating,
        title: r.title || "",
        comment: r.comment,
        images: r.images || [],
        isVerifiedBuyer: r.isVerifiedBuyer || false,
        createdAt: r.createdAt,
        user: {
            _id: r.userId?._id,
            fullName: r.userId?.fullName || "Verified Customer",
        },
        helpfulCount: Array.isArray(r.helpfulVotes) ? r.helpfulVotes.length : 0,
        hasVotedHelpful: currentUserId && Array.isArray(r.helpfulVotes)
            ? r.helpfulVotes.some((v: any) => v.toString() === currentUserId)
            : false,
    }));

    return res.status(200).set("Cache-Control", "public, max-age=60").json(
        new ApiResponse(
            200,
            {
                reviews: formattedReviews,
                stats: {
                    averageRating,
                    totalReviews: totalCount,
                    distribution,
                    positivePercentage,
                },
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 1,
                },
            },
            "Product reviews fetched successfully"
        )
    );
});

/**
 * POST /api/v1/products/:id/reviews
 * Submit or update a product review.
 */
export const createProductReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?._id;

    if (!userId) {
        throw new ApiError(401, "Authentication required to review this product");
    }

    const { rating, title, comment, images } = req.body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be a number between 1 and 5");
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
        throw new ApiError(400, "Review comment is required");
    }

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check verified buyer status: has the user purchased and received this product?
    const deliveredParentOrders = await Order.find({
        userId: new Types.ObjectId(userId.toString()),
        status: { $in: [SubOrderStatus.DELIVERED, SubOrderStatus.COMPLETED, SubOrderStatus.DELIVERY_CONFIRMED] },
        "items.productId": new Types.ObjectId(id as string),
    }).select("_id");

    const isVerifiedBuyer = deliveredParentOrders.length > 0;

    // Check if user already reviewed this product -> update existing or create new
    let review = await Review.findOne({
        productId: new Types.ObjectId(id as string),
        userId: new Types.ObjectId(userId.toString()),
    });

    if (review) {
        review.rating = rating;
        review.title = title ? title.trim() : "";
        review.comment = comment.trim();
        if (images && Array.isArray(images)) {
            review.images = images;
        }
        review.isVerifiedBuyer = isVerifiedBuyer;
        review.status = "APPROVED";
        await review.save();
    } else {
        review = await Review.create({
            productId: new Types.ObjectId(id as string),
            userId: new Types.ObjectId(userId.toString()),
            rating,
            title: title ? title.trim() : "",
            comment: comment.trim(),
            images: Array.isArray(images) ? images : [],
            isVerifiedBuyer,
            helpfulVotes: [],
            status: "APPROVED",
        });
    }

    // Update product ratings average and count
    await updateProductRatingStats(id as string);

    return res.status(201).json(
        new ApiResponse(201, review, "Review submitted successfully")
    );
});

/**
 * POST /api/v1/products/:id/reviews/:reviewId/helpful
 * Vote a review as helpful (toggle).
 */
export const voteHelpfulReview = asyncHandler(async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    const userId = (req as any).user?._id;

    if (!userId) {
        throw new ApiError(401, "Authentication required to vote");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    const userObjectId = new Types.ObjectId(userId.toString());
    const alreadyVotedIndex = review.helpfulVotes.findIndex(
        (id) => id.toString() === userId.toString()
    );

    let hasVoted = false;
    if (alreadyVotedIndex > -1) {
        review.helpfulVotes.splice(alreadyVotedIndex, 1);
        hasVoted = false;
    } else {
        review.helpfulVotes.push(userObjectId);
        hasVoted = true;
    }

    await review.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                helpfulCount: review.helpfulVotes.length,
                hasVoted,
            },
            hasVoted ? "Marked review as helpful" : "Removed helpful vote"
        )
    );
});
