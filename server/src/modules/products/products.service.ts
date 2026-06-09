import { ProductDAO } from "./product.dao";
import { createProductSchema, updateProductSchema, type CreateProductBody, type UpdateProductBody } from "./product.validation";
import { ApiError } from "../../utils/ApiError";
import { ZodError } from "zod";
import { uploadToImageKit, deleteFromImageKit } from "../../utils/imagekit.util";
import { Category } from "../category/category.model";
import { RoleEnum } from "../rbac/rbac.types";
import { Seller } from "../seller/seller.model";
import { Store } from "../store/store.model";
import { buildStoreSetupStatus } from "../store/store.setup";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalize = (value?: string) => (value || "").toLowerCase().trim();
const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export class ProductService {
    private static generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 7);
    }

    private static roleName(role: any) {
        return role?.name || role || "";
    }

    private static isAdminRole(role: any) {
        const name = this.roleName(role);
        return name === RoleEnum.ADMIN || name === RoleEnum.SUPER_ADMIN;
    }

    private static isSellerRole(role: any) {
        const name = this.roleName(role);
        return name === RoleEnum.SELLER || name === "seller";
    }

    private static async assertCategoryAssigned(category: string, subCategory?: string) {
        const categorySlug = slugify(category);
        const categoryDoc = await Category.findOne({
            isActive: true,
            $or: [
                { title: { $regex: new RegExp(`^${escapeRegex(category)}$`, "i") } },
                { slug: categorySlug },
            ],
        }).lean();

        if (!categoryDoc) {
            throw new ApiError(400, "Product category must be active and assigned by admin before product creation.");
        }

        return {
            categoryDoc,
            requestedValues: [category, subCategory, categoryDoc.title, categoryDoc.slug].filter(Boolean) as string[],
        };
    }

    private static async assertSellerProductGate(userId: string, category: string, subCategory?: string) {
        const [seller, store] = await Promise.all([
            Seller.findOne({ userId }).lean(),
            Store.findOne({ sellerId: userId }).sort({ createdAt: -1 }).lean(),
        ]);

        if (!seller) throw new ApiError(404, "Seller profile not found");
        if (seller.status !== "APPROVED" || !seller.isVerified) {
            throw new ApiError(403, "Seller approval is required before creating products.");
        }

        if (!store) {
            throw new ApiError(400, "Store configuration is required before creating products.");
        }

        const setup = buildStoreSetupStatus(store);
        if (!setup.isComplete) {
            throw new ApiError(400, "Store configuration must be completed before creating products.", setup.missingFields as any);
        }

        if (!store.isActive) {
            throw new ApiError(400, "Store must be active before creating products.");
        }

        const { requestedValues } = await this.assertCategoryAssigned(category, subCategory);
        const categoryConfig = store.categoryConfig || {};
        const allowedValues = [
            categoryConfig.primaryCategory,
            ...(categoryConfig.subcategories || []),
        ]
            .filter(Boolean)
            .flatMap((value: string) => [normalize(value), slugify(value)]);
        const requestedNormalized = requestedValues.flatMap((value) => [normalize(value), slugify(value)]);
        const isAllowed = requestedNormalized.some((value) => allowedValues.includes(value));

        if (!isAllowed) {
            throw new ApiError(400, "Product category is not assigned to this seller store.");
        }

        return { seller, store };
    }

    static async createProduct(data: any, files: any[], requesterId: string, role: string) {
        try {
            const validatedData = createProductSchema.parse(data);
            const ownerId = this.isAdminRole(role) ? validatedData.sellerId : requesterId;

            if (!ownerId) {
                throw new ApiError(400, "Seller id is required when an admin creates a product.");
            }

            const { store } = await this.assertSellerProductGate(ownerId, validatedData.category, validatedData.subCategory);
            const slug = this.generateSlug(validatedData.title);
            const { sellerId: _ignoredSellerId, ...productPayload } = validatedData;

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
                ...productPayload,
                slug,
                images,
                sellerId: ownerId,
                storeId: store._id,
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

        // DAO handles parsing individual filters from query object
        return await ProductDAO.findAll(query, { skip, limit });
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
            if (this.isSellerRole(role) && product.sellerId.toString() !== sellerId) {
                throw new ApiError(403, "You do not have permission to edit this product");
            }

            const validatedData = updateProductSchema.parse(data);
            if (this.isSellerRole(role) || validatedData.category || validatedData.subCategory) {
                await this.assertSellerProductGate(
                    product.sellerId.toString(),
                    validatedData.category || product.category,
                    validatedData.subCategory || product.subCategory,
                );
            }
            let updatePayload: any = { ...validatedData };
            delete updatePayload.sellerId;

            if (validatedData.title) {
                updatePayload.slug = this.generateSlug(validatedData.title);
            }

            // Handle Image Updates (APPEND new images)
            if (files && files.length > 0) {
                // 1. Upload new images
                const imageUploadPromises = files.map(file =>
                    uploadToImageKit(file.buffer, file.originalname, "products")
                );
                const uploadResults = await Promise.all(imageUploadPromises);

                const newImages = uploadResults.map(res => ({
                    url: res.url,
                    fileId: res.fileId
                }));

                // 2. Combine with existing images
                updatePayload.images = [...(product.images || []), ...newImages];
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

        if (this.isSellerRole(role) && product.sellerId.toString() !== sellerId) {
            throw new ApiError(403, "You do not have permission to delete this product");
        }

        // Soft delete
        const result = await ProductDAO.softDeleteById(id);
        if (!result) throw new ApiError(500, "Failed to delete product");

        return { success: true };
    }

    /**
     * Find similar products based on the source product's category, tags, and brand.
     */
    static async getSimilarProducts(productId: string, limit = 10) {
        const product = await ProductDAO.findById(productId);
        if (!product) throw new ApiError(404, "Product not found");

        const similar = await ProductDAO.findSimilar(
            productId,
            {
                category: product.category || undefined,
                tags: product.tags,
                brand: product.brand || undefined,
            },
            limit
        );

        return similar;
    }
}
