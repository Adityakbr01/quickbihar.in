import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as CategoryService from "./category.service";
import type { CreateCategoryInput, CreateAttributeInput, UpdateCategoryInput, UpdateAttributeInput } from "./category.types";

import { uploadToImageKit, deleteFromImageKit } from "../../utils/imagekit.util";

export const createCategoryController = asyncHandler(async (req: Request<{}, {}, CreateCategoryInput>, res: Response) => {
    if (!req.file) {
        throw new ApiError(400, "Category image is required");
    }

    const uploadResult = await uploadToImageKit(
        req.file.buffer,
        req.file.originalname,
        "categories"
    );

    const category = await CategoryService.createCategoryService(
        req.body,
        uploadResult.url,
        uploadResult.fileId
    );

    res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

export const getCategoriesController = asyncHandler(async (req: Request, res: Response) => {
    const { parentId } = req.query;
    const categories = await CategoryService.getCategoriesService(parentId as string);
    res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

export const getCategoryTreeController = asyncHandler(async (req: Request, res: Response) => {
    const categories = await CategoryService.getCategoryTreeService();
    res.status(200).json(new ApiResponse(200, categories, "Category tree fetched successfully"));
});

export const createAttributeController = asyncHandler(async (req: Request<{}, {}, CreateAttributeInput>, res: Response) => {
    const attribute = await CategoryService.createAttributeService(req.body);
    res.status(201).json(new ApiResponse(201, attribute, "Attribute created successfully"));
});

export const getAttributesController = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    if (!categoryId) {
        throw new ApiError(400, "Category ID is required");
    }
    const attributes = await CategoryService.getAttributesService(categoryId as unknown as string);
    res.status(200).json(new ApiResponse(200, attributes, "Attributes fetched successfully"));
});


export const updateCategoryController = asyncHandler(async (req: Request<any, any, UpdateCategoryInput>, res: Response) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new ApiError(400, "Category ID is required");

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    if (req.file) {
        const existingCategory = await CategoryService.getCategoryByIdService(categoryId);
        if (!existingCategory) throw new ApiError(404, "Category not found");

        const uploadResult = await uploadToImageKit(
            req.file.buffer,
            req.file.originalname,
            "categories"
        );

        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.fileId;

        // Optionally delete old image
        const oldImagePublicId = existingCategory.get("imagePublicId");
        if (oldImagePublicId) {
            await deleteFromImageKit(oldImagePublicId);
        }
    }

    const category = await CategoryService.updateCategoryService(
        categoryId,
        req.body,
        imageUrl,
        imagePublicId
    );

    if (!category) throw new ApiError(404, "Category not found");

    res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
});

export const updateAttributeController = asyncHandler(async (req: Request<any, any, UpdateAttributeInput>, res: Response) => {
    const { attributeId } = req.params;
    if (!attributeId) throw new ApiError(400, "Attribute ID is required");

    const attribute = await CategoryService.updateAttributeService(attributeId, req.body);

    if (!attribute) throw new ApiError(404, "Attribute not found");

    res.status(200).json(new ApiResponse(200, attribute, "Attribute updated successfully"));
});
