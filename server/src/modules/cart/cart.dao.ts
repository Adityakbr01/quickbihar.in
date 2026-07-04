/**
 * Cart Data Access Object.
 *
 * Encapsulates all persistence-layer operations for the Cart model, including
 * populated reads (for display), raw reads (for mutation), creation, and
 * item-level updates. Keeps Mongoose query details isolated from the service layer.
 */

import { Cart, type ICartItem } from "./cart.model";

/* ── Exported DAO functions ── */

/**
 * Find a user's cart with product references populated for rendering.
 * Populates a curated subset of product fields required to compute pricing,
 * stock, and display metadata without over-fetching.
 *
 * @param userId - Owning user's MongoDB ObjectId (as string).
 * @returns The populated cart document, or `null` if none exists.
 */
export async function findByUserId(userId: string) {
    return await Cart.findOne({ userId }).populate(
        "items.productId",
        "title price images originalPrice discountPercentage variants isGstApplicable gstPercentage sellerId storeId"
    );
}

/**
 * Find a user's cart without populating product references.
 * Use this for mutation flows (add/update/remove) where only the raw
 * `items` array is needed and populated documents would add overhead.
 *
 * @param userId - Owning user's MongoDB ObjectId (as string).
 * @returns The raw cart document, or `null` if none exists.
 */
export async function findRawByUserId(userId: string) {
    return await Cart.findOne({ userId });
}

/**
 * Create an empty cart for a user.
 *
 * @param userId - Owning user's MongoDB ObjectId (as string).
 * @returns The newly created cart document.
 */
export async function create(userId: string) {
    return await Cart.create({ userId, items: [] });
}

/**
 * Replace a user's cart items, creating the cart if it does not exist.
 * Performs an atomic upsert and returns the post-update document.
 *
 * @param userId - Owning user's MongoDB ObjectId (as string).
 * @param items - The full, authoritative list of cart items to persist.
 * @returns The updated (or newly upserted) cart document.
 */
export async function updateItems(userId: string, items: ICartItem[]) {
    return await Cart.findOneAndUpdate(
        { userId },
        { $set: { items } },
        { returnDocument: "after", upsert: true }
    );
}

/**
 * Empty a user's cart by clearing its items array.
 *
 * @param userId - Owning user's MongoDB ObjectId (as string).
 * @returns The updated cart document, or `null` if no cart exists.
 */
export async function clearCart(userId: string) {
    return await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [] } },
        { returnDocument: "after" }
    );
}
