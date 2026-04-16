import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { wishlistService } from "./wishlist.service";
import { ApiError } from "../../utils/ApiError";

export class WishlistController {
    static toggleWishlist = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const { productId } = req.body;

        if (!productId) throw new ApiError(400, "Product ID is required");

        const result = await wishlistService.toggleWishlist(userId, productId);
        const message = result.added ? "Added to wishlist" : "Removed from wishlist";
        
        return res.status(200).json(new ApiResponse(200, result, message));
    });

    static getMyWishlist = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const result = await wishlistService.getWishlist(userId);
        return res.status(200).json(new ApiResponse(200, result, "Wishlist items fetched successfully"));
    });

    static removeItem = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const id = req.params.id as string; // Using productId from URL
        
        await wishlistService.removeFromWishlist(userId, id);
        return res.status(200).json(new ApiResponse(200, {}, "Removed from wishlist"));
    });

    static syncWishlist = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds)) {
            throw new ApiError(400, "productIds array is required");
        }

        const result = await wishlistService.syncWishlist(userId, productIds);
        return res.status(200).json(new ApiResponse(200, result, "Wishlist synced successfully"));
    });
}
