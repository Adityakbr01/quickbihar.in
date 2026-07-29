import { Wishlist } from "./wishlist.model";

export class WishlistDAO {
    async add(userId: string, productId: string) {
        return await Wishlist.findOneAndUpdate(
            { userId, productId },
            { userId, productId },
            { upsert: true, returnDocument: 'after' }
        );
    }

    async remove(userId: string, productId: string) {
        return await Wishlist.findOneAndDelete({ userId, productId });
    }

    async findByUserId(userId: string) {
        return await Wishlist.find({ userId })
            .populate("productId", "title price images originalPrice discountPercentage variants slug")
            .sort({ createdAt: -1 });
    }

    async checkExists(userId: string, productId: string) {
        return await Wishlist.exists({ userId, productId });
    }
}

export const wishlistDAO = new WishlistDAO();
