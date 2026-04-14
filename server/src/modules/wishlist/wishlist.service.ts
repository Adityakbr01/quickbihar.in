import { wishlistDAO } from "./wishlist.dao";
import { ProductDAO } from "../products/product.dao";
import { ApiError } from "../../utils/ApiError";

export class WishlistService {
    async toggleWishlist(userId: string, productId: string) {
        // Verify product exists
        const product = await ProductDAO.findById(productId);
        if (!product) throw new ApiError(404, "Product not found");

        const exists = await wishlistDAO.checkExists(userId, productId);
        
        if (exists) {
            await wishlistDAO.remove(userId, productId);
            return { added: false };
        } else {
            await wishlistDAO.add(userId, productId);
            return { added: true };
        }
    }

    async getWishlist(userId: string) {
        const items = await wishlistDAO.findByUserId(userId);
        
        // Transform to return actual product data prominently
        return items.map((item: any) => ({
            _id: item._id,
            addedAt: item.createdAt,
            product: item.productId // This is the populated product
        })).filter((item: any) => item.product !== null);
    }

    async removeFromWishlist(userId: string, productId: string) {
        return await wishlistDAO.remove(userId, productId);
    }
}

export const wishlistService = new WishlistService();
