/**
 * Product Business Logic Service.
 *
 * Implements the core business rules for managing fashion catalog products.
 * Handles validation, slug generation, image uploading via ImageKit, stock mutation,
 * and category-matching guards. All persistence is delegated to ProductDAO.
 */

import * as ProductDAO from "./product.dao";
import { createProductSchema, updateProductSchema, type CreateProductBody, type UpdateProductBody } from "./product.validation";
import { ApiError } from "../../utils/ApiError";
import { ZodError } from "zod";
import { uploadToImageKit, deleteFromImageKit } from "../../utils/imagekit.util";
import { Category } from "../category/category.model";
import { RefundPolicy } from "../refundPolicy/refundPolicy.model";
import { RoleEnum } from "../rbac/rbac.types";
import { Seller } from "../seller/seller.model";
import { SizeChart } from "../sizeChart/sizeChart.model";
import { Store } from "../store/store.model";
import { buildStoreSetupStatus } from "../store/store.setup";

/* ── Internal helpers ── */

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalize = (value?: string) => (value || "").toLowerCase().trim();

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function parseJsonValue(value: unknown) {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

function parseExistingImages(value: unknown) {
    const parsed = parseJsonValue(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
        .map((image: any) => ({
            url: typeof image?.url === "string" ? image.url : "",
            fileId: typeof image?.fileId === "string" ? image.fileId : "",
        }))
        .filter((image) => image.url && image.fileId);
}

function cleanPolicyRefs(refs: any = {}) {
    const next: Record<string, string> = {};
    ["returnPolicy", "refundPolicy", "shippingPolicy", "termsPolicy"].forEach((key) => {
        if (typeof refs?.[key] === "string" && refs[key].trim()) next[key] = refs[key].trim();
    });
    return Object.keys(next).length ? next : undefined;
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 7);
}

function roleName(role: any): string {
    return role?.name || role || "";
}

function isAdminRole(role: any): boolean {
    const name = roleName(role);
    return name === RoleEnum.ADMIN || name === RoleEnum.SUPER_ADMIN;
}

function isSellerRole(role: any): boolean {
    const name = roleName(role);
    return name === RoleEnum.SELLER || name === "seller";
}

function isApprovedForPublic(product: any): boolean {
    return product?.isActive && (!product.approvalStatus || product.approvalStatus === "APPROVED");
}

function assertImageCount(total: number) {
    if (total < 1) throw new ApiError(400, "At least one product image is required.");
    if (total > 5) throw new ApiError(400, "A product can have a maximum of 5 images.");
}

async function assertSizeChartAllowed(sizeChartId: string | undefined, _sellerId: string) {
    if (!sizeChartId) return;
    const chart = await SizeChart.findOne({
        _id: sizeChartId,
        isActive: true,
        $or: [
            { scope: "GLOBAL", approvalStatus: "APPROVED" },
            { scope: "GLOBAL", approvalStatus: { $exists: false } },
        ],
    }).lean();
    if (!chart) throw new ApiError(400, "Selected size chart is not available for this seller.");
}

async function assertRefundPolicyActive(refundPolicyId: string | undefined) {
    if (!refundPolicyId) return;
    const policy = await RefundPolicy.findOne({ _id: refundPolicyId, isActive: true }).lean();
    if (!policy) throw new ApiError(400, "Selected refund policy is not active.");
}

async function assertPolicyRefsActive(policyRefs?: Record<string, string>) {
    if (!policyRefs) return;
    const expectedTypes: Record<string, string> = {
        returnPolicy: "RETURN",
        refundPolicy: "REFUND",
        shippingPolicy: "SHIPPING",
        termsPolicy: "TERMS",
    };

    await Promise.all(Object.entries(policyRefs).map(async ([key, id]) => {
        const policy = await RefundPolicy.findOne({
            _id: id,
            isActive: true,
            $or: [
                { policyType: expectedTypes[key] },
                { policyType: { $exists: false } },
                { policyType: "" }
            ]
        }).lean();
        if (!policy) throw new ApiError(400, `Selected ${key} is not an active admin policy.`);
    }));
}

async function assertCategoryAssigned(category: string, subCategory?: string) {
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

    if (subCategory) {
        const subCategorySlug = slugify(subCategory);
        const subCategoryDoc = await Category.findOne({
            isActive: true,
            parentId: categoryDoc._id.toString(),
            $or: [
                { title: { $regex: new RegExp(`^${escapeRegex(subCategory)}$`, "i") } },
                { slug: subCategorySlug },
            ],
        }).lean();

        if (!subCategoryDoc) {
            throw new ApiError(400, `Selected subcategory "${subCategory}" must be an active subcategory of "${categoryDoc.title}".`);
        }
    }

    return {
        categoryDoc,
        requestedValues: [category, subCategory, categoryDoc.title, categoryDoc.slug].filter(Boolean) as string[],
    };
}

async function assertSellerProductGate(userId: string, category: string, subCategory?: string) {
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

    await assertCategoryAssigned(category, subCategory);

    return { seller, store };
}

/* ── Exported service functions ── */

/**
 * Create a product by checking seller gates, validating references, and uploading images.
 */
export async function createProduct(data: any, files: any[], requesterId: string, role: string) {
    try {
        const validatedData = createProductSchema.parse(data);
        const ownerId = isAdminRole(role) ? validatedData.sellerId : requesterId;

        if (!ownerId) {
            throw new ApiError(400, "Seller id is required when an admin creates a product.");
        }

        const { store } = await assertSellerProductGate(ownerId, validatedData.category, validatedData.subCategory);
        assertImageCount(files.length);
        const policyRefs = cleanPolicyRefs(validatedData.policyRefs);
        await Promise.all([
            assertSizeChartAllowed(validatedData.sizeChartId, ownerId),
            assertRefundPolicyActive(validatedData.refundPolicy),
            assertPolicyRefsActive(policyRefs),
        ]);
        const slug = generateSlug(validatedData.title);
        const { sellerId: _ignoredSellerId, ...productPayload } = validatedData;
        if (productPayload.details) {
            delete productPayload.details.sku;
        }
        productPayload.policyRefs = policyRefs;
        if (policyRefs?.refundPolicy) {
            productPayload.refundPolicy = policyRefs.refundPolicy;
        }

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
            scope: isSellerRole(role) ? "SELLER" : "GLOBAL",
        });

        return product;
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ApiError(400, "Validation Error", error.issues as any);
        }
        throw error;
    }
}

/**
 * Query products with pagination support.
 */
export async function getProducts(query: any = {}) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    return await ProductDAO.findAll(query, { skip, limit });
}

/**
 * Fetch top trending/selling products.
 */
export async function getTrendingProducts() {
    return await ProductDAO.getTopSellingProducts(10);
}

/**
 * Retrieve products created by a specific seller.
 */
export async function getSellerProducts(sellerId: string) {
    return await ProductDAO.findBySellerId(sellerId);
}

/**
 * Fetch a specific product by its slug (only if active/approved).
 */
export async function getProductBySlug(slug: string) {
    const product = await ProductDAO.findBySlug(slug);
    if (!product) throw new ApiError(404, "Product not found");
    if (!isApprovedForPublic(product)) throw new ApiError(404, "Product not found");
    return product;
}

/**
 * Fetch a specific product by its ID (only if active/approved).
 */
export async function getProductById(id: string) {
    const product = await ProductDAO.findById(id);
    if (!product) throw new ApiError(404, "Product not found");
    if (!isApprovedForPublic(product)) throw new ApiError(404, "Product not found");
    return product;
}

/**
 * Validate, process image additions/removals, and update a product.
 */
export async function updateProduct(id: string, data: any, sellerId: string, role: string, files: any[] = []) {
    try {
        const product = await ProductDAO.findById(id);
        if (!product) throw new ApiError(404, "Product not found");

        if (isSellerRole(role) && product.sellerId.toString() !== sellerId.toString()) {
            throw new ApiError(403, "You do not have permission to edit this product");
        }

        const validatedData = updateProductSchema.parse(data);
        if (isSellerRole(role) || validatedData.category || validatedData.subCategory) {
            await assertSellerProductGate(
                product.sellerId.toString(),
                validatedData.category || product.category || "",
                validatedData.subCategory || product.subCategory || undefined,
            );
        }
        const policyRefs = cleanPolicyRefs(validatedData.policyRefs);
        await Promise.all([
            assertSizeChartAllowed(validatedData.sizeChartId, product.sellerId.toString()),
            assertRefundPolicyActive(validatedData.refundPolicy),
            assertPolicyRefsActive(policyRefs),
        ]);
        let updatePayload: any = { ...validatedData };
        delete updatePayload.sellerId;
        if (updatePayload.details) {
            delete updatePayload.details.sku;
        }
        if (Object.prototype.hasOwnProperty.call(validatedData, "policyRefs")) {
            updatePayload.policyRefs = policyRefs || {};
            if (policyRefs?.refundPolicy) {
                updatePayload.refundPolicy = policyRefs.refundPolicy;
            }
        }

        if (validatedData.title) {
            updatePayload.slug = generateSlug(validatedData.title);
        }

        const hasExistingImagesPayload = Object.prototype.hasOwnProperty.call(data, "existingImages");
        const retainedImages = hasExistingImagesPayload
            ? parseExistingImages(data.existingImages)
            : (product.images || []);
        assertImageCount(retainedImages.length + (files?.length || 0));

        if (files && files.length > 0) {
            const imageUploadPromises = files.map(file =>
                uploadToImageKit(file.buffer, file.originalname, "products")
            );
            const uploadResults = await Promise.all(imageUploadPromises);

            const newImages = uploadResults.map(res => ({
                url: res.url,
                fileId: res.fileId
            }));

            updatePayload.images = [...retainedImages, ...newImages];
        } else if (hasExistingImagesPayload) {
            updatePayload.images = retainedImages;
        }

        if (hasExistingImagesPayload) {
            const retainedFileIds = new Set(retainedImages.map((image) => image.fileId));
            await Promise.all(
                (product.images || [])
                    .filter((image: any) => image.fileId && !retainedFileIds.has(image.fileId))
                    .map((image: any) => deleteFromImageKit(image.fileId).catch(() => undefined)),
            );
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

/**
 * Soft delete a product after ensuring permission.
 */
export async function deleteProduct(id: string, sellerId: string, role: string) {
    const product = await ProductDAO.findById(id);
    if (!product) throw new ApiError(404, "Product not found");

    if (isSellerRole(role) && product.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(403, "You do not have permission to delete this product");
    }

    const result = await ProductDAO.softDeleteById(id);
    if (!result) throw new ApiError(500, "Failed to delete product");

    return { success: true };
}

/**
 * Find similar products using source product specs.
 */
export async function getSimilarProducts(productId: string, limit = 10) {
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
