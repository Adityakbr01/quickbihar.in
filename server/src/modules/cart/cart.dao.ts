import { Cart, type ICart, type ICartItem } from "./cart.model";

export class CartDAO {
    async findByUserId(userId: string) {
        return await Cart.findOne({ userId }).populate("items.productId", "title price images originalPrice discountPercentage variants isGstApplicable gstPercentage");
    }

    async findRawByUserId(userId: string) {
        return await Cart.findOne({ userId });
    }

    async create(userId: string) {
        return await Cart.create({ userId, items: [] });
    }

    async updateItems(userId: string, items: ICartItem[]) {
        return await Cart.findOneAndUpdate(
            { userId },
            { $set: { items } },
            { returnDocument: 'after', upsert: true }
        );
    }

    async clearCart(userId: string) {
        return await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            { returnDocument: 'after' }
        );
    }
}

export const cartDAO = new CartDAO();
