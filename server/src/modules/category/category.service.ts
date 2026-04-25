import { ApiError } from "../../utils/ApiError";
import { CategoryDAO } from "./category.dao";
import { createCategorySchema, updateCategorySchema, type CreateCategoryBody, type UpdateCategoryBody } from "./category.validation";
import { ZodError } from "zod";

export class CategoryService {
    private static generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    static async createCategory(data: any) {
        try {
            const validatedData: CreateCategoryBody = createCategorySchema.parse(data);
            const slug = this.generateSlug(validatedData.title);

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

    static async getAllCategories(isAdmin: boolean = false) {
        if (isAdmin) {
            return await CategoryDAO.findAll();
        }
        return await CategoryDAO.findActive();
    }

    static async getCategoryById(id: string) {
        const category = await CategoryDAO.findById(id);
        if (!category) {
            throw new ApiError(404, "Category not found");
        }
        return category;
    }

    static async updateCategory(id: string, data: any) {
        try {
            const validatedData: UpdateCategoryBody = updateCategorySchema.parse(data);
            let updatePayload: any = { ...validatedData };

            if (validatedData.title) {
                updatePayload.slug = this.generateSlug(validatedData.title);
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

    static async deleteCategory(id: string) {
        const category = await CategoryDAO.findById(id);
        if (!category) {
            throw new ApiError(404, "Category not found");
        }

        const result = await CategoryDAO.deleteById(id);
        return { success: true, imagePublicId: category.imagePublicId };
    }
}
