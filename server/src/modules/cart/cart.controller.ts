import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { cartService } from "./cart.service";
import { addToCartSchema, updateQuantitySchema, syncCartSchema } from "./cart.validator";

export class CartController {
    static getCart = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const result = await cartService.getCart(userId);
        return res.status(200).json(new ApiResponse(200, result, "Cart fetched successfully"));
    });

    static addToCart = asyncHandler(async (req, res) => {
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

    static updateQuantity = asyncHandler(async (req, res) => {
        const validatedData = updateQuantitySchema.parse(req.body);
        const userId = (req as any).user._id;

        const result = await cartService.updateQuantity(userId, validatedData.sku, validatedData.quantity);
        return res.status(200).json(new ApiResponse(200, result, "Quantity updated"));
    });

    static syncCart = asyncHandler(async (req, res) => {
        const validatedData = syncCartSchema.parse(req.body);
        const userId = (req as any).user._id;

        const result = await cartService.syncCart(userId, validatedData.items);
        return res.status(200).json(new ApiResponse(200, result, "Cart synced successfully"));
    });

    static removeItem = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const sku = req.params.sku as string;

        const result = await cartService.removeItem(userId, sku);
        return res.status(200).json(new ApiResponse(200, result, "Item removed from cart"));
    });

    static clearCart = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const result = await cartService.clearCart(userId);
        return res.status(200).json(new ApiResponse(200, result, "Cart cleared"));
    });
}
