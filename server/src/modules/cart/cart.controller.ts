import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as cartService from "./cart.service";
import { addToCartSchema, updateQuantitySchema, syncCartSchema } from "./cart.validator";

/**
 * Returns the authenticated user's cart with computed pricing and stock status.
 *
 * @route GET /api/v1/cart
 * @access Protected
 */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await cartService.getCart(userId);
    return res.status(200).json(new ApiResponse(200, result, "Cart fetched successfully"));
});

/**
 * Adds a product variant to the authenticated user's cart.
 * Validates the request body against {@link addToCartSchema}.
 *
 * @route POST /api/v1/cart/add
 * @access Protected
 */
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = addToCartSchema.parse(req.body);
    const userId = (req as any).user._id;

    const result = await cartService.addToCart(
        userId,
        validatedData.productId,
        validatedData.sku,
        validatedData.quantity
    );

    return res.status(200).json(new ApiResponse(200, result, "Item added to cart"));
});

/**
 * Updates the absolute quantity of an existing cart item.
 * Validates the request body against {@link updateQuantitySchema}.
 *
 * @route PATCH /api/v1/cart/update
 * @access Protected
 */
export const updateQuantity = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = updateQuantitySchema.parse(req.body);
    const userId = (req as any).user._id;

    const result = await cartService.updateQuantity(userId, validatedData.sku, validatedData.quantity);
    return res.status(200).json(new ApiResponse(200, result, "Quantity updated"));
});

/**
 * Merges a client-side (guest) cart into the authenticated user's cart.
 * Validates the request body against {@link syncCartSchema}.
 *
 * @route POST /api/v1/cart/sync
 * @access Protected
 */
export const syncCart = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = syncCartSchema.parse(req.body);
    const userId = (req as any).user._id;

    const result = await cartService.syncCart(userId, validatedData.items);
    return res.status(200).json(new ApiResponse(200, result, "Cart synced successfully"));
});

/**
 * Removes a single variant (by SKU) from the authenticated user's cart.
 *
 * @route DELETE /api/v1/cart/remove/:sku
 * @access Protected
 */
export const removeItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const sku = req.params.sku as string;

    const result = await cartService.removeItem(userId, sku);
    return res.status(200).json(new ApiResponse(200, result, "Item removed from cart"));
});

/**
 * Empties the authenticated user's cart entirely.
 *
 * @route DELETE /api/v1/cart/clear
 * @access Protected
 */
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await cartService.clearCart(userId);
    return res.status(200).json(new ApiResponse(200, result, "Cart cleared"));
});
