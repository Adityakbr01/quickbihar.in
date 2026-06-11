import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { deleteFromImageKit, uploadToImageKit } from "../../utils/imagekit.util";
import { AdminPayout } from "../admin/admin.model";
import { Banner } from "../banner/banner.model";
import { Category } from "../category/category.model";
import { Coupon } from "../coupon/coupon.model";
import { Order } from "../order/order.model";
import { OrderStatus } from "../order/order.type";
import { Product } from "../products/product.model";
import { ProductService } from "../products/products.service";
import { RefundPolicy } from "../refundPolicy/refundPolicy.model";
import { SizeChart } from "../sizeChart/sizeChart.model";
import { Mall } from "../mall/mall.model";
import { Warehouse } from "../admin/adminFull.model";
import { Store } from "../store/store.model";
import { StoreType } from "../store/store.schema";
import { buildStoreSetupStatus, mergeStoreForSetup } from "../store/store.setup";
import { User } from "../user/user.model";
import { Seller } from "./seller.model";
import {
    InventoryMovement,
    SellerCategoryRequest,
    SellerEarning,
    SellerNotification,
} from "./sellerPanel.model";

const APPROVAL_STATUSES = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const;
const FULFILLMENT_STATUSES = [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED];
const LOW_STOCK_THRESHOLD = 5;

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const normalize = (value: string) => value.toLowerCase().trim();

const uniqueTextList = (values: unknown[] = []) => {
    const seen = new Set<string>();
    return values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => {
            const key = slugify(value);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

const categoryConfigValues = (categoryConfig: any = {}) => uniqueTextList([
    categoryConfig.primaryCategory,
    ...(categoryConfig.subcategories || []),
]);

const sameCategoryConfig = (current: any = {}, next: any = {}) => {
    const currentValues = categoryConfigValues(current).map(slugify).sort();
    const nextValues = categoryConfigValues(next).map(slugify).sort();
    return currentValues.length === nextValues.length && currentValues.every((value, index) => value === nextValues[index]);
};

const assertActiveCategoryChoices = async (values: string[]) => {
    const requested = uniqueTextList(values);
    if (!requested.length) return;

    const categories = await Category.find({ isActive: true })
        .select("title slug")
        .lean();
    const allowed = new Set(
        categories.flatMap((category: any) => [
            normalize(category.title || ""),
            slugify(category.title || ""),
            normalize(category.slug || ""),
            slugify(category.slug || ""),
        ]),
    );
    const invalid = requested.filter((value) => !allowed.has(normalize(value)) && !allowed.has(slugify(value)));
    if (invalid.length) {
        throw new ApiError(400, `Seller categories must be active admin-created categories: ${invalid.join(", ")}`);
    }
};

const assertApprovedSeller = (seller: any | null) => {
    if (!seller) throw new ApiError(404, "Seller profile not found");
    if (seller.status !== "APPROVED" || !seller.isVerified) {
        throw new ApiError(403, "Seller approval is required for this action.");
    }
};

const asObjectId = (id: string | Types.ObjectId) => (
    id instanceof Types.ObjectId ? id : new Types.ObjectId(id)
);

const listOptions = (query: any = {}) => {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    return {
        page,
        limit,
        skip: (page - 1) * limit,
        sortOrder: query.sortOrder === "asc" ? 1 : -1,
    };
};

const applyDateRange = (filter: any, query: any) => {
    if (!query.dateFrom && !query.dateTo) return;
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(String(query.dateFrom));
    if (query.dateTo) filter.createdAt.$lte = new Date(String(query.dateTo));
};

const paginated = async (model: any, filter: any, query: any, sortableFields: string[] = ["createdAt"]) => {
    const { page, limit, skip, sortOrder } = listOptions(query);
    const sortBy = sortableFields.includes(query.sortBy) ? query.sortBy : "createdAt";
    const [data, total] = await Promise.all([
        model.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
        model.countDocuments(filter),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

const approvalReset = {
    approvalStatus: "DRAFT",
    reviewedBy: undefined,
    reviewedAt: undefined,
    rejectionReason: undefined,
};

const approvalPublicFilter = {
    $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }],
};

const sellerOwnsOrderItem = (item: any, sellerId: string, ownedProductIds: Set<string>) =>
    item.sellerId?.toString() === sellerId || ownedProductIds.has(item.productId?.toString());

const serializeOrderForSeller = (order: any, sellerId: string, ownedProductIds: Set<string>) => {
    const raw = typeof order.toObject === "function" ? order.toObject() : order;
    const sellerItems = (raw.items || []).filter((item: any) => sellerOwnsOrderItem(item, sellerId, ownedProductIds));
    const sellerSubtotal = sellerItems.reduce(
        (sum: number, item: any) => sum + (item.sellerSubtotal || item.price * item.quantity),
        0,
    );

    return {
        ...raw,
        items: sellerItems,
        sellerSubtotal,
        customer: raw.userId,
    };
};

export class SellerService {
    private static async getApprovedSeller(userId: string): Promise<any> {
        const seller = await Seller.findOne({ userId });
        assertApprovedSeller(seller);
        return seller as any;
    }

    private static async getLatestStore(userId: string, required = true): Promise<any> {
        const store = await Store.findOne({ sellerId: userId }).sort({ createdAt: -1 });
        if (required && !store) throw new ApiError(404, "Store configuration not found");
        return store;
    }

    private static async sellerOrderBase(userId: string) {
        const productIds = await Product.find({ sellerId: userId, isDeleted: false }).distinct("_id");
        const ownedProductIds = new Set(productIds.map((id: any) => id.toString()));

        return {
            filter: {
                $or: [
                    { "items.sellerId": asObjectId(userId) },
                    { "items.productId": { $in: productIds } },
                ],
            },
            ownedProductIds,
        };
    }

    private static async findOwnedProduct(userId: string, productId: string) {
        const product = await Product.findOne({ _id: productId, sellerId: userId, isDeleted: false });
        if (!product) throw new ApiError(404, "Product not found");
        return product;
    }

    private static async notifySeller(userId: string, data: any) {
        return await SellerNotification.create({
            sellerId: asObjectId(userId),
            ...data,
        });
    }

    static async getSetupStatus(userId: string) {
        const [seller, stores] = await Promise.all([
            Seller.findOne({ userId }).populate("mallId", "name slug address.city isActive").lean(),
            Store.find({ sellerId: userId }).sort({ createdAt: -1 }).lean(),
        ]);

        if (!seller) throw new ApiError(404, "Seller profile not found");

        const store = stores[0] || null;
        const storeSetup = store
            ? buildStoreSetupStatus(store)
            : { isComplete: false, missingFields: ["store.profile"] };
        const sellerApproved = seller.status === "APPROVED" && !!seller.isVerified;
        const hasVerifiedPayoutMethod = (seller.payoutMethods || []).some(
            (method: any) => method.status === "VERIFIED",
        );
        const storeActive = !!store?.isActive;

        return {
            seller: {
                _id: seller._id?.toString(),
                userId: seller.userId?.toString(),
                businessName: seller.businessName,
                status: seller.status,
                isVerified: !!seller.isVerified,
                sellerType: seller.sellerType,
                mallId: seller.mallId?._id?.toString() || seller.mallId?.toString(),
                mallName: (seller.mallId as any)?.name,
                mallUnit: seller.mallUnit,
                mallFloor: seller.mallFloor,
                wallet: seller.wallet || {
                    availableBalance: 0,
                    pendingPayoutBalance: 0,
                    lifetimeEarnings: 0,
                },
                payoutMethods: seller.payoutMethods || [],
            },
            store,
            setup: {
                sellerApproved,
                storeExists: !!store,
                storeConfigured: storeSetup.isComplete,
                storeMissingFields: storeSetup.missingFields,
                storeActive,
                hasVerifiedPayoutMethod,
                productsUnlocked: sellerApproved && !!store && storeSetup.isComplete && storeActive,
                payoutsUnlocked: sellerApproved && hasVerifiedPayoutMethod,
                mallLinked: !!seller.mallId,
                mallOptional: true,
            },
        };
    }

    static async getDashboard(userId: string) {
        const setup = await this.getSetupStatus(userId);
        const { filter: orderFilter, ownedProductIds } = await this.sellerOrderBase(userId);

        const [
            productStats,
            orderStats,
            lowStockCount,
            unreadNotifications,
            pendingPayouts,
            pendingReviews,
            recentOrders,
            recentNotifications,
        ] = await Promise.all([
            Product.aggregate([
                { $match: { sellerId: asObjectId(userId), isDeleted: false } },
                {
                    $group: {
                        _id: "$approvalStatus",
                        count: { $sum: 1 },
                        active: { $sum: { $cond: ["$isActive", 1, 0] } },
                    },
                },
            ]),
            Order.aggregate([
                { $match: orderFilter },
                { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$payableAmount" } } },
            ]),
            Product.countDocuments({
                sellerId: userId,
                isDeleted: false,
                totalStock: { $lte: LOW_STOCK_THRESHOLD },
            }),
            SellerNotification.countDocuments({ sellerId: userId, isRead: false }),
            AdminPayout.countDocuments({ partnerId: userId, partnerType: "SELLER", status: { $in: ["PENDING", "PROCESSING"] } }),
            Promise.all([
                Product.countDocuments({ sellerId: userId, approvalStatus: "PENDING_REVIEW", isDeleted: false }),
                Coupon.countDocuments({ sellerId: userId, approvalStatus: "PENDING_REVIEW" }),
                Banner.countDocuments({ sellerId: userId, approvalStatus: "PENDING_REVIEW" }),
                SizeChart.countDocuments({ sellerId: userId, approvalStatus: "PENDING_REVIEW" }),
            ]),
            Order.find(orderFilter).populate("userId", "fullName email phone").sort({ createdAt: -1 }).limit(5).lean(),
            SellerNotification.find({ sellerId: userId }).sort({ createdAt: -1 }).limit(5).lean(),
        ]);

        const productsByApproval = APPROVAL_STATUSES.reduce<Record<string, number>>((acc, status) => {
            acc[status] = productStats.find((item: any) => item._id === status)?.count || 0;
            return acc;
        }, {});

        return {
            setup,
            stats: {
                products: {
                    total: productStats.reduce((sum: number, item: any) => sum + item.count, 0),
                    active: productStats.reduce((sum: number, item: any) => sum + item.active, 0),
                    byApproval: productsByApproval,
                },
                orders: orderStats.reduce<Record<string, { count: number; revenue: number }>>((acc, item: any) => {
                    acc[item._id || "UNKNOWN"] = { count: item.count, revenue: item.revenue };
                    return acc;
                }, {}),
                lowStockCount,
                unreadNotifications,
                pendingPayouts,
                pendingReviews: pendingReviews.reduce((sum, count) => sum + count, 0),
            },
            recentOrders: recentOrders.map((order) => serializeOrderForSeller(order, userId, ownedProductIds)),
            recentNotifications,
        };
    }

    static async getStore(userId: string) {
        await this.getApprovedSeller(userId);
        const store = await this.getLatestStore(userId, false);
        const setup = store ? buildStoreSetupStatus(store) : { isComplete: false, missingFields: ["store.profile"] };

        return { store, setup };
    }

    static async saveStore(userId: string, data: any) {
        const seller = await this.getApprovedSeller(userId);
        if (seller.sellerType !== StoreType.CLOTHING) {
            throw new ApiError(400, "Only fashion clothing seller stores are supported.");
        }

        const existingStore = await this.getLatestStore(userId, false);
        const payload: any = { ...data };

        if (payload.currentLocation) {
            payload.currentLocation = {
                type: "Point",
                coordinates: [payload.currentLocation.lng, payload.currentLocation.lat],
            };
        }

        if (payload.categoryConfig) {
            const nextCategoryConfig = {
                ...payload.categoryConfig,
                primaryCategory: payload.categoryConfig.primaryCategory?.trim(),
                subcategories: uniqueTextList(payload.categoryConfig.subcategories || []),
            };
            await assertActiveCategoryChoices(categoryConfigValues(nextCategoryConfig));
            payload.categoryConfig = {
                ...(existingStore?.categoryConfig || {}),
                ...nextCategoryConfig,
                assignedByAdmin: existingStore?.categoryConfig?.assignedByAdmin || false,
            };
        }

        if (!existingStore) {
            if (!payload.name) throw new ApiError(400, "Store name is required");
            payload.sellerId = asObjectId(userId);
            payload.type = StoreType.CLOTHING;
            payload.isActive = true;
            payload.isOpen = false;
            payload.isVerified = seller.isVerified;
        }

        const setupInput = existingStore ? mergeStoreForSetup(existingStore, payload) : payload;
        const setup = buildStoreSetupStatus(setupInput);
        payload.isSetupComplete = setup.isComplete;
        payload.setupMissingFields = setup.missingFields;
        payload.setupCompletedAt = setup.isComplete
            ? (existingStore?.setupCompletedAt || new Date())
            : null;

        const store = existingStore
            ? await Store.findByIdAndUpdate(existingStore._id, { $set: payload }, { returnDocument: "after" })
            : await Store.create(payload);

        return { store, setup: buildStoreSetupStatus(store) };
    }

    static async toggleStoreOpen(userId: string, data: any) {
        await this.getApprovedSeller(userId);
        const store = await this.getLatestStore(userId);
        store.isOpen = data.isOpen;
        await store.save();
        return store;
    }

    static async listProducts(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const filter: any = { sellerId: userId, isDeleted: false };
        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            filter.$or = [
                { title: searchRegex },
                { brand: searchRegex },
                { category: searchRegex },
                { subCategory: searchRegex },
                { "details.sku": searchRegex },
            ];
        }
        if (query.status === "active") filter.isActive = true;
        if (query.status === "inactive") filter.isActive = false;
        if (query.approvalStatus && query.approvalStatus !== "ALL") filter.approvalStatus = query.approvalStatus;

        return await paginated(Product, filter, query, ["createdAt", "title", "price", "totalStock", "approvalStatus"]);
    }

    static async createProduct(userId: string, data: any, files: any[] = []) {
        await this.getApprovedSeller(userId);
        const product = await ProductService.createProduct(
            { ...data, isActive: data.isActive ?? false },
            files,
            userId,
            "SELLER",
        );

        return await Product.findByIdAndUpdate(
            product._id,
            {
                $set: {
                    approvalStatus: "DRAFT",
                    isActive: false,
                },
                $unset: {
                    reviewedBy: 1,
                    reviewedAt: 1,
                    rejectionReason: 1,
                },
            },
            { returnDocument: "after" },
        );
    }

    static async updateProduct(userId: string, productId: string, data: any, files: any[] = []) {
        await this.findOwnedProduct(userId, productId);
        await ProductService.updateProduct(productId, data, userId, "SELLER", files);

        return await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    ...approvalReset,
                    isActive: false,
                },
                $unset: {
                    reviewedBy: 1,
                    reviewedAt: 1,
                    rejectionReason: 1,
                },
            },
            { returnDocument: "after" },
        );
    }

    static async deleteProduct(userId: string, productId: string) {
        return await ProductService.deleteProduct(productId, userId, "SELLER");
    }

    static async submitProductForReview(userId: string, productId: string) {
        const product = await this.findOwnedProduct(userId, productId);
        if (!product.images?.length) throw new ApiError(400, "At least one product image is required before review");
        if (!product.variants?.length) throw new ApiError(400, "At least one product variant is required before review");

        product.approvalStatus = "PENDING_REVIEW";
        product.isActive = false;
        product.reviewedBy = undefined;
        product.reviewedAt = undefined;
        product.rejectionReason = undefined;
        await product.save();
        return product;
    }

    static async listCategories(userId: string) {
        await this.getApprovedSeller(userId);
        const [store, categories, requests] = await Promise.all([
            this.getLatestStore(userId, false),
            Category.find({ isActive: true }).sort({ sortOrder: 1, title: 1 }).lean(),
            SellerCategoryRequest.find({ sellerId: userId }).sort({ createdAt: -1 }).limit(20).lean(),
        ]);

        return {
            assigned: store?.categoryConfig || null,
            available: categories,
            requests,
        };
    }

    static async listPolicies(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        return await RefundPolicy.find({
            isActive: true,
            ...(query.type ? { policyType: query.type } : {}),
        }).sort({ policyType: 1, name: 1 }).lean();
    }

    static async listRefundPolicies(userId: string) {
        return await this.listPolicies(userId, { type: "REFUND" });
    }

    static async listWarehouses(userId: string) {
        await this.getApprovedSeller(userId);
        return await Warehouse.find({ isActive: true })
            .select("name code address contact serviceAreas capacity isActive")
            .sort({ name: 1 })
            .lean();
    }

    static async requestCategoryChange(userId: string, data: any) {
        await this.getApprovedSeller(userId);
        const store = await this.getLatestStore(userId);
        const pending = await SellerCategoryRequest.findOne({ sellerId: userId, status: "PENDING" }).lean();
        if (pending) throw new ApiError(400, "A category change request is already pending");
        await assertActiveCategoryChoices([data.requestedPrimaryCategory, ...(data.requestedSubcategories || [])]);

        const request = await SellerCategoryRequest.create({
            sellerId: asObjectId(userId),
            storeId: store._id,
            currentPrimaryCategory: store.categoryConfig?.primaryCategory,
            currentSubcategories: store.categoryConfig?.subcategories || [],
            requestedPrimaryCategory: data.requestedPrimaryCategory,
            requestedSubcategories: data.requestedSubcategories || [],
            message: data.message,
            status: "PENDING",
        });

        return request;
    }

    static async listInventory(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const filter: any = { sellerId: userId, isDeleted: false };
        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            filter.$or = [{ title: searchRegex }, { "variants.sku": searchRegex }, { brand: searchRegex }];
        }
        if (query.status === "low") filter.totalStock = { $lte: LOW_STOCK_THRESHOLD };
        if (query.status === "out") filter.totalStock = 0;

        const result = await paginated(Product, filter, query, ["createdAt", "title", "totalStock"]);
        return {
            ...result,
            data: result.data.map((product: any) => ({
                _id: product._id,
                title: product.title,
                sku: product.details?.sku,
                brand: product.brand,
                category: product.category,
                subCategory: product.subCategory,
                price: product.price,
                originalPrice: product.originalPrice,
                images: product.images || [],
                totalStock: product.totalStock,
                isActive: product.isActive,
                approvalStatus: product.approvalStatus,
                variants: product.variants,
                lowStock: (product.totalStock || 0) <= LOW_STOCK_THRESHOLD,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            })),
        };
    }

    static async updateVariantStock(userId: string, data: any) {
        const product: any = await this.findOwnedProduct(userId, data.productId);
        const variant = product.variants.find((item: any) => item.sku === data.sku);
        if (!variant) throw new ApiError(404, "Variant not found");

        const previousStock = variant.stock || 0;
        const newStock = data.stock;
        variant.stock = newStock;
        product.totalStock = product.variants.reduce((sum: number, item: any) => sum + (item.stock || 0), 0);
        product.markModified("variants");
        await product.save();

        const movement = await InventoryMovement.create({
            sellerId: asObjectId(userId),
            storeId: product.storeId,
            productId: product._id,
            sku: data.sku,
            variantLabel: [variant.size, variant.color].filter(Boolean).join(" / "),
            movementType: newStock > previousStock ? "IN" : newStock < previousStock ? "OUT" : "ADJUSTMENT",
            quantity: newStock - previousStock,
            previousStock,
            newStock,
            reason: data.reason,
            createdBy: asObjectId(userId),
        });

        if (newStock <= LOW_STOCK_THRESHOLD) {
            await this.notifySeller(userId, {
                type: "LOW_STOCK",
                title: "Low stock alert",
                message: `${product.title} (${data.sku}) has ${newStock} units left.`,
                severity: newStock === 0 ? "ERROR" : "WARNING",
                resourceType: "PRODUCT",
                resourceId: product._id.toString(),
            });
        }

        return { product, movement };
    }

    static async listInventoryMovements(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const filter: any = { sellerId: userId };
        if (query.search) filter.sku = { $regex: new RegExp(String(query.search), "i") };
        if (query.status && query.status !== "ALL") filter.movementType = query.status;
        applyDateRange(filter, query);

        return await paginated(InventoryMovement, filter, query, ["createdAt", "sku", "movementType"]);
    }

    static async listOrders(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const { filter, ownedProductIds } = await this.sellerOrderBase(userId);
        const orderFilter: any = { ...filter };
        if (query.status && query.status !== "ALL") orderFilter.status = query.status;
        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            orderFilter.$and = [
                { $or: orderFilter.$or },
                {
                    $or: [
                        { orderId: searchRegex },
                        { "shippingAddress.fullName": searchRegex },
                        { "shippingAddress.phone": searchRegex },
                        { "items.title": searchRegex },
                        { "items.sku": searchRegex },
                    ],
                },
            ];
            delete orderFilter.$or;
        }
        applyDateRange(orderFilter, query);

        const { page, limit, skip, sortOrder } = listOptions(query);
        const sortBy = ["createdAt", "payableAmount", "status", "orderId"].includes(query.sortBy)
            ? query.sortBy
            : "createdAt";
        const [orders, total] = await Promise.all([
            Order.find(orderFilter)
                .populate("userId", "fullName email phone")
                .sort({ [sortBy]: sortOrder as 1 | -1 })
                .skip(skip)
                .limit(limit),
            Order.countDocuments(orderFilter),
        ]);

        return {
            data: orders.map((order) => serializeOrderForSeller(order, userId, ownedProductIds)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    static async getOrder(userId: string, orderId: string) {
        await this.getApprovedSeller(userId);
        const { ownedProductIds } = await this.sellerOrderBase(userId);
        const order = Types.ObjectId.isValid(orderId)
            ? await Order.findById(orderId).populate("userId", "fullName email phone")
            : await Order.findOne({ orderId }).populate("userId", "fullName email phone");

        if (!order) throw new ApiError(404, "Order not found");

        const serialized = serializeOrderForSeller(order, userId, ownedProductIds);
        if (!serialized.items.length) throw new ApiError(403, "You do not have permission to view this order");
        return serialized;
    }

    static async updateOrderFulfillmentStatus(userId: string, orderId: string, data: any) {
        if (!FULFILLMENT_STATUSES.includes(data.status)) {
            throw new ApiError(400, "Seller can only update confirmed, processing, or shipped statuses");
        }

        const order = await this.getOrder(userId, orderId);
        if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.REFUNDED, OrderStatus.FAILED].includes(order.status)) {
            throw new ApiError(400, `Order cannot be changed from ${order.status}`);
        }

        const updated = await Order.findByIdAndUpdate(
            order._id,
            { $set: { status: data.status } },
            { returnDocument: "after" },
        ).populate("userId", "fullName email phone");

        await this.notifySeller(userId, {
            type: "ORDER",
            title: `Order ${order.orderId} updated`,
            message: `You updated order ${order.orderId} to ${data.status}.`,
            severity: "SUCCESS",
            resourceType: "ORDER",
            resourceId: order._id.toString(),
        });

        return updated;
    }

    static async listCoupons(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const filter: any = { sellerId: userId, scope: "SELLER" };
        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            filter.$or = [{ code: searchRegex }, { description: searchRegex }];
        }
        if (query.status === "active") {
            filter.isActive = true;
            filter.endDate = { $gte: new Date() };
        }
        if (query.status === "inactive") filter.isActive = false;
        if (query.status === "expired") filter.endDate = { $lt: new Date() };
        if (query.approvalStatus && query.approvalStatus !== "ALL") filter.approvalStatus = query.approvalStatus;

        return await paginated(Coupon, filter, query, ["createdAt", "code", "discountValue", "endDate"]);
    }

    static async createCoupon(userId: string, data: any) {
        await this.getApprovedSeller(userId);
        const store = await this.getLatestStore(userId, false);
        const existing = await Coupon.findOne({ code: data.code.toUpperCase() }).lean();
        if (existing) throw new ApiError(400, "Coupon code already exists");

        if (data.appliesTo === "SPECIFIC") {
            if (!data.productIds || !data.productIds.length) {
                throw new ApiError(400, "At least one product must be selected for specific coupons");
            }
            const count = await Product.countDocuments({
                _id: { $in: data.productIds },
                sellerId: userId,
                isDeleted: false
            });
            if (count !== data.productIds.length) {
                throw new ApiError(400, "One or more selected products do not belong to you");
            }
        }

        return await Coupon.create({
            ...data,
            code: data.code.toUpperCase(),
            minOrderValue: data.minOrderValue || 0,
            startDate: data.startDate || new Date(),
            endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            usageLimit: data.usageLimit || 100,
            usageLimitPerUser: data.usageLimitPerUser || 1,
            isActive: false,
            scope: "SELLER",
            sellerId: asObjectId(userId),
            storeId: store?._id,
            approvalStatus: "DRAFT",
        });
    }

    static async updateCoupon(userId: string, couponId: string, data: any) {
        const coupon = await Coupon.findOne({ _id: couponId, sellerId: userId, scope: "SELLER" });
        if (!coupon) throw new ApiError(404, "Coupon not found");

        const appliesTo = data.appliesTo !== undefined ? data.appliesTo : coupon.appliesTo;
        const productIds = data.productIds !== undefined ? data.productIds : coupon.productIds;

        if (appliesTo === "SPECIFIC") {
            if (!productIds || !productIds.length) {
                throw new ApiError(400, "At least one product must be selected for specific coupons");
            }
            const count = await Product.countDocuments({
                _id: { $in: productIds },
                sellerId: userId,
                isDeleted: false
            });
            if (count !== productIds.length) {
                throw new ApiError(400, "One or more selected products do not belong to you");
            }
        }

        Object.assign(coupon, {
            ...data,
            code: data.code ? data.code.toUpperCase() : coupon.code,
            isActive: false,
            approvalStatus: "DRAFT",
            reviewedBy: undefined,
            reviewedAt: undefined,
            rejectionReason: undefined,
        });
        await coupon.save();
        return coupon;
    }

    static async deleteCoupon(userId: string, couponId: string) {
        const coupon = await Coupon.findOneAndDelete({ _id: couponId, sellerId: userId, scope: "SELLER" });
        if (!coupon) throw new ApiError(404, "Coupon not found");
        return coupon;
    }

    static async submitCouponForReview(userId: string, couponId: string) {
        const coupon = await Coupon.findOne({ _id: couponId, sellerId: userId, scope: "SELLER" });
        if (!coupon) throw new ApiError(404, "Coupon not found");
        coupon.approvalStatus = "PENDING_REVIEW";
        coupon.isActive = false;
        coupon.reviewedBy = undefined;
        coupon.reviewedAt = undefined;
        coupon.rejectionReason = undefined;
        await coupon.save();
        return coupon;
    }

    static async listCustomers(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const { filter, ownedProductIds } = await this.sellerOrderBase(userId);
        const orders = await Order.find(filter).populate("userId", "fullName email phone").sort({ createdAt: -1 }).lean();
        const customers = new Map<string, any>();

        orders.forEach((order: any) => {
            const sellerItems = (order.items || []).filter((item: any) => sellerOwnsOrderItem(item, userId, ownedProductIds));
            if (!sellerItems.length || !order.userId) return;
            const customerId = order.userId._id?.toString() || order.userId.toString();
            const revenue = sellerItems.reduce((sum: number, item: any) => sum + (item.sellerSubtotal || item.price * item.quantity), 0);
            const current = customers.get(customerId) || {
                _id: customerId,
                fullName: order.userId.fullName,
                email: order.userId.email,
                phone: order.userId.phone,
                orderCount: 0,
                revenue: 0,
                lastOrderAt: order.createdAt,
            };

            current.orderCount += 1;
            current.revenue += revenue;
            if (new Date(order.createdAt) > new Date(current.lastOrderAt)) current.lastOrderAt = order.createdAt;
            customers.set(customerId, current);
        });

        let data = Array.from(customers.values());
        if (query.search) {
            const search = String(query.search).toLowerCase();
            data = data.filter((customer) =>
                [customer.fullName, customer.email, customer.phone].some((value) => String(value || "").toLowerCase().includes(search)),
            );
        }
        data.sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());

        const { page, limit, skip } = listOptions(query);
        return {
            data: data.slice(skip, skip + limit),
            total: data.length,
            page,
            limit,
            totalPages: Math.ceil(data.length / limit),
        };
    }

    static async listBanners(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const filter: any = { sellerId: userId, scope: "SELLER" };
        if (query.search) filter.title = { $regex: new RegExp(String(query.search), "i") };
        if (query.status === "active") filter.isActive = true;
        if (query.status === "inactive") filter.isActive = false;
        if (query.approvalStatus && query.approvalStatus !== "ALL") filter.approvalStatus = query.approvalStatus;
        return await paginated(Banner, filter, query, ["createdAt", "priority", "title"]);
    }

    static async createBanner(userId: string, data: any, file?: any) {
        await this.getApprovedSeller(userId);
        const store = await this.getLatestStore(userId, false);
        let image = data.image;
        let imagePublicId = data.imagePublicId;

        if (file) {
            const upload = await uploadToImageKit(file.buffer, file.originalname, "seller-banners");
            image = upload.url;
            imagePublicId = upload.fileId;
        }

        if (!image || !imagePublicId) throw new ApiError(400, "Banner image is required");

        return await Banner.create({
            ...data,
            image,
            imagePublicId,
            isActive: false,
            scope: "SELLER",
            sellerId: asObjectId(userId),
            storeId: store?._id,
            approvalStatus: "DRAFT",
        });
    }

    static async updateBanner(userId: string, bannerId: string, data: any, file?: any) {
        const banner = await Banner.findOne({ _id: bannerId, sellerId: userId, scope: "SELLER" });
        if (!banner) throw new ApiError(404, "Banner not found");

        const update: any = { ...data };
        if (file) {
            const upload = await uploadToImageKit(file.buffer, file.originalname, "seller-banners");
            if (banner.imagePublicId) await deleteFromImageKit(banner.imagePublicId);
            update.image = upload.url;
            update.imagePublicId = upload.fileId;
        }

        Object.assign(banner, {
            ...update,
            isActive: false,
            approvalStatus: "DRAFT",
            reviewedBy: undefined,
            reviewedAt: undefined,
            rejectionReason: undefined,
        });
        await banner.save();
        return banner;
    }

    static async deleteBanner(userId: string, bannerId: string) {
        const banner = await Banner.findOneAndDelete({ _id: bannerId, sellerId: userId, scope: "SELLER" });
        if (!banner) throw new ApiError(404, "Banner not found");
        if (banner.imagePublicId) await deleteFromImageKit(banner.imagePublicId);
        return banner;
    }

    static async submitBannerForReview(userId: string, bannerId: string) {
        const banner = await Banner.findOne({ _id: bannerId, sellerId: userId, scope: "SELLER" });
        if (!banner) throw new ApiError(404, "Banner not found");
        banner.approvalStatus = "PENDING_REVIEW";
        banner.isActive = false;
        banner.reviewedBy = undefined;
        banner.reviewedAt = undefined;
        banner.rejectionReason = undefined;
        await banner.save();
        return banner;
    }

    static async listSizeCharts(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const filter: any = { scope: "GLOBAL", isActive: true, ...approvalPublicFilter };
        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            filter.$or = [{ name: searchRegex }, { category: searchRegex }];
        }
        if (query.approvalStatus && query.approvalStatus !== "ALL") {
            filter.approvalStatus = query.approvalStatus;
        }

        return await paginated(SizeChart, filter, query, ["createdAt", "name", "category"]);
    }

    static async createSizeChart(userId: string, data: any) {
        await this.getApprovedSeller(userId);
        const store = await this.getLatestStore(userId, false);
        return await SizeChart.create({
            ...data,
            scope: "SELLER",
            sellerId: asObjectId(userId),
            storeId: store?._id,
            isActive: false,
            approvalStatus: "DRAFT",
        });
    }

    static async updateSizeChart(userId: string, chartId: string, data: any) {
        const chart = await SizeChart.findOne({ _id: chartId, sellerId: userId, scope: "SELLER" });
        if (!chart) throw new ApiError(404, "Size chart not found");
        Object.assign(chart, {
            ...data,
            isActive: false,
            approvalStatus: "DRAFT",
            reviewedBy: undefined,
            reviewedAt: undefined,
            rejectionReason: undefined,
        });
        await chart.save();
        return chart;
    }

    static async deleteSizeChart(userId: string, chartId: string) {
        const chart = await SizeChart.findOneAndDelete({ _id: chartId, sellerId: userId, scope: "SELLER" });
        if (!chart) throw new ApiError(404, "Size chart not found");
        await Product.updateMany({ sellerId: userId, sizeChartId: chart._id }, { $unset: { sizeChartId: 1 } });
        return chart;
    }

    static async submitSizeChartForReview(userId: string, chartId: string) {
        const chart = await SizeChart.findOne({ _id: chartId, sellerId: userId, scope: "SELLER" });
        if (!chart) throw new ApiError(404, "Size chart not found");
        chart.approvalStatus = "PENDING_REVIEW";
        chart.isActive = false;
        chart.reviewedBy = undefined;
        chart.reviewedAt = undefined;
        chart.rejectionReason = undefined;
        await chart.save();
        return chart;
    }

    static async assignSizeChartProducts(userId: string, chartId: string, productIds: string[]) {
        const chart = await SizeChart.findOne({
            _id: chartId,
            scope: "GLOBAL",
            isActive: true,
            ...approvalPublicFilter,
        });
        if (!chart) throw new ApiError(404, "Size chart not found");

        const ownedProducts = await Product.find({ _id: { $in: productIds }, sellerId: userId, isDeleted: false }).select("_id").lean();
        if (ownedProducts.length !== productIds.length) {
            throw new ApiError(400, "Only owned seller products can be assigned");
        }

        await Product.updateMany({ sellerId: userId, sizeChartId: chart._id }, { $unset: { sizeChartId: 1 } });
        await Product.updateMany({ _id: { $in: productIds }, sellerId: userId }, { $set: { sizeChartId: chart._id } });

        chart.productIds = productIds.map((id) => asObjectId(id));
        await chart.save();
        return chart;
    }

    static async listPayouts(userId: string) {
        await this.getApprovedSeller(userId);
        const [payouts, earnings] = await Promise.all([
            AdminPayout.find({ partnerId: userId, partnerType: "SELLER" })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean(),
            SellerEarning.find({ sellerId: userId }).sort({ createdAt: -1 }).limit(100).lean(),
        ]);

        return { payouts, earnings };
    }

    static async getReports(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const { filter, ownedProductIds } = await this.sellerOrderBase(userId);
        applyDateRange(filter, query);
        const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
        const products = await Product.find({ sellerId: userId, isDeleted: false }).lean();

        const summary = {
            orders: 0,
            unitsSold: 0,
            grossRevenue: 0,
            deliveredRevenue: 0,
            customers: new Set<string>(),
        };
        const productPerformance = new Map<string, any>();

        orders.forEach((order: any) => {
            const sellerItems = (order.items || []).filter((item: any) => sellerOwnsOrderItem(item, userId, ownedProductIds));
            if (!sellerItems.length) return;
            summary.orders += 1;
            summary.customers.add(order.userId?.toString());

            sellerItems.forEach((item: any) => {
                const amount = item.sellerSubtotal || item.price * item.quantity;
                summary.unitsSold += item.quantity;
                summary.grossRevenue += amount;
                if (order.status === OrderStatus.DELIVERED) summary.deliveredRevenue += amount;

                const key = item.productId?.toString();
                const current = productPerformance.get(key) || {
                    productId: key,
                    title: item.title,
                    sku: item.sku,
                    quantity: 0,
                    revenue: 0,
                };
                current.quantity += item.quantity;
                current.revenue += amount;
                productPerformance.set(key, current);
            });
        });

        return {
            summary: {
                ...summary,
                customers: summary.customers.size,
            },
            productPerformance: Array.from(productPerformance.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 20),
            inventory: {
                totalProducts: products.length,
                activeProducts: products.filter((product: any) => product.isActive).length,
                lowStockProducts: products.filter((product: any) => (product.totalStock || 0) <= LOW_STOCK_THRESHOLD).length,
                totalStock: products.reduce((sum: number, product: any) => sum + (product.totalStock || 0), 0),
            },
        };
    }

    static async listNotifications(userId: string, query: any = {}) {
        await this.getApprovedSeller(userId);
        const filter: any = { sellerId: userId };
        if (query.status === "unread") filter.isRead = false;
        if (query.status === "read") filter.isRead = true;
        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            filter.$or = [{ title: searchRegex }, { message: searchRegex }];
        }
        return await paginated(SellerNotification, filter, query, ["createdAt", "type", "isRead"]);
    }

    static async markNotificationRead(userId: string, notificationId: string) {
        const notification = await SellerNotification.findOneAndUpdate(
            { _id: notificationId, sellerId: userId },
            { $set: { isRead: true } },
            { returnDocument: "after" },
        );
        if (!notification) throw new ApiError(404, "Notification not found");
        return notification;
    }

    static async requestMallConnection(userId: string, data: any) {
        const [seller, mall] = await Promise.all([
            this.getApprovedSeller(userId),
            Mall.findOne({ _id: data.mallId, isActive: true }).lean(),
        ]);

        if (!mall) throw new ApiError(404, "Active mall not found");

        if (seller.mallId?.toString() === data.mallId) {
            throw new ApiError(400, "Seller is already linked to this mall");
        }

        if (seller.mallRequest?.status === "PENDING") {
            throw new ApiError(400, "A mall connection request is already pending");
        }

        seller.mallRequest = {
            mallId: new Types.ObjectId(data.mallId),
            mallUnit: data.mallUnit,
            mallFloor: data.mallFloor,
            message: data.message,
            status: "PENDING",
            requestedAt: new Date(),
        };

        await seller.save();
        await this.notifySeller(userId, {
            type: "MALL",
            title: "Mall request submitted",
            message: "Your mall connection request is waiting for admin approval.",
            severity: "INFO",
            resourceType: "MALL",
            resourceId: data.mallId,
        });
        return await seller.populate("mallRequest.mallId", "name slug address.city isActive");
    }

    static async requestMallCreation(userId: string, data: any) {
        await this.getApprovedSeller(userId);

        const pendingMall = await Mall.findOne({ requestedBy: userId, status: "PENDING" }).lean();
        if (pendingMall) {
            throw new ApiError(400, "A mall creation request is already pending");
        }

        const baseSlug = slugify(data.name);
        let slug = baseSlug;
        let suffix = 1;

        while (await Mall.exists({ slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        const mall = await Mall.create({
            name: data.name,
            slug,
            description: data.description,
            address: data.address,
            contact: data.contact,
            isActive: false,
            status: "PENDING",
            requestedBy: new Types.ObjectId(userId),
            request: {
                mallUnit: data.mallUnit,
                mallFloor: data.mallFloor,
                message: data.message,
            },
        });

        await this.notifySeller(userId, {
            type: "MALL",
            title: "New mall request submitted",
            message: `${data.name} has been sent to admin for review.`,
            severity: "INFO",
            resourceType: "MALL",
            resourceId: mall._id.toString(),
        });

        return mall;
    }

    static async addPayoutMethod(userId: string, data: any) {
        const seller = await this.getApprovedSeller(userId);

        const methods = seller.payoutMethods || [];
        const isFirstMethod = methods.length === 0;

        if (isFirstMethod) {
            data.isDefault = true;
        }

        seller.payoutMethods.push({
            ...data,
            status: "PENDING_VERIFICATION",
            createdAt: new Date(),
        });

        await seller.save();
        await this.notifySeller(userId, {
            type: "PAYOUT",
            title: "Payout method submitted",
            message: "Your payout method is waiting for admin verification.",
            severity: "INFO",
            resourceType: "PAYOUT_METHOD",
        });
        return seller.payoutMethods[seller.payoutMethods.length - 1];
    }

    static async setDefaultPayoutMethod(userId: string, methodId: string) {
        const seller = await this.getApprovedSeller(userId);

        const method = seller.payoutMethods.id(methodId);
        if (!method) throw new ApiError(404, "Payout method not found");
        if (method.status !== "VERIFIED") {
            throw new ApiError(400, "Only verified payout methods can be set as default");
        }

        seller.payoutMethods.forEach((item: any) => {
            item.isDefault = item._id.toString() === methodId;
        });

        await seller.save();
        return seller.payoutMethods;
    }

    static async createPayoutRequest(userId: string, data: any) {
        const seller = await this.getApprovedSeller(userId);

        const method = seller.payoutMethods.id(data.payoutMethodId);
        if (!method) throw new ApiError(404, "Payout method not found");
        if (method.status !== "VERIFIED") {
            throw new ApiError(400, "A verified payout method is required before requesting payout");
        }

        const wallet = seller.wallet || {
            availableBalance: 0,
            pendingPayoutBalance: 0,
            lifetimeEarnings: 0,
        };

        if ((wallet.availableBalance || 0) < data.amount) {
            throw new ApiError(400, "Insufficient available balance for this payout request");
        }

        wallet.availableBalance -= data.amount;
        wallet.pendingPayoutBalance = (wallet.pendingPayoutBalance || 0) + data.amount;
        seller.wallet = wallet;

        const payout = await AdminPayout.create({
            partnerId: new Types.ObjectId(userId),
            partnerType: "SELLER",
            amount: data.amount,
            method: method.type,
            payoutMethodId: method._id,
            note: data.note,
            status: "PENDING",
            requestedBy: new Types.ObjectId(userId),
        });

        await seller.save();
        await this.notifySeller(userId, {
            type: "PAYOUT",
            title: "Payout requested",
            message: `Your payout request for Rs. ${data.amount} is waiting for admin processing.`,
            severity: "INFO",
            resourceType: "PAYOUT",
            resourceId: payout._id.toString(),
        });
        return await payout.populate("partnerId", "fullName email");
    }
}
