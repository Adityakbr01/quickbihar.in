import { Types } from "mongoose";
import { ENV } from "../../config/env.config";
import { ApiError } from "../../utils/ApiError";
import { MailService } from "../../utils/mail.service";
import { Banner } from "../banner/banner.model";
import { Coupon } from "../coupon/coupon.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { Mall } from "../mall/mall.model";
import { MallService } from "../mall/mall.service";
import { Order } from "../order/order.model";
import { Product } from "../products/product.model";
import { RefundPolicy } from "../refundPolicy/refundPolicy.model";
import { Role } from "../rbac/rbac.model";
import * as rbacService from "../rbac/rbac.service";
import { RoleEnum } from "../rbac/rbac.types";
import { Seller } from "../seller/seller.model";
import { InventoryMovement, SellerCategoryRequest, SellerNotification } from "../seller/sellerPanel.model";
import { SizeChart } from "../sizeChart/sizeChart.model";
import { Store } from "../store/store.model";
import { buildStoreSetupStatus, mergeStoreForSetup } from "../store/store.setup";
import { User } from "../user/user.model";
import {
    ActivityLog,
    AdminSystemConfig,
    Announcement,
    AuditLog,
    BackupJob,
    BlogPost,
    CMSPage,
    FAQ,
    FlashSale,
    ShippingProvider,
    Warehouse,
} from "./adminFull.model";
import { AdminPayout } from "./admin.model";

const userProjection = "-password -refreshToken -fcmToken";

const roleNameOf = (role: any) => role?.name || role || "USER";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const managementCatalog = [
    {
        id: "core-management",
        title: "Core Management",
        features: [
            { name: "Order Management", status: "ACTIVE", module: "order", route: "/api/v1/orders", note: "Order creation, user orders, admin order listing, and status updates exist." },
            { name: "Product Management", status: "ACTIVE", module: "products", route: "/api/v1/products", note: "Product CRUD, public listing, trending, and similar products exist." },
            { name: "Category Management", status: "ACTIVE", module: "category", route: "/api/v1/categories", note: "Public and admin category management exists." },
            { name: "Coupon & Discount Management", status: "ACTIVE", module: "coupon", route: "/api/v1/coupons", note: "Coupon CRUD and validation exist." },
            { name: "Banner Management", status: "ACTIVE", module: "banner", route: "/api/v1/banners", note: "Banner CRUD, impressions, clicks, and placements exist." },
            { name: "Size Chart Management", status: "ACTIVE", module: "sizeChart", route: "/api/v1/size-charts", note: "Size chart CRUD exists." },
            { name: "User Management", status: "ACTIVE", module: "user/admin", route: "/api/v1/admin/people", note: "Admin can search users, filter roles, and ban/unban." },
            { name: "Seller Management", status: "ACTIVE", module: "seller/admin", route: "/api/v1/admin/people?role=SELLER", note: "Admin can approve/reject sellers and manage mall assignment." },
            { name: "Mall Management", status: "ACTIVE", module: "mall/admin", route: "/api/v1/admin/malls", note: "Admin can create malls, feature top malls, and approve seller mall requests." },
        ],
    },
    {
        id: "store-configuration",
        title: "Store Configuration",
        features: [
            { name: "Store Name", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in app config store settings." },
            { name: "App Title", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in app config store settings." },
            { name: "Meta Title", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in SEO settings." },
            { name: "Meta Description", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in SEO settings." },
            { name: "Meta Keywords", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed as an array of SEO keywords." },
            { name: "Free Shipping Threshold", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in shipping settings." },
            { name: "Shipping Fee Configuration", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in shipping settings." },
            { name: "Tax Configuration", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Tax enable/rate/inclusive settings added." },
            { name: "Currency Settings", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Currency code and symbol settings added." },
            { name: "Delivery Settings", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Default radius, minimum order, and ETA settings added." },
            { name: "Return & Refund Policy", status: "ACTIVE", module: "refundPolicy/appConfig", route: "/api/v1/refund-policies", note: "Dedicated refund policy module and app config policy field exist." },
            { name: "Terms & Conditions", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in policy settings." },
            { name: "Privacy Policy", status: "ACTIVE", module: "appConfig", route: "/api/v1/app-config", note: "Managed in policy settings." },
        ],
    },
    {
        id: "content-management",
        title: "Content Management",
        features: [
            { name: "CMS Pages Management", status: "ACTIVE", module: "admin/cms", route: "/api/v1/admin/cms-pages", note: "Admin CRUD with publishing, SEO, pagination, search, and audit logging." },
            { name: "FAQ Management", status: "ACTIVE", module: "admin/faq", route: "/api/v1/admin/faqs", note: "FAQ CRUD with category filters, ordering, publishing, and audit logging." },
            { name: "Blog Management", status: "ACTIVE", module: "admin/blog", route: "/api/v1/admin/blog-posts", note: "Blog CRUD with slugs, publish workflow, featured posts, and SEO fields." },
            { name: "Announcement/Notification Management", status: "ACTIVE", module: "admin/announcement", route: "/api/v1/admin/announcements", note: "Announcement CRUD for in-app, push, email, and SMS campaigns." },
        ],
    },
    {
        id: "marketing-promotions",
        title: "Marketing & Promotions",
        features: [
            { name: "Promotional Banners", status: "ACTIVE", module: "banner", route: "/api/v1/banners", note: "Banner module supports promotional placements." },
            { name: "Coupon Rules", status: "ACTIVE", module: "coupon", route: "/api/v1/coupons", note: "Coupon validation and rule fields exist." },
            { name: "Flash Sales", status: "ACTIVE", module: "admin/flashSale", route: "/api/v1/admin/flash-sales", note: "Sale campaign CRUD with product assignments, countdown window, and pricing rules." },
            { name: "Featured Products", status: "ACTIVE", module: "admin/products", route: "/api/v1/admin/products/:id/feature", note: "Dedicated feature/trending/new-arrival toggles for product merchandising." },
            { name: "Push Notifications", status: "ACTIVE", module: "admin/announcement", route: "/api/v1/admin/announcements", note: "Announcement campaigns can target push notification audiences." },
            { name: "Email Templates", status: "ACTIVE", module: "admin/systemConfig", route: "/api/v1/admin/system-config", note: "SMTP sender settings and write-only secrets are configurable." },
        ],
    },
    {
        id: "inventory-logistics",
        title: "Inventory & Logistics",
        features: [
            { name: "Inventory Management", status: "ACTIVE", module: "admin/inventory", route: "/api/v1/admin/inventory", note: "Admin inventory table and stock adjustments over product variants." },
            { name: "Stock Tracking", status: "ACTIVE", module: "admin/inventory", route: "/api/v1/admin/inventory", note: "Stock adjustments create inventory movement history." },
            { name: "Low Stock Alerts", status: "ACTIVE", module: "admin/inventory", route: "/api/v1/admin/inventory?status=low-stock", note: "Low-stock count and filtering are available in inventory APIs and dashboard KPIs." },
            { name: "Warehouse Management", status: "ACTIVE", module: "admin/warehouse", route: "/api/v1/admin/warehouses", note: "Dedicated warehouse CRUD with address, contact, service areas, and status." },
            { name: "Shipping Provider Configuration", status: "ACTIVE", module: "admin/shippingProvider", route: "/api/v1/admin/shipping-providers", note: "Provider CRUD with serviceability and masked credential configuration." },
        ],
    },
    {
        id: "reports-analytics",
        title: "Reports & Analytics",
        features: [
            { name: "Sales Reports", status: "ACTIVE", module: "admin/reports", route: "/api/v1/admin/reports", note: "Sales aggregation over orders with date filtering and export-ready rows." },
            { name: "Order Reports", status: "ACTIVE", module: "admin/reports", route: "/api/v1/admin/reports", note: "Status and timeline summaries over admin order data." },
            { name: "Revenue Analytics", status: "ACTIVE", module: "admin/reports", route: "/api/v1/admin/reports", note: "Revenue KPIs, daily trend, and date filters." },
            { name: "Customer Analytics", status: "ACTIVE", module: "admin/reports", route: "/api/v1/admin/reports", note: "Customer growth and top-customer summaries." },
            { name: "Product Performance Reports", status: "ACTIVE", module: "admin/reports", route: "/api/v1/admin/reports", note: "Product sales, quantity, and inventory performance summaries." },
        ],
    },
    {
        id: "system-settings",
        title: "System Settings",
        features: [
            { name: "Role & Permission Management", status: "ACTIVE", module: "rbac", route: "/api/v1/rbac", note: "RBAC roles, permissions, and assignment exist." },
            { name: "Admin User Management", status: "PARTIAL", module: "admin/user", route: "/api/v1/admin/people?role=ADMIN", note: "Admin users can be listed/invited; deeper admin profile controls can be added." },
            { name: "Activity Logs", status: "ACTIVE", module: "admin/activityLog", route: "/api/v1/admin/activity-logs", note: "Admin activity feed records operational actions." },
            { name: "Audit Logs", status: "ACTIVE", module: "admin/auditLog", route: "/api/v1/admin/audit-logs", note: "Sensitive admin mutations write audit log entries." },
            { name: "API Configuration", status: "ACTIVE", module: "admin/systemConfig", route: "/api/v1/admin/system-config", note: "Secure config store with masked write-only keys and webhook secrets." },
            { name: "Payment Gateway Settings", status: "ACTIVE", module: "admin/systemConfig", route: "/api/v1/admin/system-config", note: "Gateway provider, mode, keys, and webhook secret are configurable and masked." },
            { name: "SMTP/Email Settings", status: "ACTIVE", module: "admin/systemConfig", route: "/api/v1/admin/system-config", note: "SMTP host, sender, username, and write-only password settings." },
            { name: "Backup & Restore Settings", status: "ACTIVE", module: "admin/backup", route: "/api/v1/admin/backups", note: "JSON snapshot jobs with dry-run validation and explicit restore confirmation." },
        ],
    },
];

const submissionModels: Record<string, any> = {
    products: Product,
    coupons: Coupon,
    banners: Banner,
    sizeCharts: SizeChart,
    categoryRequests: SellerCategoryRequest,
};

const listOptions = (query: any = {}) => {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

const listSort = (query: any = {}, fallback = "createdAt") => ({
    [query.sortBy || fallback]: query.sortOrder === "asc" ? 1 : -1,
});

const dateFilter = (query: any = {}) => {
    const range: any = {};
    if (query.dateFrom) range.$gte = query.dateFrom;
    if (query.dateTo) range.$lte = query.dateTo;
    return Object.keys(range).length ? { createdAt: range } : {};
};

const paginatedFind = async (model: any, filter: any, query: any = {}, populate?: any) => {
    const { page, limit, skip } = listOptions(query);
    let findQuery = model.find(filter).sort(listSort(query)).skip(skip).limit(limit);

    if (populate) {
        const populateItems = Array.isArray(populate) ? populate : [populate];
        for (const item of populateItems) {
            findQuery = findQuery.populate(item);
        }
    }

    const [data, total] = await Promise.all([
        findQuery.lean(),
        model.countDocuments(filter),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
};

const buildTextFilter = (query: any, fields: string[]) => {
    if (!query.search) return {};
    const regex = new RegExp(query.search, "i");
    return { $or: fields.map((field) => ({ [field]: regex })) };
};

const uniqueSlugFor = async (model: any, source: string, providedSlug?: string, excludeId?: string) => {
    const base = slugify(providedSlug || source) || `item-${Date.now()}`;
    let slug = base;
    let suffix = 1;
    const filterFor = (value: string) => ({
        slug: value,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    while (await model.exists(filterFor(slug))) {
        suffix += 1;
        slug = `${base}-${suffix}`;
    }

    return slug;
};

const asObjectId = (value: any) => value instanceof Types.ObjectId ? value : new Types.ObjectId(String(value));

const plainDoc = (doc: any) => doc?.toObject ? doc.toObject() : doc;

const cleanPolicyRefs = (refs: any = {}) => {
    const next: Record<string, Types.ObjectId> = {};
    ["returnPolicy", "refundPolicy", "shippingPolicy", "termsPolicy"].forEach((key) => {
        if (refs?.[key]) next[key] = asObjectId(refs[key]);
    });
    return next;
};

const mask = (value: any) => (value ? "********" : value);

const isMasked = (value: unknown) => typeof value === "string" && /^(\*{4,}|masked)$/i.test(value.trim());

const mergeWriteOnlySecrets = (incoming: any = {}, existing: any = {}) => {
    const next = { ...incoming };

    if ("secretKey" in next && (!next.secretKey || isMasked(next.secretKey))) next.secretKey = existing.secretKey;
    if ("webhookSecret" in next && (!next.webhookSecret || isMasked(next.webhookSecret))) next.webhookSecret = existing.webhookSecret;
    if ("password" in next && (!next.password || isMasked(next.password))) next.password = existing.password;

    if (Array.isArray(next.keys)) {
        const existingKeys = Array.isArray(existing.keys) ? existing.keys : [];
        next.keys = next.keys.map((item: any, index: number) => ({
            ...item,
            key: item.key && !isMasked(item.key) ? item.key : existingKeys[index]?.key,
            secret: item.secret && !isMasked(item.secret) ? item.secret : existingKeys[index]?.secret,
        }));
    }

    if (Array.isArray(next.webhooks)) {
        const existingWebhooks = Array.isArray(existing.webhooks) ? existing.webhooks : [];
        next.webhooks = next.webhooks.map((item: any, index: number) => ({
            ...item,
            secret: item.secret && !isMasked(item.secret) ? item.secret : existingWebhooks[index]?.secret,
        }));
    }

    return next;
};

const maskSystemConfig = (config: any = {}) => ({
    ...config,
    api: {
        ...(config.api || {}),
        keys: (config.api?.keys || []).map((item: any) => ({
            ...item,
            key: mask(item.key),
            secret: mask(item.secret),
        })),
        webhooks: (config.api?.webhooks || []).map((item: any) => ({
            ...item,
            secret: mask(item.secret),
        })),
    },
    payment: {
        ...(config.payment || {}),
        secretKey: mask(config.payment?.secretKey),
        webhookSecret: mask(config.payment?.webhookSecret),
    },
    smtp: {
        ...(config.smtp || {}),
        password: mask(config.smtp?.password),
    },
});

const allowedBackupCollections: Record<string, any> = {
    cmsPages: CMSPage,
    faqs: FAQ,
    blogPosts: BlogPost,
    announcements: Announcement,
    flashSales: FlashSale,
    warehouses: Warehouse,
    shippingProviders: ShippingProvider,
    systemConfigs: AdminSystemConfig,
};

const defaultBackupCollections = Object.keys(allowedBackupCollections);

const notificationForSubmission = async (sellerId: any, type: string, status: string, itemId: string, reason?: string) => {
    if (!sellerId) return;
    await SellerNotification.create({
        sellerId,
        type: "APPROVAL",
        title: `${type} ${status.toLowerCase()}`,
        message: status === "APPROVED"
            ? `Your ${type} submission has been approved.`
            : `Your ${type} submission was rejected.${reason ? ` Reason: ${reason}` : ""}`,
        severity: status === "APPROVED" ? "SUCCESS" : "ERROR",
        resourceType: type,
        resourceId: itemId,
    });
};

const serializeSellerStore = (store?: any) => store ? {
    _id: store._id?.toString(),
    name: store.name,
    isActive: !!store.isActive,
    isSetupComplete: !!store.isSetupComplete,
    setupMissingFields: store.setupMissingFields || [],
    address: store.address,
    contact: store.contact || {},
    deliveryConfig: store.deliveryConfig || {},
    policies: undefined,
    policyRefs: store.policyRefs || {},
    categoryConfig: {
        primaryCategory: store.categoryConfig?.primaryCategory,
        subcategories: store.categoryConfig?.subcategories || [],
        assignedByAdmin: !!store.categoryConfig?.assignedByAdmin,
    },
} : null;

const serializeUser = (user: any, sellerProfile?: any, deliveryProfile?: any, sellerStore?: any) => ({
    _id: user._id?.toString(),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: roleNameOf(user.roleId),
    isVerified: !!user.isVerified,
    isBlocked: !!user.isBlocked,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    sellerProfile: sellerProfile ? {
        status: sellerProfile.status,
        isVerified: !!sellerProfile.isVerified,
        businessName: sellerProfile.businessName,
        sellerType: sellerProfile.sellerType,
        gstNumber: sellerProfile.gstNumber,
        mallId: sellerProfile.mallId?._id?.toString() || sellerProfile.mallId?.toString(),
        mallName: sellerProfile.mallId?.name,
        mallUnit: sellerProfile.mallUnit,
        mallFloor: sellerProfile.mallFloor,
        mallRequest: sellerProfile.mallRequest ? {
            mallId: sellerProfile.mallRequest.mallId?._id?.toString() || sellerProfile.mallRequest.mallId?.toString(),
            mallName: sellerProfile.mallRequest.mallId?.name,
            mallUnit: sellerProfile.mallRequest.mallUnit,
            mallFloor: sellerProfile.mallRequest.mallFloor,
            message: sellerProfile.mallRequest.message,
            status: sellerProfile.mallRequest.status,
            requestedAt: sellerProfile.mallRequest.requestedAt,
            reviewedAt: sellerProfile.mallRequest.reviewedAt,
            rejectionReason: sellerProfile.mallRequest.rejectionReason,
        } : null,
        payoutMethodsSummary: {
            total: sellerProfile.payoutMethods?.length || 0,
            verified: sellerProfile.payoutMethods?.filter((method: any) => method.status === "VERIFIED").length || 0,
            pending: sellerProfile.payoutMethods?.filter((method: any) => method.status === "PENDING_VERIFICATION").length || 0,
            rejected: sellerProfile.payoutMethods?.filter((method: any) => method.status === "REJECTED").length || 0,
        },
        wallet: sellerProfile.wallet || {
            availableBalance: 0,
            pendingPayoutBalance: 0,
            lifetimeEarnings: 0,
        },
        store: serializeSellerStore(sellerStore),
    } : null,
    deliveryProfile: deliveryProfile ? {
        status: deliveryProfile.status,
        isVerified: !!deliveryProfile.isVerified,
        isOnline: !!deliveryProfile.isOnline,
        vehicleType: deliveryProfile.vehicleType,
        vehicleNumber: deliveryProfile.vehicleNumber,
        licenseNumber: deliveryProfile.licenseNumber,
        wallet: deliveryProfile.wallet || {
            availableBalance: 0,
            pendingPayoutBalance: 0,
            lifetimeEarnings: 0,
        },
        currentLocation: deliveryProfile.currentLocation
            ? {
                longitude: deliveryProfile.currentLocation.coordinates?.[0],
                latitude: deliveryProfile.currentLocation.coordinates?.[1],
            }
            : null,
    } : null,
});

export class AdminService {
    static getManagementCatalog() {
        return managementCatalog.map((group) => {
            const active = group.features.filter((feature) => feature.status === "ACTIVE").length;
            const partial = group.features.filter((feature) => feature.status === "PARTIAL").length;
            const planned = group.features.filter((feature) => feature.status === "PLANNED").length;

            return {
                ...group,
                summary: {
                    total: group.features.length,
                    active,
                    partial,
                    planned,
                },
            };
        });
    }

    static async recordAdminMutation(
        adminId: string,
        action: string,
        resourceType: string,
        resourceId?: string,
        data: { before?: any; after?: any; metadata?: any; message?: string; severity?: "INFO" | "WARNING" | "ERROR" } = {},
    ) {
        await Promise.all([
            AuditLog.create({
                actorId: adminId ? asObjectId(adminId) : undefined,
                action,
                resourceType,
                resourceId,
                before: data.before,
                after: data.after,
                metadata: data.metadata || {},
            }),
            ActivityLog.create({
                actorId: adminId ? asObjectId(adminId) : undefined,
                action,
                resourceType,
                resourceId,
                message: data.message || `${action} ${resourceType}`,
                severity: data.severity || "INFO",
                metadata: data.metadata || {},
            }),
        ]);
    }

    static async listCMSPages(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["title", "content", "excerpt"]),
            ...dateFilter(query),
            ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
        };
        return await paginatedFind(CMSPage, filter, query);
    }

    static async createCMSPage(adminId: string, data: any) {
        const page = await CMSPage.create({
            ...data,
            slug: await uniqueSlugFor(CMSPage, data.title, data.slug),
            publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
            createdBy: asObjectId(adminId),
            updatedBy: asObjectId(adminId),
        });
        await this.recordAdminMutation(adminId, "CREATE", "CMSPage", page._id.toString(), { after: plainDoc(page) });
        return page;
    }

    static async updateCMSPage(adminId: string, pageId: string, data: any) {
        const page = await CMSPage.findById(pageId);
        if (!page) throw new ApiError(404, "CMS page not found");
        const before = plainDoc(page);

        Object.assign(page, data);
        if (data.title || data.slug) page.slug = await uniqueSlugFor(CMSPage, data.title || page.title, data.slug, pageId);
        if (data.status === "PUBLISHED" && !page.publishedAt) page.publishedAt = new Date();
        page.updatedBy = asObjectId(adminId);
        await page.save();

        await this.recordAdminMutation(adminId, "UPDATE", "CMSPage", page._id.toString(), { before, after: plainDoc(page) });
        return page;
    }

    static async deleteCMSPage(adminId: string, pageId: string) {
        const page = await CMSPage.findByIdAndDelete(pageId);
        if (!page) throw new ApiError(404, "CMS page not found");
        await this.recordAdminMutation(adminId, "DELETE", "CMSPage", page._id.toString(), { before: plainDoc(page), severity: "WARNING" });
        return page;
    }

    static async listFAQs(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["question", "answer", "category"]),
            ...dateFilter(query),
            ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
        };
        return await paginatedFind(FAQ, filter, query);
    }

    static async createFAQ(adminId: string, data: any) {
        const faq = await FAQ.create({
            ...data,
            createdBy: asObjectId(adminId),
            updatedBy: asObjectId(adminId),
        });
        await this.recordAdminMutation(adminId, "CREATE", "FAQ", faq._id.toString(), { after: plainDoc(faq) });
        return faq;
    }

    static async updateFAQ(adminId: string, faqId: string, data: any) {
        const faq = await FAQ.findById(faqId);
        if (!faq) throw new ApiError(404, "FAQ not found");
        const before = plainDoc(faq);
        Object.assign(faq, data, { updatedBy: asObjectId(adminId) });
        await faq.save();
        await this.recordAdminMutation(adminId, "UPDATE", "FAQ", faq._id.toString(), { before, after: plainDoc(faq) });
        return faq;
    }

    static async deleteFAQ(adminId: string, faqId: string) {
        const faq = await FAQ.findByIdAndDelete(faqId);
        if (!faq) throw new ApiError(404, "FAQ not found");
        await this.recordAdminMutation(adminId, "DELETE", "FAQ", faq._id.toString(), { before: plainDoc(faq), severity: "WARNING" });
        return faq;
    }

    static async listBlogPosts(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["title", "content", "excerpt", "tags"]),
            ...dateFilter(query),
            ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
        };
        return await paginatedFind(BlogPost, filter, query, { path: "authorId", select: "fullName email" });
    }

    static async createBlogPost(adminId: string, data: any) {
        const post = await BlogPost.create({
            ...data,
            slug: await uniqueSlugFor(BlogPost, data.title, data.slug),
            publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
            authorId: asObjectId(adminId),
            updatedBy: asObjectId(adminId),
        });
        await this.recordAdminMutation(adminId, "CREATE", "BlogPost", post._id.toString(), { after: plainDoc(post) });
        return post;
    }

    static async updateBlogPost(adminId: string, postId: string, data: any) {
        const post = await BlogPost.findById(postId);
        if (!post) throw new ApiError(404, "Blog post not found");
        const before = plainDoc(post);
        Object.assign(post, data);
        if (data.title || data.slug) post.slug = await uniqueSlugFor(BlogPost, data.title || post.title, data.slug, postId);
        if (data.status === "PUBLISHED" && !post.publishedAt) post.publishedAt = new Date();
        post.updatedBy = asObjectId(adminId);
        await post.save();
        await this.recordAdminMutation(adminId, "UPDATE", "BlogPost", post._id.toString(), { before, after: plainDoc(post) });
        return post;
    }

    static async deleteBlogPost(adminId: string, postId: string) {
        const post = await BlogPost.findByIdAndDelete(postId);
        if (!post) throw new ApiError(404, "Blog post not found");
        await this.recordAdminMutation(adminId, "DELETE", "BlogPost", post._id.toString(), { before: plainDoc(post), severity: "WARNING" });
        return post;
    }

    static async listAnnouncements(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["title", "message"]),
            ...dateFilter(query),
            ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
        };
        return await paginatedFind(Announcement, filter, query);
    }

    static async createAnnouncement(adminId: string, data: any) {
        const announcement = await Announcement.create({
            ...data,
            sentAt: data.status === "SENT" ? new Date() : undefined,
            createdBy: asObjectId(adminId),
            updatedBy: asObjectId(adminId),
        });
        await this.recordAdminMutation(adminId, "CREATE", "Announcement", announcement._id.toString(), { after: plainDoc(announcement) });
        return announcement;
    }

    static async updateAnnouncement(adminId: string, announcementId: string, data: any) {
        const announcement = await Announcement.findById(announcementId);
        if (!announcement) throw new ApiError(404, "Announcement not found");
        const before = plainDoc(announcement);
        Object.assign(announcement, data);
        if (data.status === "SENT" && !announcement.sentAt) announcement.sentAt = new Date();
        announcement.updatedBy = asObjectId(adminId);
        await announcement.save();
        await this.recordAdminMutation(adminId, "UPDATE", "Announcement", announcement._id.toString(), { before, after: plainDoc(announcement) });
        return announcement;
    }

    static async deleteAnnouncement(adminId: string, announcementId: string) {
        const announcement = await Announcement.findByIdAndDelete(announcementId);
        if (!announcement) throw new ApiError(404, "Announcement not found");
        await this.recordAdminMutation(adminId, "DELETE", "Announcement", announcement._id.toString(), { before: plainDoc(announcement), severity: "WARNING" });
        return announcement;
    }

    static async listFlashSales(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["name", "description"]),
            ...dateFilter(query),
            ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
        };
        return await paginatedFind(FlashSale, filter, query, { path: "productIds", select: "title price totalStock isActive" });
    }

    static async createFlashSale(adminId: string, data: any) {
        const sale = await FlashSale.create({
            ...data,
            slug: await uniqueSlugFor(FlashSale, data.name, data.slug),
            productIds: (data.productIds || []).map(asObjectId),
            createdBy: asObjectId(adminId),
            updatedBy: asObjectId(adminId),
        });
        await this.recordAdminMutation(adminId, "CREATE", "FlashSale", sale._id.toString(), { after: plainDoc(sale) });
        return sale;
    }

    static async updateFlashSale(adminId: string, saleId: string, data: any) {
        const sale = await FlashSale.findById(saleId);
        if (!sale) throw new ApiError(404, "Flash sale not found");
        const before = plainDoc(sale);
        Object.assign(sale, {
            ...data,
            productIds: data.productIds ? data.productIds.map(asObjectId) : sale.productIds,
        });
        if (data.name || data.slug) sale.slug = await uniqueSlugFor(FlashSale, data.name || sale.name, data.slug, saleId);
        sale.updatedBy = asObjectId(adminId);
        await sale.save();
        await this.recordAdminMutation(adminId, "UPDATE", "FlashSale", sale._id.toString(), { before, after: plainDoc(sale) });
        return sale;
    }

    static async deleteFlashSale(adminId: string, saleId: string) {
        const sale = await FlashSale.findByIdAndDelete(saleId);
        if (!sale) throw new ApiError(404, "Flash sale not found");
        await this.recordAdminMutation(adminId, "DELETE", "FlashSale", sale._id.toString(), { before: plainDoc(sale), severity: "WARNING" });
        return sale;
    }

    static async setProductFeature(adminId: string, productId: string, data: any) {
        const before = await Product.findById(productId).lean();
        if (!before) throw new ApiError(404, "Product not found");

        const product = await Product.findByIdAndUpdate(
            productId,
            { $set: data },
            { returnDocument: "after" },
        ).lean();

        await this.recordAdminMutation(adminId, "UPDATE_FEATURED_PRODUCT", "Product", productId, { before, after: product });
        return product;
    }

    static async listWarehouses(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["name", "code", "serviceAreas"]),
            ...dateFilter(query),
            ...(query.status === "active" ? { isActive: true } : {}),
            ...(query.status === "inactive" ? { isActive: false } : {}),
        };
        return await paginatedFind(Warehouse, filter, query);
    }

    static async listSellerSizeCharts(_sellerId: string) {
        return await SizeChart.find({
            isActive: true,
            $or: [
                { scope: "GLOBAL", approvalStatus: "APPROVED" },
                { scope: "GLOBAL", approvalStatus: { $exists: false } },
            ],
        })
            .sort({ name: 1, category: 1 })
            .lean();
    }

    static async createWarehouse(adminId: string, data: any) {
        const warehouse = await Warehouse.create({
            ...data,
            code: data.code.toUpperCase(),
            createdBy: asObjectId(adminId),
            updatedBy: asObjectId(adminId),
        });
        await this.recordAdminMutation(adminId, "CREATE", "Warehouse", warehouse._id.toString(), { after: plainDoc(warehouse) });
        return warehouse;
    }

    static async updateWarehouse(adminId: string, warehouseId: string, data: any) {
        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) throw new ApiError(404, "Warehouse not found");
        const before = plainDoc(warehouse);
        Object.assign(warehouse, { ...data, code: data.code ? data.code.toUpperCase() : warehouse.code, updatedBy: asObjectId(adminId) });
        await warehouse.save();
        await this.recordAdminMutation(adminId, "UPDATE", "Warehouse", warehouse._id.toString(), { before, after: plainDoc(warehouse) });
        return warehouse;
    }

    static async deleteWarehouse(adminId: string, warehouseId: string) {
        const warehouse = await Warehouse.findByIdAndUpdate(
            warehouseId,
            { $set: { isActive: false, updatedBy: asObjectId(adminId) } },
            { returnDocument: "after" },
        );
        if (!warehouse) throw new ApiError(404, "Warehouse not found");
        await this.recordAdminMutation(adminId, "DEACTIVATE", "Warehouse", warehouse._id.toString(), { after: plainDoc(warehouse), severity: "WARNING" });
        return warehouse;
    }

    static async listShippingProviders(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["name", "code", "serviceAreas"]),
            ...dateFilter(query),
            ...(query.status === "active" ? { isActive: true } : {}),
            ...(query.status === "inactive" ? { isActive: false } : {}),
        };
        return await paginatedFind(ShippingProvider, filter, query);
    }

    static async createShippingProvider(adminId: string, data: any) {
        const provider = await ShippingProvider.create({
            ...data,
            code: data.code.toUpperCase(),
            createdBy: asObjectId(adminId),
            updatedBy: asObjectId(adminId),
        });
        await this.recordAdminMutation(adminId, "CREATE", "ShippingProvider", provider._id.toString(), { after: plainDoc(provider) });
        return provider;
    }

    static async updateShippingProvider(adminId: string, providerId: string, data: any) {
        const provider = await ShippingProvider.findById(providerId);
        if (!provider) throw new ApiError(404, "Shipping provider not found");
        const before = plainDoc(provider);
        Object.assign(provider, { ...data, code: data.code ? data.code.toUpperCase() : provider.code, updatedBy: asObjectId(adminId) });
        await provider.save();
        await this.recordAdminMutation(adminId, "UPDATE", "ShippingProvider", provider._id.toString(), { before, after: plainDoc(provider) });
        return provider;
    }

    static async deleteShippingProvider(adminId: string, providerId: string) {
        const provider = await ShippingProvider.findByIdAndUpdate(
            providerId,
            { $set: { isActive: false, updatedBy: asObjectId(adminId) } },
            { returnDocument: "after" },
        );
        if (!provider) throw new ApiError(404, "Shipping provider not found");
        await this.recordAdminMutation(adminId, "DEACTIVATE", "ShippingProvider", provider._id.toString(), { after: plainDoc(provider), severity: "WARNING" });
        return provider;
    }

    static async listInventory(query: any = {}) {
        const filter: any = {
            isDeleted: { $ne: true },
            ...dateFilter(query),
        };

        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            filter.$or = [
                { title: searchRegex },
                { brand: searchRegex },
                { category: searchRegex },
                { "details.sku": searchRegex },
                { "variants.sku": searchRegex },
            ];
        }

        if (query.status === "low-stock") filter.totalStock = { $lte: 10 };
        if (query.status === "out-of-stock") filter.totalStock = 0;
        if (query.status === "active") filter.isActive = true;
        if (query.status === "inactive") filter.isActive = false;

        const result = await paginatedFind(
            Product,
            filter,
            query,
            [
                { path: "sellerId", select: "fullName email" },
                { path: "storeId", select: "name" },
            ],
        );

        const movements = await InventoryMovement.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("productId", "title")
            .populate("sellerId", "fullName email")
            .lean();

        return {
            ...result,
            lowStockCount: await Product.countDocuments({ totalStock: { $lte: 10 }, isDeleted: { $ne: true } }),
            outOfStockCount: await Product.countDocuments({ totalStock: 0, isDeleted: { $ne: true } }),
            movements,
        };
    }

    static async updateInventoryStock(adminId: string, data: any) {
        const product: any = await Product.findById(data.productId);
        if (!product) throw new ApiError(404, "Product not found");
        const variant = product.variants.find((item: any) => item.sku === data.sku);
        if (!variant) throw new ApiError(404, "Variant not found");

        const previousStock = variant.stock || 0;
        const newStock = data.stock;
        variant.stock = newStock;
        product.totalStock = product.variants.reduce((sum: number, item: any) => sum + (item.stock || 0), 0);
        product.markModified("variants");
        await product.save();

        const movement = await InventoryMovement.create({
            sellerId: product.sellerId,
            storeId: product.storeId,
            productId: product._id,
            sku: data.sku,
            variantLabel: [variant.size, variant.color].filter(Boolean).join(" / "),
            movementType: newStock > previousStock ? "IN" : newStock < previousStock ? "OUT" : "ADJUSTMENT",
            quantity: newStock - previousStock,
            previousStock,
            newStock,
            reason: data.reason || "Admin stock adjustment",
            referenceType: "ADMIN",
            referenceId: adminId,
            createdBy: asObjectId(adminId),
        });

        await this.recordAdminMutation(adminId, "UPDATE_STOCK", "Product", product._id.toString(), {
            metadata: { sku: data.sku, previousStock, newStock },
            after: plainDoc(product),
        });

        return { product, movement };
    }

    static async getReports(query: any = {}) {
        const orderMatch: any = {};
        if (query.dateFrom || query.dateTo) Object.assign(orderMatch, dateFilter(query));

        const revenueStatuses = ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
        const [
            revenueSummary,
            ordersByStatus,
            dailyRevenue,
            productPerformance,
            customerSummary,
            inventorySummary,
        ] = await Promise.all([
            Order.aggregate([
                { $match: { ...orderMatch, status: { $in: revenueStatuses } } },
                {
                    $group: {
                        _id: null,
                        orderCount: { $sum: 1 },
                        revenue: { $sum: "$payableAmount" },
                        sales: { $sum: "$totalAmount" },
                        tax: { $sum: "$totalTax" },
                        shipping: { $sum: "$shippingFee" },
                        discounts: { $sum: "$discountAmount" },
                    },
                },
            ]),
            Order.aggregate([
                { $match: orderMatch },
                { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$payableAmount" } } },
                { $sort: { count: -1 } },
            ]),
            Order.aggregate([
                { $match: { ...orderMatch, status: { $in: revenueStatuses } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        revenue: { $sum: "$payableAmount" },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
                { $limit: 60 },
            ]),
            Order.aggregate([
                { $match: { ...orderMatch, status: { $in: revenueStatuses } } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        title: { $first: "$items.title" },
                        sku: { $first: "$items.sku" },
                        quantity: { $sum: "$items.quantity" },
                        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 },
            ]),
            Order.aggregate([
                { $match: orderMatch },
                {
                    $group: {
                        _id: "$userId",
                        orders: { $sum: 1 },
                        revenue: { $sum: "$payableAmount" },
                        lastOrderAt: { $max: "$createdAt" },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "customer",
                    },
                },
                { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        orders: 1,
                        revenue: 1,
                        lastOrderAt: 1,
                        fullName: "$customer.fullName",
                        email: "$customer.email",
                        phone: "$customer.phone",
                    },
                },
            ]),
            Product.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        activeProducts: { $sum: { $cond: ["$isActive", 1, 0] } },
                        totalStock: { $sum: "$totalStock" },
                        lowStockProducts: { $sum: { $cond: [{ $lte: ["$totalStock", 10] }, 1, 0] } },
                        outOfStockProducts: { $sum: { $cond: [{ $eq: ["$totalStock", 0] }, 1, 0] } },
                    },
                },
            ]),
        ]);

        const totalCustomers = await User.countDocuments();
        const newCustomers = await User.countDocuments(dateFilter(query));

        return {
            summary: {
                revenue: revenueSummary[0]?.revenue || 0,
                sales: revenueSummary[0]?.sales || 0,
                orderCount: revenueSummary[0]?.orderCount || 0,
                tax: revenueSummary[0]?.tax || 0,
                shipping: revenueSummary[0]?.shipping || 0,
                discounts: revenueSummary[0]?.discounts || 0,
                totalCustomers,
                newCustomers,
                ...(inventorySummary[0] || {
                    totalProducts: 0,
                    activeProducts: 0,
                    totalStock: 0,
                    lowStockProducts: 0,
                    outOfStockProducts: 0,
                }),
            },
            ordersByStatus,
            dailyRevenue,
            productPerformance,
            customerSummary,
        };
    }

    static async listActivityLogs(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["action", "resourceType", "message"]),
            ...dateFilter(query),
            ...(query.status && query.status !== "ALL" ? { severity: query.status } : {}),
        };
        return await paginatedFind(ActivityLog, filter, query, { path: "actorId", select: "fullName email" });
    }

    static async listAuditLogs(query: any = {}) {
        const filter = {
            ...buildTextFilter(query, ["action", "resourceType", "resourceId"]),
            ...dateFilter(query),
            ...(query.status && query.status !== "ALL" ? { resourceType: query.status } : {}),
        };
        return await paginatedFind(AuditLog, filter, query, { path: "actorId", select: "fullName email" });
    }

    static async getSystemConfig() {
        const config = await AdminSystemConfig.findOne().sort({ createdAt: -1 }).lean();
        return maskSystemConfig(config || {});
    }

    static async updateSystemConfig(adminId: string, data: any) {
        const existing = await AdminSystemConfig.findOne().sort({ createdAt: -1 });
        const existingConfig = plainDoc(existing) || {};
        const next = {
            api: data.api ? mergeWriteOnlySecrets(data.api, existingConfig.api) : existingConfig.api,
            payment: data.payment ? mergeWriteOnlySecrets(data.payment, existingConfig.payment) : existingConfig.payment,
            smtp: data.smtp ? mergeWriteOnlySecrets(data.smtp, existingConfig.smtp) : existingConfig.smtp,
            backup: data.backup ?? existingConfig.backup,
            updatedBy: asObjectId(adminId),
        };

        const config = existing
            ? await AdminSystemConfig.findByIdAndUpdate(existing._id, { $set: next }, { returnDocument: "after" })
            : await AdminSystemConfig.create(next);

        await this.recordAdminMutation(adminId, "UPDATE", "AdminSystemConfig", config?._id?.toString(), {
            metadata: { updatedKeys: Object.keys(data) },
        });

        return maskSystemConfig(plainDoc(config));
    }

    static async listBackups(query: any = {}) {
        return await paginatedFind(BackupJob, { ...dateFilter(query), ...(query.status ? { status: query.status } : {}) }, query, { path: "createdBy restoredBy", select: "fullName email" });
    }

    static async createBackup(adminId: string, data: any = {}) {
        const collections = (data.collections?.length ? data.collections : defaultBackupCollections)
            .filter((item: string) => Boolean(allowedBackupCollections[item]));

        if (!collections.length) throw new ApiError(400, "No valid backup collections selected");

        const job = await BackupJob.create({
            name: data.name || `Admin backup ${new Date().toISOString()}`,
            status: "PENDING",
            collections,
            createdBy: asObjectId(adminId),
        });

        try {
            const snapshot: Record<string, any[]> = {};
            for (const collection of collections) {
                snapshot[collection] = await allowedBackupCollections[collection].find().lean();
            }

            job.snapshot = snapshot;
            job.status = "COMPLETED";
            await job.save();
            await this.recordAdminMutation(adminId, "CREATE_BACKUP", "BackupJob", job._id.toString(), {
                metadata: { collections },
            });
            return job;
        } catch (error: any) {
            job.status = "FAILED";
            job.error = error?.message || "Backup failed";
            await job.save();
            throw error;
        }
    }

    static async dryRunRestore(backupId: string) {
        const job = await BackupJob.findById(backupId).lean();
        if (!job) throw new ApiError(404, "Backup job not found");
        if (job.status !== "COMPLETED" && job.status !== "RESTORED") throw new ApiError(400, "Backup is not restorable");

        const result = Object.fromEntries(
            (job.collections || []).map((collection: string) => [
                collection,
                {
                    incoming: Array.isArray(job.snapshot?.[collection]) ? job.snapshot[collection].length : 0,
                    restorable: Boolean(allowedBackupCollections[collection]),
                },
            ]),
        );

        await BackupJob.findByIdAndUpdate(backupId, { $set: { dryRunResult: result } });
        return { backupId, result };
    }

    static async restoreBackup(adminId: string, backupId: string) {
        const job: any = await BackupJob.findById(backupId);
        if (!job) throw new ApiError(404, "Backup job not found");
        if (job.status !== "COMPLETED" && job.status !== "RESTORED") throw new ApiError(400, "Backup is not restorable");

        const restoreResult: Record<string, number> = {};
        for (const collection of job.collections || []) {
            const model = allowedBackupCollections[collection];
            const snapshot = job.snapshot?.[collection];
            if (!model || !Array.isArray(snapshot)) continue;
            await model.deleteMany({});
            if (snapshot.length) await model.insertMany(snapshot, { ordered: false });
            restoreResult[collection] = snapshot.length;
        }

        job.status = "RESTORED";
        job.restoredBy = asObjectId(adminId);
        job.restoredAt = new Date();
        job.dryRunResult = restoreResult;
        await job.save();

        await this.recordAdminMutation(adminId, "RESTORE_BACKUP", "BackupJob", job._id.toString(), {
            metadata: { restoreResult },
            severity: "WARNING",
        });

        return { backup: job, restoreResult };
    }

    static async getDashboard() {
        const [
            totalUsers,
            blockedUsers,
            verifiedUsers,
            sellers,
            deliveryBoys,
            pendingSellers,
            pendingDelivery,
            pendingPayouts,
            payoutAgg,
            malls,
            activeMalls,
            mallLinkedSellers,
            pendingMallRequests,
            pendingMallCreations,
            pendingPayoutMethods,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            revenueAgg,
            totalProducts,
            lowStockProducts,
            pendingSellerProducts,
            pendingSellerCoupons,
            pendingSellerBanners,
            pendingSellerSizeCharts,
            pendingSellerCategoryRequests,
            activeFlashSales,
            sentAnnouncements,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isBlocked: true }),
            User.countDocuments({ isVerified: true }),
            Seller.countDocuments(),
            DeliveryBoy.countDocuments(),
            Seller.countDocuments({ status: "PENDING" }),
            DeliveryBoy.countDocuments({ status: "PENDING" }),
            AdminPayout.countDocuments({ status: { $in: ["PENDING", "PROCESSING"] } }),
            AdminPayout.aggregate([
                { $match: { status: "PAID" } },
                { $group: { _id: null, totalPaid: { $sum: "$amount" } } },
            ]),
            Mall.countDocuments(),
            Mall.countDocuments({ isActive: true }),
            Seller.countDocuments({ mallId: { $exists: true, $ne: null } }),
            Seller.countDocuments({ "mallRequest.status": "PENDING" }),
            Mall.countDocuments({ status: "PENDING" }),
            Seller.countDocuments({ "payoutMethods.status": "PENDING_VERIFICATION" }),
            Order.countDocuments(),
            Order.countDocuments({ status: { $in: ["PENDING_PAYMENT", "PAID", "CONFIRMED", "PROCESSING"] } }),
            Order.countDocuments({ status: "DELIVERED" }),
            Order.aggregate([
                { $match: { status: { $in: ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } } },
                { $group: { _id: null, revenue: { $sum: "$payableAmount" }, sales: { $sum: "$totalAmount" } } },
            ]),
            Product.countDocuments({ isDeleted: { $ne: true } }),
            Product.countDocuments({ totalStock: { $lte: 10 }, isDeleted: { $ne: true } }),
            Product.countDocuments({ scope: "SELLER", approvalStatus: "PENDING_REVIEW" }),
            Coupon.countDocuments({ scope: "SELLER", approvalStatus: "PENDING_REVIEW" }),
            Banner.countDocuments({ scope: "SELLER", approvalStatus: "PENDING_REVIEW" }),
            SizeChart.countDocuments({ scope: "SELLER", approvalStatus: "PENDING_REVIEW" }),
            SellerCategoryRequest.countDocuments({ status: "PENDING" }),
            FlashSale.countDocuments({
                isActive: true,
                status: { $in: ["ACTIVE", "SCHEDULED"] },
                endsAt: { $gte: new Date() },
            }),
            Announcement.countDocuments({ status: "SENT" }),
        ]);

        const recentPayouts = await AdminPayout.find()
            .populate("partnerId", "fullName email")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        const topMalls = await MallService.getTopMalls(10);

        return {
            stats: {
                totalUsers,
                blockedUsers,
                verifiedUsers,
                sellers,
                deliveryBoys,
                pendingPartners: pendingSellers + pendingDelivery,
                pendingPayouts,
                totalPaid: payoutAgg[0]?.totalPaid || 0,
                malls,
                activeMalls,
                mallLinkedSellers,
                pendingMallRequests,
                pendingMallCreations,
                pendingPayoutMethods,
                totalOrders,
                pendingOrders,
                deliveredOrders,
                revenue: revenueAgg[0]?.revenue || 0,
                totalSales: revenueAgg[0]?.sales || 0,
                totalProducts,
                lowStockProducts,
                pendingReviews:
                    pendingSellerProducts +
                    pendingSellerCoupons +
                    pendingSellerBanners +
                    pendingSellerSizeCharts +
                    pendingSellerCategoryRequests,
                activeFlashSales,
                sentAnnouncements,
            },
            recentPayouts,
            topMalls,
        };
    }

    static async listPeople(query: any) {
        const filter: any = {};

        if (query.search) {
            const searchRegex = new RegExp(query.search, "i");
            filter.$or = [
                { fullName: searchRegex },
                { email: searchRegex },
                { username: searchRegex },
                { phone: searchRegex },
            ];
        }

        if (query.status === "active") filter.isBlocked = { $ne: true };
        if (query.status === "blocked") filter.isBlocked = true;
        if (query.status === "verified") filter.isVerified = true;
        if (query.status === "unverified") filter.isVerified = { $ne: true };

        if (query.role) {
            const role = await Role.findOne({ name: query.role }).lean();
            if (!role) return [];
            filter.roleId = role._id;
        }

        const users = await User.find(filter)
            .select(userProjection)
            .populate("roleId")
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        const userIds = users.map((user: any) => user._id);
        const [sellerProfiles, deliveryProfiles, sellerStores] = await Promise.all([
            Seller.find({ userId: { $in: userIds } })
                .populate("mallId", "name slug address.city isActive")
                .populate("mallRequest.mallId", "name slug address.city isActive")
                .lean(),
            DeliveryBoy.find({ userId: { $in: userIds } }).lean(),
            Store.find({ sellerId: { $in: userIds } })
                .select("sellerId name description logoUrl bannerUrl isActive isVerified isSetupComplete setupMissingFields address contact categoryConfig deliveryConfig policyRefs createdAt")
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        const sellersByUser = new Map(sellerProfiles.map((profile: any) => [profile.userId.toString(), profile]));
        const deliveryByUser = new Map(deliveryProfiles.map((profile: any) => [profile.userId.toString(), profile]));
        const storesBySeller = new Map();
        sellerStores.forEach((store: any) => {
            const sellerId = store.sellerId?.toString();
            if (sellerId && !storesBySeller.has(sellerId)) storesBySeller.set(sellerId, store);
        });

        return users.map((user: any) =>
            serializeUser(
                user,
                sellersByUser.get(user._id.toString()),
                deliveryByUser.get(user._id.toString()),
                storesBySeller.get(user._id.toString()),
            ),
        );
    }

    static async listPolicies(query: any = {}) {
        const filter: any = {};
        if (query.type) filter.policyType = query.type;
        if (query.status === "active") filter.isActive = true;
        if (query.status === "inactive") filter.isActive = false;
        if (query.search) {
            const searchRegex = new RegExp(String(query.search), "i");
            filter.$or = [{ name: searchRegex }, { category: searchRegex }, { description: searchRegex }];
        }
        return await paginatedFind(RefundPolicy, filter, query);
    }

    static async createPolicy(adminId: string, data: any) {
        const policy = await RefundPolicy.create({
            ...data,
            category: data.category || data.policyType,
            isActive: data.isActive ?? true,
        });
        await this.recordAdminMutation(adminId, "CREATE", "Policy", policy._id.toString(), { after: plainDoc(policy) });
        return policy;
    }

    static async updatePolicy(adminId: string, policyId: string, data: any) {
        const before = await RefundPolicy.findById(policyId).lean();
        const policy = await RefundPolicy.findByIdAndUpdate(policyId, data, { returnDocument: "after" });
        if (!policy) throw new ApiError(404, "Policy not found");
        await this.recordAdminMutation(adminId, "UPDATE", "Policy", policy._id.toString(), { before, after: plainDoc(policy) });
        return policy;
    }

    static async deletePolicy(adminId: string, policyId: string) {
        const before = await RefundPolicy.findById(policyId).lean();
        const policy = await RefundPolicy.findByIdAndUpdate(policyId, { isActive: false }, { returnDocument: "after" });
        if (!policy) throw new ApiError(404, "Policy not found");
        await this.recordAdminMutation(adminId, "DEACTIVATE", "Policy", policy._id.toString(), { before, after: plainDoc(policy), severity: "WARNING" });
        return policy;
    }

    static async listSellers(query: any = {}) {
        return await this.listPeople({ ...query, role: RoleEnum.SELLER });
    }

    static async getSeller(userId: string) {
        const user = await User.findById(userId).select(userProjection).populate("roleId").lean();
        if (!user) throw new ApiError(404, "Seller user not found");
        const [seller, store] = await Promise.all([
            Seller.findOne({ userId }).populate("mallId", "name slug address.city isActive").populate("mallRequest.mallId", "name slug address.city isActive").lean(),
            Store.findOne({ sellerId: userId }).lean(),
        ]);
        if (!seller) throw new ApiError(404, "Seller profile not found");
        return serializeUser(user, seller, undefined, store);
    }

    static async createSeller(adminId: string, data: any) {
        const sellerRole = await rbacService.getRoleByName(RoleEnum.SELLER);
        const username = (data.username || data.email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "_");
        let user = await User.findOne({ email: data.email.toLowerCase() });

        if (user) {
            user.fullName = data.fullName;
            user.username = data.username || user.username;
            user.phone = data.phone ?? user.phone;
            user.isVerified = data.isVerified ?? true;
            user.isBlocked = data.isBlocked ?? false;
            user.roleId = sellerRole._id;
            if (data.password) user.password = data.password;
            await user.save();
        } else {
            user = await User.create({
                fullName: data.fullName,
                email: data.email.toLowerCase(),
                username,
                phone: data.phone,
                password: data.password || Math.random().toString(36).slice(2, 12),
                roleId: sellerRole._id,
                isVerified: data.isVerified ?? true,
                isBlocked: data.isBlocked ?? false,
            });
        }
        await rbacService.assignUserToRole(user._id.toString(), sellerRole._id.toString());

        const sellerPayload = data.seller || {};
        const seller = await Seller.findOneAndUpdate(
            { userId: user._id },
            {
                $set: {
                    businessName: sellerPayload.businessName || data.store?.name || data.fullName,
                    sellerType: sellerPayload.sellerType || "CLOTHING",
                    gstNumber: sellerPayload.gstNumber,
                    status: sellerPayload.status || "APPROVED",
                    isVerified: sellerPayload.isVerified ?? true,
                    mallId: sellerPayload.mallId ? asObjectId(sellerPayload.mallId) : undefined,
                    mallUnit: sellerPayload.mallUnit,
                    mallFloor: sellerPayload.mallFloor,
                    address: sellerPayload.address,
                },
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );

        let store = null;
        if (data.store?.name) {
            const mergedStore = mergeStoreForSetup(null, {
                ...data.store,
                type: "CLOTHING",
                sellerId: user._id,
                isActive: data.store.isActive ?? true,
                isVerified: data.store.isVerified ?? true,
                categoryConfig: {
                    ...(data.store.categoryConfig || {}),
                    assignedByAdmin: true,
                },
                policyRefs: cleanPolicyRefs(data.store.policyRefs),
            });
            const setup = buildStoreSetupStatus(mergedStore);
            store = await Store.findOneAndUpdate(
                { sellerId: user._id },
                {
                    $set: {
                        ...mergedStore,
                        isSetupComplete: setup.isComplete,
                        setupMissingFields: setup.missingFields,
                        setupCompletedAt: setup.isComplete ? new Date() : undefined,
                    },
                },
                { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
            );
        }

        await this.recordAdminMutation(adminId, "CREATE_SELLER", "Seller", seller._id.toString(), {
            after: { user: plainDoc(user), seller: plainDoc(seller), store: plainDoc(store) },
        });
        return await this.getSeller(user._id.toString());
    }

    static async updateSeller(adminId: string, userId: string, data: any) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "Seller user not found");
        const before = await this.getSeller(userId).catch(() => null);

        if (data.fullName !== undefined) user.fullName = data.fullName;
        if (data.email !== undefined) user.email = data.email.toLowerCase();
        if (data.username !== undefined) user.username = data.username;
        if (data.phone !== undefined) user.phone = data.phone;
        if (data.isVerified !== undefined) user.isVerified = data.isVerified;
        if (data.isBlocked !== undefined) user.isBlocked = data.isBlocked;
        if (data.password) user.password = data.password;
        await user.save();

        if (data.seller) {
            const sellerPayload = { ...data.seller };
            if (sellerPayload.mallId) sellerPayload.mallId = asObjectId(sellerPayload.mallId);
            if (sellerPayload.mallId === "") sellerPayload.mallId = undefined;
            await Seller.findOneAndUpdate({ userId }, { $set: sellerPayload }, { upsert: true, returnDocument: "after" });
        }

        if (data.store) {
            const existingStore = await Store.findOne({ sellerId: userId });
            const mergedStore = mergeStoreForSetup(existingStore, {
                ...data.store,
                ...(data.store.policyRefs ? { policyRefs: cleanPolicyRefs(data.store.policyRefs) } : {}),
                categoryConfig: data.store.categoryConfig
                    ? { ...data.store.categoryConfig, assignedByAdmin: true }
                    : undefined,
            });
            const setup = buildStoreSetupStatus(mergedStore);
            await Store.findOneAndUpdate(
                { sellerId: userId },
                {
                    $set: {
                        ...mergedStore,
                        sellerId: asObjectId(userId),
                        type: mergedStore.type || "CLOTHING",
                        isSetupComplete: setup.isComplete,
                        setupMissingFields: setup.missingFields,
                        setupCompletedAt: setup.isComplete ? new Date() : undefined,
                    },
                },
                { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
            );
        }

        const after = await this.getSeller(userId);
        await this.recordAdminMutation(adminId, "UPDATE_SELLER", "Seller", userId, { before, after });
        return after;
    }

    static async deleteSeller(adminId: string, userId: string) {
        const before = await this.getSeller(userId);
        await Promise.all([
            User.findByIdAndUpdate(userId, { isBlocked: true }),
            Seller.findOneAndUpdate({ userId }, { isVerified: false, status: "REJECTED" }),
            Store.updateMany({ sellerId: userId }, { isActive: false, isOpen: false, isVerified: false }),
            Product.updateMany({ sellerId: userId }, { isActive: false }),
        ]);
        const after = await this.getSeller(userId);
        await this.recordAdminMutation(adminId, "SOFT_DELETE_SELLER", "Seller", userId, { before, after, severity: "WARNING" });
        return after;
    }

    static async setUserBlocked(userId: string, isBlocked: boolean, adminId?: string) {
        const before = await User.findById(userId).select(userProjection).lean();
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { isBlocked } },
            { returnDocument: "after" },
        ).select(userProjection).populate("roleId");

        if (!user) throw new ApiError(404, "User not found");
        if (adminId) {
            await this.recordAdminMutation(adminId, isBlocked ? "BLOCK_USER" : "UNBLOCK_USER", "User", userId, {
                before,
                after: plainDoc(user),
                severity: isBlocked ? "WARNING" : "INFO",
            });
        }
        return serializeUser(user);
    }

    static async updatePartnerStatus(userId: string, data: any, adminId?: string) {
        const model: any = data.type === "SELLER" ? Seller : DeliveryBoy;
        const before = await model.findOne({ userId }).lean();
        const profile = await model.findOneAndUpdate(
            { userId },
            {
                $set: {
                    status: data.status,
                    isVerified: data.isVerified ?? data.status === "APPROVED",
                },
            },
            { returnDocument: "after" },
        );

        if (!profile) throw new ApiError(404, `${data.type.toLowerCase()} profile not found`);

        if (data.status === "APPROVED") {
            const roleName = data.type === "SELLER" ? RoleEnum.SELLER : RoleEnum.DELIVERY;
            const role = await rbacService.getRoleByName(roleName);
            await rbacService.assignUserToRole(userId, role._id.toString());
        }

        if (adminId) {
            await this.recordAdminMutation(adminId, "UPDATE_PARTNER_STATUS", data.type, profile._id.toString(), {
                before,
                after: plainDoc(profile),
                metadata: { userId, status: data.status },
            });
        }

        return profile;
    }

    static async sendInvite(adminId: string, data: any) {
        const inviteUrl = data.role === RoleEnum.DELIVERY
            ? `${ENV.CORS_ORIGIN}/delivery/login`
            : data.role === RoleEnum.SELLER
                ? `${ENV.CORS_ORIGIN}/seller/login`
                : `${ENV.CORS_ORIGIN}/auth`;
        const sent = await MailService.sendAdminInvite(data.email, data.role, inviteUrl, data.fullName, data.message);

        if (!sent) throw new ApiError(500, "Failed to send invite email");

        await this.recordAdminMutation(adminId, "SEND_INVITE", "Invite", data.email, {
            metadata: { email: data.email, role: data.role },
        });

        return {
            invitedBy: adminId,
            email: data.email,
            role: data.role,
            inviteUrl,
            sentAt: new Date(),
        };
    }

    static async createPayout(adminId: string, data: any) {
        const partner = await User.findById(data.partnerId).select(userProjection).populate("roleId");
        if (!partner) throw new ApiError(404, "Payout partner not found");

        const payout = await AdminPayout.create({
            partnerId: new Types.ObjectId(data.partnerId),
            partnerType: data.partnerType,
            amount: data.amount,
            method: data.method,
            referenceId: data.referenceId,
            note: data.note,
            status: data.status || "PENDING",
            requestedBy: new Types.ObjectId(adminId),
            processedAt: data.status === "PAID" ? new Date() : undefined,
        });

        if (data.partnerType === "DELIVERY") {
            const rider = await DeliveryBoy.findOne({ userId: data.partnerId });
            if (rider?.wallet) {
                if (["PENDING", "PROCESSING"].includes(payout.status)) {
                    rider.wallet.availableBalance = Math.max(0, (rider.wallet.availableBalance || 0) - payout.amount);
                    rider.wallet.pendingPayoutBalance = (rider.wallet.pendingPayoutBalance || 0) + payout.amount;
                } else if (payout.status === "PAID") {
                    rider.wallet.availableBalance = Math.max(0, (rider.wallet.availableBalance || 0) - payout.amount);
                }
                await rider.save();
            }
        }

        await MailService.sendPayoutNotice(partner.email, data.amount, payout.status, data.referenceId);
        await this.recordAdminMutation(adminId, "CREATE_PAYOUT", "AdminPayout", payout._id.toString(), {
            after: plainDoc(payout),
            metadata: { partnerType: data.partnerType, amount: data.amount, status: payout.status },
        });

        return await payout.populate("partnerId", "fullName email");
    }

    static async listPayouts() {
        return await AdminPayout.find()
            .populate("partnerId", "fullName email")
            .populate("requestedBy", "fullName email")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
    }

    static async listMalls() {
        const malls = await Mall.find().sort({ createdAt: -1 }).lean();
        const sellerCounts = await Seller.aggregate([
            { $match: { mallId: { $exists: true, $ne: null } } },
            { $group: { _id: "$mallId", sellers: { $sum: 1 } } },
        ]);
        const countsByMall = new Map(sellerCounts.map((item: any) => [item._id.toString(), item.sellers]));

        return malls.map((mall: any) => ({
            ...mall,
            _id: mall._id.toString(),
            sellerCount: countsByMall.get(mall._id.toString()) || 0,
        }));
    }

    static async listMallRequests() {
        const sellers = await Seller.find({ "mallRequest.status": "PENDING" })
            .populate("userId", "fullName email phone")
            .populate("mallRequest.mallId", "name slug address.city isActive")
            .sort({ "mallRequest.requestedAt": -1 })
            .lean();

        return sellers.map((seller: any) => ({
            _id: seller._id.toString(),
            sellerId: seller.userId?._id?.toString() || seller.userId?.toString(),
            fullName: seller.userId?.fullName,
            email: seller.userId?.email,
            phone: seller.userId?.phone,
            businessName: seller.businessName,
            status: seller.status,
            currentMallId: seller.mallId?.toString(),
            request: {
                mallId: seller.mallRequest.mallId?._id?.toString() || seller.mallRequest.mallId?.toString(),
                mallName: seller.mallRequest.mallId?.name,
                mallUnit: seller.mallRequest.mallUnit,
                mallFloor: seller.mallRequest.mallFloor,
                message: seller.mallRequest.message,
                status: seller.mallRequest.status,
                requestedAt: seller.mallRequest.requestedAt,
            },
        }));
    }

    static async createMall(data: any, adminId?: string) {
        const baseSlug = slugify(data.name);
        let slug = baseSlug;
        let suffix = 1;

        while (await Mall.exists({ slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        const mall = await Mall.create({
            ...data,
            slug,
            totalStores: data.totalStores || 0,
            status: data.status || "APPROVED",
            isActive: data.isActive ?? true,
        });

        if (adminId) {
            await this.recordAdminMutation(adminId, "CREATE", "Mall", mall._id.toString(), { after: plainDoc(mall) });
        }

        return mall;
    }

    static async updateMall(mallId: string, data: any, adminId?: string) {
        const before = await Mall.findById(mallId).lean();
        const update: any = { $set: data };
        if (data.isFeatured === false) {
            delete update.$set.featuredRank;
            update.$unset = { featuredRank: 1 };
        }

        const mall = await Mall.findByIdAndUpdate(mallId, update, { returnDocument: "after" });
        if (!mall) throw new ApiError(404, "Mall not found");
        if (adminId) {
            await this.recordAdminMutation(adminId, "UPDATE", "Mall", mallId, { before, after: plainDoc(mall) });
        }
        return mall;
    }

    static async deleteMall(mallId: string, adminId?: string) {
        const mall = await Mall.findByIdAndUpdate(mallId, { $set: { isActive: false } }, { returnDocument: "after" });
        if (!mall) throw new ApiError(404, "Mall not found");
        if (adminId) {
            await this.recordAdminMutation(adminId, "DEACTIVATE", "Mall", mallId, { after: plainDoc(mall), severity: "WARNING" });
        }
        return mall;
    }

    static async assignSellerToMall(userId: string, data: any, adminId?: string) {
        if (data.mallId) {
            const mall = await Mall.findOne({
                _id: data.mallId,
                isActive: true,
                $or: [{ status: "APPROVED" }, { status: { $exists: false } }],
            }).lean();
            if (!mall) throw new ApiError(404, "Mall not found");
        }

        const set: any = {};
        const unset: any = {};

        if (data.mallId === null) {
            unset.mallId = 1;
            unset.mallUnit = 1;
            unset.mallFloor = 1;
            unset.mallRequest = 1;
        } else if (data.mallId) {
            set.mallId = new Types.ObjectId(data.mallId);
            unset.mallRequest = 1;
        }

        if (data.mallId !== null) {
            if (data.mallUnit !== undefined) set.mallUnit = data.mallUnit;
            if (data.mallFloor !== undefined) set.mallFloor = data.mallFloor;
        }

        const update: any = {};
        if (Object.keys(set).length) update.$set = set;
        if (Object.keys(unset).length) update.$unset = unset;

        const before = await Seller.findOne({ userId }).lean();
        const seller = await Seller.findOneAndUpdate(
            { userId },
            update,
            { returnDocument: "after" },
        ).populate("mallId", "name slug address.city isActive");

        if (!seller) throw new ApiError(404, "Seller profile not found");
        if (adminId) {
            await this.recordAdminMutation(adminId, "ASSIGN_SELLER_MALL", "Seller", seller._id.toString(), {
                before,
                after: plainDoc(seller),
                metadata: { userId, mallId: data.mallId },
            });
        }
        return seller;
    }

    static async reviewMallRequest(userId: string, adminId: string, data: any) {
        const seller = await Seller.findOne({ userId }).populate("mallRequest.mallId", "name slug address.city isActive");
        if (!seller) throw new ApiError(404, "Seller profile not found");
        if (seller.mallRequest?.status !== "PENDING") {
            throw new ApiError(400, "No pending mall request found for this seller");
        }
        const before = plainDoc(seller);

        if (data.status === "APPROVED") {
            const requestedMallId = seller.mallRequest.mallId?._id || seller.mallRequest.mallId;
            const mall = await Mall.findOne({ _id: requestedMallId, isActive: true }).lean();
            if (!mall) throw new ApiError(404, "Requested active mall not found");

            seller.mallId = requestedMallId;
            seller.mallUnit = seller.mallRequest.mallUnit;
            seller.mallFloor = seller.mallRequest.mallFloor;
        }

        seller.mallRequest.status = data.status;
        seller.mallRequest.reviewedBy = new Types.ObjectId(adminId);
        seller.mallRequest.reviewedAt = new Date();
        seller.mallRequest.rejectionReason = data.status === "REJECTED" ? data.reason : undefined;

        await seller.save();
        await seller.populate("mallId", "name slug address.city isActive");
        await this.recordAdminMutation(adminId, "REVIEW_SELLER_MALL_REQUEST", "Seller", seller._id.toString(), {
            before,
            after: plainDoc(seller),
            metadata: { userId, status: data.status, reason: data.reason },
        });
        return seller;
    }

    static async listMallCreationRequests() {
        return await Mall.find({ status: "PENDING" })
            .populate("requestedBy", "fullName email phone")
            .sort({ createdAt: -1 })
            .lean();
    }

    static async reviewMallCreationRequest(mallId: string, adminId: string, data: any) {
        const mall = await Mall.findById(mallId);
        if (!mall) throw new ApiError(404, "Mall request not found");
        if (mall.status !== "PENDING") {
            throw new ApiError(400, "Mall request has already been reviewed");
        }
        const before = plainDoc(mall);

        mall.status = data.status;
        mall.reviewedBy = new Types.ObjectId(adminId);
        mall.reviewedAt = new Date();
        mall.rejectionReason = data.status === "REJECTED" ? data.reason : undefined;
        mall.isActive = data.status === "APPROVED";

        if (data.status === "APPROVED" && mall.requestedBy) {
            const seller = await Seller.findOne({ userId: mall.requestedBy });
            if (seller) {
                seller.mallId = mall._id;
                seller.mallUnit = mall.request?.mallUnit;
                seller.mallFloor = mall.request?.mallFloor;
                await seller.save();
            }
        }

        await mall.save();
        await mall.populate("requestedBy", "fullName email phone");
        await this.recordAdminMutation(adminId, "REVIEW_MALL_CREATION", "Mall", mall._id.toString(), {
            before,
            after: plainDoc(mall),
            metadata: { status: data.status, reason: data.reason },
        });
        return mall;
    }

    static async listPayoutMethods(query: any = {}) {
        const sellerFilter: any = {};
        const deliveryFilter: any = {};
        if (query.status) {
            sellerFilter["payoutMethods.status"] = query.status;
            deliveryFilter["payoutMethods.status"] = query.status;
        }

        const [sellers, riders] = await Promise.all([
            Seller.find(sellerFilter)
                .populate("userId", "fullName email phone")
                .sort({ updatedAt: -1 })
                .lean(),
            DeliveryBoy.find(deliveryFilter)
                .populate("userId", "fullName email phone")
                .sort({ updatedAt: -1 })
                .lean(),
        ]);

        const sellerMethods = sellers.flatMap((seller: any) =>
            (seller.payoutMethods || [])
                .filter((method: any) => !query.status || method.status === query.status)
                .map((method: any) => ({
                    _id: method._id?.toString(),
                    partnerType: "SELLER",
                    partnerId: seller.userId?._id?.toString() || seller.userId?.toString(),
                    sellerId: seller.userId?._id?.toString() || seller.userId?.toString(),
                    sellerProfileId: seller._id?.toString(),
                    sellerName: seller.userId?.fullName,
                    sellerEmail: seller.userId?.email,
                    businessName: seller.businessName,
                    type: method.type,
                    label: method.label,
                    status: method.status,
                    isDefault: !!method.isDefault,
                    bank: method.bank,
                    upi: method.upi,
                    paypal: method.paypal,
                    stripeConnect: method.stripeConnect,
                    rejectionReason: method.rejectionReason,
                    createdAt: method.createdAt,
                    verifiedAt: method.verifiedAt,
                })),
        );

        const riderMethods = riders.flatMap((rider: any) =>
            (rider.payoutMethods || [])
                .filter((method: any) => !query.status || method.status === query.status)
                .map((method: any) => ({
                    _id: method._id?.toString(),
                    partnerType: "DELIVERY",
                    partnerId: rider.userId?._id?.toString() || rider.userId?.toString(),
                    deliveryId: rider.userId?._id?.toString() || rider.userId?.toString(),
                    deliveryProfileId: rider._id?.toString(),
                    riderName: rider.userId?.fullName,
                    riderEmail: rider.userId?.email,
                    vehicleNumber: rider.vehicleNumber,
                    type: method.type,
                    label: method.label,
                    status: method.status,
                    isDefault: !!method.isDefault,
                    bank: method.bank,
                    upi: method.upi,
                    rejectionReason: method.rejectionReason,
                    createdAt: method.createdAt,
                    verifiedAt: method.verifiedAt,
                })),
        );

        return [...sellerMethods, ...riderMethods].sort(
            (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );
    }

    static async reviewPayoutMethod(userId: string, methodId: string, adminId: string, data: any) {
        const seller = await Seller.findOne({ userId });
        if (!seller) throw new ApiError(404, "Seller profile not found");
        const before = plainDoc(seller);

        const method = seller.payoutMethods.id(methodId);
        if (!method) throw new ApiError(404, "Payout method not found");

        method.status = data.status;
        method.verifiedBy = new Types.ObjectId(adminId);
        method.verifiedAt = new Date();
        method.rejectionReason = data.status === "REJECTED" ? data.reason : undefined;

        if (data.status === "VERIFIED" && !seller.payoutMethods.some((item: any) => item.isDefault && item._id.toString() !== methodId)) {
            method.isDefault = true;
        }

        await seller.save();
        await this.recordAdminMutation(adminId, "REVIEW_PAYOUT_METHOD", "SellerPayoutMethod", methodId, {
            before,
            after: plainDoc(method),
            metadata: { userId, status: data.status, reason: data.reason },
        });
        return method;
    }

    static async reviewDeliveryPayoutMethod(userId: string, methodId: string, adminId: string, data: any) {
        const rider: any = await DeliveryBoy.findOne({ userId });
        if (!rider) throw new ApiError(404, "Delivery profile not found");
        const before = plainDoc(rider);

        const method = rider.payoutMethods.id(methodId);
        if (!method) throw new ApiError(404, "Payout method not found");

        method.status = data.status;
        method.verifiedBy = new Types.ObjectId(adminId);
        method.verifiedAt = new Date();
        method.rejectionReason = data.status === "REJECTED" ? data.reason : undefined;

        if (data.status === "VERIFIED" && !rider.payoutMethods.some((item: any) => item.isDefault && item._id.toString() !== methodId)) {
            method.isDefault = true;
        }

        await rider.save();
        await this.recordAdminMutation(adminId, "REVIEW_DELIVERY_PAYOUT_METHOD", "DeliveryPayoutMethod", methodId, {
            before,
            after: plainDoc(method),
            metadata: { userId, status: data.status, reason: data.reason },
        });
        return method;
    }

    static async listSellerSubmissions(query: any = {}) {
        const types = query.type ? [query.type] : Object.keys(submissionModels);
        const { page, limit, skip } = listOptions(query);
        const status = query.status || "PENDING_REVIEW";
        const result: Record<string, any> = {};

        for (const type of types) {
            const model = submissionModels[type];
            if (!model) throw new ApiError(400, "Invalid seller submission type");

            const statusField = type === "categoryRequests" ? "status" : "approvalStatus";
            const filter: any = {};
            if (type !== "categoryRequests") filter.scope = "SELLER";
            if (status !== "ALL") filter[statusField] = status;

            const [data, total] = await Promise.all([
                model.find(filter)
                    .populate("sellerId", "fullName email phone")
                    .populate("storeId", "name")
                    .sort({ createdAt: -1 })
                    .skip(query.type ? skip : 0)
                    .limit(query.type ? limit : 10)
                    .lean(),
                model.countDocuments(filter),
            ]);

            result[type] = {
                data,
                total,
                page: query.type ? page : 1,
                limit: query.type ? limit : 10,
                totalPages: Math.ceil(total / (query.type ? limit : 10)),
            };
        }

        return query.type ? result[query.type] : result;
    }

    static async reviewSellerSubmission(type: string, id: string, adminId: string, data: any) {
        const model = submissionModels[type];
        if (!model) throw new ApiError(400, "Invalid seller submission type");

        if (type === "categoryRequests") {
            const request = await SellerCategoryRequest.findById(id);
            if (!request) throw new ApiError(404, "Category request not found");
            if (request.status !== "PENDING") {
                throw new ApiError(400, "Category request has already been reviewed");
            }

            request.status = data.status;
            request.reviewedBy = new Types.ObjectId(adminId);
            request.reviewedAt = new Date();
            request.rejectionReason = data.status === "REJECTED" ? data.reason : undefined;

            if (data.status === "APPROVED" && request.storeId) {
                const store = await Store.findById(request.storeId);
                if (store) {
                    const categoryConfig = {
                        primaryCategory: request.requestedPrimaryCategory,
                        subcategories: request.requestedSubcategories || [],
                        assignedByAdmin: true,
                    };
                    const setup = buildStoreSetupStatus(mergeStoreForSetup(store, { categoryConfig }));
                    store.categoryConfig = categoryConfig;
                    store.isSetupComplete = setup.isComplete;
                    store.setupMissingFields = setup.missingFields;
                    store.setupCompletedAt = setup.isComplete ? (store.setupCompletedAt || new Date()) : undefined;
                    await store.save();
                }
            }

            await request.save();
            await notificationForSubmission(request.sellerId, "category request", data.status, request._id.toString(), data.reason);
            await this.recordAdminMutation(adminId, "REVIEW_SELLER_SUBMISSION", "SellerCategoryRequest", request._id.toString(), {
                after: plainDoc(request),
                metadata: { status: data.status, reason: data.reason },
            });
            return request;
        }

        const submission = await model.findOne({ _id: id, scope: "SELLER" });
        if (!submission) throw new ApiError(404, "Seller submission not found");
        const before = plainDoc(submission);

        submission.approvalStatus = data.status;
        submission.reviewedBy = new Types.ObjectId(adminId);
        submission.reviewedAt = new Date();
        submission.rejectionReason = data.status === "REJECTED" ? data.reason : undefined;
        submission.isActive = data.status === "APPROVED";

        if (type === "banners" && data.status === "APPROVED") {
            submission.placement = data.placement || submission.placement || "home_top";
            submission.priority = data.priority !== undefined ? Number(data.priority) : (submission.priority || 0);
            if (data.startDate) submission.startDate = new Date(data.startDate);
            if (data.endDate) submission.endDate = new Date(data.endDate);
        }

        await submission.save();
        await notificationForSubmission(submission.sellerId, type, data.status, submission._id.toString(), data.reason);
        await this.recordAdminMutation(adminId, "REVIEW_SELLER_SUBMISSION", type, submission._id.toString(), {
            before,
            after: plainDoc(submission),
            metadata: { status: data.status, reason: data.reason },
        });
        return submission;
    }

    static async updatePayoutStatus(payoutId: string, adminId: string, data: any) {
        const payout = await AdminPayout.findById(payoutId);
        if (!payout) throw new ApiError(404, "Payout not found");

        const previousStatus = payout.status;
        const before = plainDoc(payout);
        payout.status = data.status;
        payout.referenceId = data.referenceId ?? payout.referenceId;
        payout.note = data.note ?? payout.note;
        payout.processedBy = new Types.ObjectId(adminId);
        payout.processedAt = ["PAID", "FAILED"].includes(data.status) ? new Date() : payout.processedAt;

        if (payout.partnerType === "SELLER") {
            const seller = await Seller.findOne({ userId: payout.partnerId });
            if (seller?.wallet) {
                const wasReserved = ["PENDING", "PROCESSING"].includes(previousStatus);
                const isTerminal = ["PAID", "FAILED"].includes(data.status);

                if (wasReserved && isTerminal) {
                    seller.wallet.pendingPayoutBalance = Math.max(
                        0,
                        (seller.wallet.pendingPayoutBalance || 0) - payout.amount,
                    );

                    if (data.status === "FAILED") {
                        seller.wallet.availableBalance = (seller.wallet.availableBalance || 0) + payout.amount;
                    }

                    await seller.save();
                }
            }
        }

        if (payout.partnerType === "DELIVERY") {
            const rider = await DeliveryBoy.findOne({ userId: payout.partnerId });
            if (rider?.wallet) {
                const wasReserved = ["PENDING", "PROCESSING"].includes(previousStatus);
                const isTerminal = ["PAID", "FAILED"].includes(data.status);

                if (wasReserved && isTerminal) {
                    rider.wallet.pendingPayoutBalance = Math.max(
                        0,
                        (rider.wallet.pendingPayoutBalance || 0) - payout.amount,
                    );

                    if (data.status === "FAILED") {
                        rider.wallet.availableBalance = (rider.wallet.availableBalance || 0) + payout.amount;
                    }
                }

                if (!wasReserved && ["PENDING", "PROCESSING"].includes(data.status)) {
                    rider.wallet.availableBalance = Math.max(0, (rider.wallet.availableBalance || 0) - payout.amount);
                    rider.wallet.pendingPayoutBalance = (rider.wallet.pendingPayoutBalance || 0) + payout.amount;
                }

                await rider.save();
            }
        }

        await payout.save();
        await this.recordAdminMutation(adminId, "UPDATE_PAYOUT_STATUS", "AdminPayout", payout._id.toString(), {
            before,
            after: plainDoc(payout),
            metadata: { previousStatus, status: data.status },
        });
        return await payout.populate("partnerId", "fullName email");
    }
}
