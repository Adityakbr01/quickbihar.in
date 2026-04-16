import { ProductDAO } from "./product.dao";
import { createProductSchema, updateProductSchema, type CreateProductBody, type UpdateProductBody } from "./product.validation";
import { ApiError } from "../../utils/ApiError";
import { ZodError } from "zod";
import { uploadToImageKit, deleteFromImageKit } from "../../utils/imagekit.util";

export class ProductService {
    private static generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 7);
    }

    static async createProduct(data: any, files: any[], sellerId: string) {
        try {
            const validatedData = createProductSchema.parse(data);
            const slug = this.generateSlug(validatedData.title);

            // Upload images to ImageKit
            const imageUploadPromises = files.map(file =>
                uploadToImageKit(file.buffer, file.originalname, "products")
            );
            const uploadResults = await Promise.all(imageUploadPromises);

            const images = uploadResults.map(res => ({
                url: res.url,
                fileId: res.fileId
            }));

            const product = await ProductDAO.create({
                ...validatedData,
                slug,
                images,
                sellerId
            });

            return product;
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ApiError(400, "Validation Error", error.issues as any);
            }
            throw error;
        }
    }

    static async getProducts(query: any = {}) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.isActive !== undefined) filter.isActive = query.isActive === "true" || query.isActive === true;
        if (query.category) filter.category = query.category;
        if (query.search) filter.search = query.search;

        return await ProductDAO.findAll(filter, { skip, limit });
    }

    static async getTrendingProducts() {
        return await ProductDAO.findAll({ isTrending: true, isActive: true });
    }

    static async getSellerProducts(sellerId: string) {
        return await ProductDAO.findBySellerId(sellerId);
    }

    static async getProductBySlug(slug: string) {
        const product = await ProductDAO.findBySlug(slug);
        if (!product) throw new ApiError(404, "Product not found");
        return product;
    }

    static async getProductById(id: string) {
        const product = await ProductDAO.findById(id);
        if (!product) throw new ApiError(404, "Product not found");
        return product;
    }

    static async updateProduct(id: string, data: any, sellerId: string, role: string, files: any[] = []) {
        try {
            const product = await ProductDAO.findById(id);
            if (!product) throw new ApiError(404, "Product not found");

            // Permission check: Sellers can only edit their own products
            if (role === "seller" && product.sellerId.toString() !== sellerId) {
                throw new ApiError(403, "You do not have permission to edit this product");
            }

            const validatedData = updateProductSchema.parse(data);
            let updatePayload: any = { ...validatedData };

            if (validatedData.title) {
                updatePayload.slug = this.generateSlug(validatedData.title);
            }

            // Handle Image Updates
            if (files && files.length > 0) {
                // 1. Delete old images from ImageKit
                if (product.images && product.images.length > 0) {
                    const deletePromises = product.images.map(img => 
                        deleteFromImageKit(img.fileId)
                    );
                    await Promise.all(deletePromises);
                }

                // 2. Upload new images
                const imageUploadPromises = files.map(file =>
                    uploadToImageKit(file.buffer, file.originalname, "products")
                );
                const uploadResults = await Promise.all(imageUploadPromises);

                updatePayload.images = uploadResults.map(res => ({
                    url: res.url,
                    fileId: res.fileId
                }));
            }

            const updatedProduct = await ProductDAO.updateById(id, updatePayload);
            if (!updatedProduct) throw new ApiError(404, "Product update failed");

            return updatedProduct;
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ApiError(400, "Validation Error", error.issues as any);
            }
            throw error;
        }
    }

    static async deleteProduct(id: string, sellerId: string, role: string) {
        const product = await ProductDAO.findById(id);
        if (!product) throw new ApiError(404, "Product not found");

        if (role === "seller" && product.sellerId.toString() !== sellerId) {
            throw new ApiError(403, "You do not have permission to delete this product");
        }

        // Soft delete
        const result = await ProductDAO.softDeleteById(id);
        if (!result) throw new ApiError(500, "Failed to delete product");

        return { success: true };
    }
}
