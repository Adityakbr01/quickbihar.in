import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ProductService } from "./products.service";
import { ApiError } from "../../utils/ApiError";

export class ProductController {
    static createProduct = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const files = req.files as any[] || [];

        if (files.length === 0) {
            throw new ApiError(400, "Product images are required");
        }

        const product = await ProductService.createProduct(req.body, files, user._id);

        return res
            .status(201)
            .json(new ApiResponse(201, product, "Product created successfully"));
    });

    static getAllProducts = asyncHandler(async (req: Request, res: Response) => {
        const { role, _id } = (req as any).user || {};

        let products;
        if (role === "seller") {
            products = await ProductService.getSellerProducts(_id.toString());
        } else {
            // Admin can see everything
            products = await ProductService.getProducts(req.query);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, products, "Products fetched successfully"));
    });

    /**
     * @desc Public endpoint to get active products
     */
    static getPublicProducts = asyncHandler(async (req: Request, res: Response) => {
        const products = await ProductService.getProducts({ isActive: true });
        return res
            .status(200)
            .json(new ApiResponse(200, products, "Public products fetched successfully"));
    });

    static getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
        const product = await ProductService.getProductBySlug(req.params.slug as unknown as string);
        return res
            .status(200)
            .json(new ApiResponse(200, product, "Product fetched successfully"));
    });

    static getProductById = asyncHandler(async (req: Request, res: Response) => {
        const product = await ProductService.getProductById(req.params.id as unknown as string);
        return res
            .status(200)
            .json(new ApiResponse(200, product, "Product fetched successfully"));
    });

    static updateProduct = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const product = await ProductService.updateProduct(req.params.id as unknown as string, req.body, user._id.toString(), user.role);

        return res
            .status(200)
            .json(new ApiResponse(200, product, "Product updated successfully"));
    });

    static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        await ProductService.deleteProduct(req.params.id as unknown as string, user._id.toString(), user.role);

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Product deleted successfully"));
    });
}
