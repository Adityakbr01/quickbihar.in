/**
 * Category business logic.
 *
 * Validates input with Zod, derives slugs, enforces slug uniqueness and maps failures to
 * `ApiError`s. All persistence is delegated to `CategoryDAO`; the controller never touches
 * the data layer directly.
 */
import { ApiError } from "../../utils/ApiError";
import * as CategoryDAO from "./category.dao";
import { createCategorySchema, updateCategorySchema, type CreateCategoryBody, type UpdateCategoryBody } from "./category.validation";
import { ZodError } from "zod";

/* ── Internal helpers ── */

/** Derive a URL-safe slug from a human title (lowercase, dash-separated, trimmed). */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/* ── Exported service functions ── */

/** Validate, slugify, guard against duplicate slugs, then persist a new category. */
export async function createCategory(data: any) {
    try {
        const validatedData: CreateCategoryBody = createCategorySchema.parse(data);
        const slug = generateSlug(validatedData.title);

        // Check if slug already exists
        const existing = await CategoryDAO.findBySlug(slug);
        if (existing) {
            throw new ApiError(400, "Category with a similar title already exists");
        }

        const category = await CategoryDAO.create({ ...validatedData, slug });
        if (!category) {
            throw new ApiError(500, "Failed to create category");
        }
        return category;
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ApiError(400, "Validation Error", error.issues as any);
        }
        throw error;
    }
}

/** List categories; admins get the full filterable set, everyone else the active-only view. */
export async function getAllCategories(isAdmin: boolean = false, query: any = {}) {
    if (isAdmin) {
        return await CategoryDAO.findAll(query);
    }
    return await CategoryDAO.findActive();
}

/** Fetch a category or fail with 404. */
export async function getCategoryById(id: string) {
    const category = await CategoryDAO.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    return category;
}

/** Validate a partial update; re-derives the slug whenever the title changes. */
export async function updateCategory(id: string, data: any) {
    try {
        const validatedData: UpdateCategoryBody = updateCategorySchema.parse(data);
        let updatePayload: any = { ...validatedData };

        if (validatedData.title) {
            updatePayload.slug = generateSlug(validatedData.title);
        }

        const category = await CategoryDAO.updateById(id, updatePayload);
        if (!category) {
            throw new ApiError(404, "Category not found or update failed");
        }
        return category;
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ApiError(400, "Validation Error", error.issues as any);
        }
        throw error;
    }
}

/**
 * Delete a category (after confirming it exists) and surface its image id so the
 * controller can clean up the associated ImageKit asset.
 */
export async function deleteCategory(id: string) {
    const category = await CategoryDAO.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const result = await CategoryDAO.deleteById(id);
    return { success: true, imagePublicId: category.imagePublicId };
}
