/**
 * Category HTTP controllers.
 *
 * Each handler is an `asyncHandler`-wrapped Express function owning request/response concerns
 * only — image uploads, status codes, envelope shape — while delegating all domain rules to
 * `CategoryService`. Thrown errors funnel to the global error handler.
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import * as CategoryService from "./category.service";
import { uploadToImageKit, deleteFromImageKit } from "@/utils/imagekit.util";
import { ApiError } from "@/utils/ApiError";

/** GET /public — active storefront categories (public cache 5min; small taxonomy). */
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await CategoryService.getAllCategories(false, req.query);
    res.set("Cache-Control", "public, max-age=300");
    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

/** POST / — create a category from a multipart body plus an image file or direct image URL. */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    let imageUrl = req.body.image;
    let imagePublicId = req.body.imagePublicId || "";

    if (req.file) {
        const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname, "categories");
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.fileId;
    }

    if (!imageUrl) {
        throw new ApiError(400, "Category image file or image URL is required");
    }

    const categoryData = {
        ...req.body,
        image: imageUrl,
        imagePublicId: imagePublicId || "url_provided",
    };

    const category = await CategoryService.createCategory(categoryData);

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});

/** GET / — full filterable category list for the admin panel. */
export const getAllCategoriesAdmin = asyncHandler(async (req: Request, res: Response) => {
    const categories = await CategoryService.getAllCategories(true, req.query);
    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

/** GET /:id — single category (public cache 5min). */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.getCategoryById(req.params.id as unknown as string);
    res.set("Cache-Control", "public, max-age=300");
    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetched successfully"));
});

/** GET /slug/:slug — single ACTIVE category by slug (public cache 5min, plan §26 A1). */
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.getCategoryBySlug(req.params.slug as unknown as string);
    res.set("Cache-Control", "public, max-age=300");
    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetched successfully"));
});

/** PATCH /:id — update fields and optionally swap the image, deleting the old asset only after a successful DB write. */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const oldCategory = await CategoryService.getCategoryById(req.params.id as unknown as string);
    let categoryData = { ...req.body };

    if (req.file) {
        const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname, "categories");
        categoryData.image = uploadResult.url;
        categoryData.imagePublicId = uploadResult.fileId;
    } else if (req.body.image) {
        categoryData.image = req.body.image;
        categoryData.imagePublicId = req.body.imagePublicId || "url_provided";
    }

    const category = await CategoryService.updateCategory(req.params.id as unknown as string, categoryData);

    if (req.file && oldCategory.imagePublicId && oldCategory.imagePublicId !== "url_provided") {
        await deleteFromImageKit(oldCategory.imagePublicId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"));
});

/** DELETE /:id — remove the record, then clean up its ImageKit asset if present. */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { imagePublicId } = await CategoryService.deleteCategory(req.params.id as unknown as string);

    if (imagePublicId) {
        await deleteFromImageKit(imagePublicId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Category deleted successfully"));
});
