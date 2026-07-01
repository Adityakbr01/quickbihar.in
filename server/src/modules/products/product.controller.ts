/**
 * Product HTTP Controller Handlers.
 *
 * Implements Express handlers managing product creation, listing, updating, deletion,
 * similar matching, and trending list endpoints.
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as ProductService from "./products.service";
import { ApiError } from "../../utils/ApiError";

/* ── Exported Controller Handlers ── */

/**
 * Handle POST / - Create a new product.
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const files = req.files as any[] || [];

    if (files.length === 0) {
        throw new ApiError(400, "Product images are required");
    }

    const roleName = user.roleId?.name || user.role;
    const product = await ProductService.createProduct(req.body, files, user._id.toString(), roleName);

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
});

/**
 * Handle GET / - Retrieve products. Sellers see their own, admins see all.
 */
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user || {};
    const role = user.roleId?.name || user.role;
    const _id = user._id;

    let products;
    if (role === "SELLER" || role === "seller") {
        products = await ProductService.getSellerProducts(_id.toString());
    } else {
        products = await ProductService.getProducts(req.query);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, products, "Products fetched successfully"));
});

/**
 * Handle GET /public - Public storefront endpoint for active products.
 */
export const getPublicProducts = asyncHandler(async (req: Request, res: Response) => {
    const products = await ProductService.getProducts({ ...req.query, isActive: true, publicOnly: true });
    return res
        .status(200)
        .json(new ApiResponse(200, products, "Public products fetched successfully"));
});

/**
 * Handle GET /trending - Retrieve trending products.
 */
export const getTrendingProducts = asyncHandler(async (req: Request, res: Response) => {
    const products = await ProductService.getTrendingProducts();
    return res
        .status(200)
        .json(new ApiResponse(200, products, "Trending products fetched successfully"));
});

/**
 * Handle GET /slug/:slug - Fetch a specific product by slug.
 */
export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.getProductBySlug(req.params.slug as unknown as string);
    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * Handle GET /:id - Fetch a specific product by database ID.
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.getProductById(req.params.id as unknown as string);
    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * Handle PATCH /:id - Update properties of a product.
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const files = req.files as any[] || [];
    const roleName = user.roleId?.name || user.role;
    const product = await ProductService.updateProduct(req.params.id as unknown as string, req.body, user._id.toString(), roleName, files);

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

/**
 * Handle DELETE /:id - Soft delete a product.
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const roleName = user.roleId?.name || user.role;
    await ProductService.deleteProduct(req.params.id as unknown as string, user._id.toString(), roleName);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

/**
 * Handle GET /:id/similar - Retrieve similar products based on tags, brand, and category.
 */
export const getSimilarProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const similar = await ProductService.getSimilarProducts(req.params.id as string, limit);

    return res
        .status(200)
        .json(new ApiResponse(200, similar, "Similar products fetched successfully"));
});
