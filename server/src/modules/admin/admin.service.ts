import { Types } from "mongoose";
import { ENV } from "../../config/env.config";
import { ApiError } from "../../utils/ApiError";
import { MailService } from "../../utils/mail.service";
import { Banner } from "../banner/banner.model";
import { Coupon } from "../coupon/coupon.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { Mall } from "../mall/mall.model";
import { MallService } from "../mall/mall.service";
import { Product } from "../products/product.model";
import { Role } from "../rbac/rbac.model";
import * as rbacService from "../rbac/rbac.service";
import { RoleEnum } from "../rbac/rbac.types";
import { Seller } from "../seller/seller.model";
import { SellerCategoryRequest, SellerNotification } from "../seller/sellerPanel.model";
import { SizeChart } from "../sizeChart/sizeChart.model";
import { Store } from "../store/store.model";
import { buildStoreSetupStatus, mergeStoreForSetup } from "../store/store.setup";
import { User } from "../user/user.model";
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
            { name: "CMS Pages Management", status: "PLANNED", module: "missing", route: null, note: "Needs CMS page model/routes for static pages beyond policies." },
            { name: "FAQ Management", status: "PLANNED", module: "missing", route: null, note: "Needs FAQ model/routes and public FAQ endpoint." },
            { name: "Blog Management", status: "PLANNED", module: "missing", route: null, note: "Needs blog post model/routes, slugs, publish workflow, and SEO fields." },
            { name: "Announcement/Notification Management", status: "PARTIAL", module: "notification", route: null, note: "Notification service exists; admin announcement CRUD and scheduling still needed." },
        ],
    },
    {
        id: "marketing-promotions",
        title: "Marketing & Promotions",
        features: [
            { name: "Promotional Banners", status: "ACTIVE", module: "banner", route: "/api/v1/banners", note: "Banner module supports promotional placements." },
            { name: "Coupon Rules", status: "ACTIVE", module: "coupon", route: "/api/v1/coupons", note: "Coupon validation and rule fields exist." },
            { name: "Flash Sales", status: "PLANNED", module: "missing", route: null, note: "Needs sale campaign model, product assignments, countdown window, and pricing rules." },
            { name: "Featured Products", status: "PARTIAL", module: "products", route: "/api/v1/products", note: "Product model has featured flag; dedicated admin workflow can be expanded." },
            { name: "Push Notifications", status: "PARTIAL", module: "notification", route: null, note: "Firebase notification service exists; admin campaign UI/routes still needed." },
            { name: "Email Templates", status: "PARTIAL", module: "mail.service", route: null, note: "Transactional mail functions exist; template CRUD is still needed." },
        ],
    },
    {
        id: "inventory-logistics",
        title: "Inventory & Logistics",
        features: [
            { name: "Inventory Management", status: "PARTIAL", module: "products", route: "/api/v1/products", note: "Product variants carry stock; central inventory admin module still needed." },
            { name: "Stock Tracking", status: "PARTIAL", module: "products", route: "/api/v1/products", note: "Stock exists on products; movement/history tracking still needed." },
            { name: "Low Stock Alerts", status: "PLANNED", module: "missing", route: null, note: "Needs threshold settings and alert jobs." },
            { name: "Warehouse Management", status: "PARTIAL", module: "products", route: "/api/v1/products", note: "Product logistics fields include warehouse name; dedicated warehouses still needed." },
            { name: "Shipping Provider Configuration", status: "PLANNED", module: "missing", route: null, note: "Needs provider credentials, serviceability rules, and label/pickup integrations." },
        ],
    },
    {
        id: "reports-analytics",
        title: "Reports & Analytics",
        features: [
            { name: "Sales Reports", status: "PLANNED", module: "missing", route: null, note: "Needs aggregation endpoints over orders/payments." },
            { name: "Order Reports", status: "PARTIAL", module: "order", route: "/api/v1/orders/admin/all", note: "Admin order data exists; reporting summaries still needed." },
            { name: "Revenue Analytics", status: "PLANNED", module: "missing", route: null, note: "Needs revenue KPIs, date filters, and export endpoints." },
            { name: "Customer Analytics", status: "PLANNED", module: "missing", route: null, note: "Needs customer cohort and retention reports." },
            { name: "Product Performance Reports", status: "PLANNED", module: "missing", route: null, note: "Needs product views/sales/conversion aggregation." },
        ],
    },
    {
        id: "system-settings",
        title: "System Settings",
        features: [
            { name: "Role & Permission Management", status: "ACTIVE", module: "rbac", route: "/api/v1/rbac", note: "RBAC roles, permissions, and assignment exist." },
            { name: "Admin User Management", status: "PARTIAL", module: "admin/user", route: "/api/v1/admin/people?role=ADMIN", note: "Admin users can be listed/invited; deeper admin profile controls can be added." },
            { name: "Activity Logs", status: "PLANNED", module: "missing", route: null, note: "Needs activity log model and middleware." },
            { name: "Audit Logs", status: "PLANNED", module: "missing", route: null, note: "Needs immutable audit trail for sensitive admin actions." },
            { name: "API Configuration", status: "PLANNED", module: "missing", route: null, note: "Needs secure config store for external API keys and toggles." },
            { name: "Payment Gateway Settings", status: "PARTIAL", module: "paymentMethod/order", route: "/api/v1/payment-methods", note: "Payment methods exist; gateway credential management should remain secure/env-backed." },
            { name: "SMTP/Email Settings", status: "PARTIAL", module: "mail.service", route: null, note: "Mail service exists; admin-editable SMTP settings are not yet exposed." },
            { name: "Backup & Restore Settings", status: "PLANNED", module: "missing", route: null, note: "Needs backup export/import jobs and restricted admin controls." },
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

const serializeUser = (user: any, sellerProfile?: any, deliveryProfile?: any) => ({
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
    } : null,
    deliveryProfile: deliveryProfile ? {
        status: deliveryProfile.status,
        isVerified: !!deliveryProfile.isVerified,
        isOnline: !!deliveryProfile.isOnline,
        vehicleType: deliveryProfile.vehicleType,
        vehicleNumber: deliveryProfile.vehicleNumber,
        licenseNumber: deliveryProfile.licenseNumber,
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
        const [sellerProfiles, deliveryProfiles] = await Promise.all([
            Seller.find({ userId: { $in: userIds } })
                .populate("mallId", "name slug address.city isActive")
                .populate("mallRequest.mallId", "name slug address.city isActive")
                .lean(),
            DeliveryBoy.find({ userId: { $in: userIds } }).lean(),
        ]);

        const sellersByUser = new Map(sellerProfiles.map((profile: any) => [profile.userId.toString(), profile]));
        const deliveryByUser = new Map(deliveryProfiles.map((profile: any) => [profile.userId.toString(), profile]));

        return users.map((user: any) =>
            serializeUser(user, sellersByUser.get(user._id.toString()), deliveryByUser.get(user._id.toString())),
        );
    }

    static async setUserBlocked(userId: string, isBlocked: boolean) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { isBlocked } },
            { returnDocument: "after" },
        ).select(userProjection).populate("roleId");

        if (!user) throw new ApiError(404, "User not found");
        return serializeUser(user);
    }

    static async updatePartnerStatus(userId: string, data: any) {
        const model: any = data.type === "SELLER" ? Seller : DeliveryBoy;
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

        return profile;
    }

    static async sendInvite(adminId: string, data: any) {
        const inviteUrl = `${ENV.CORS_ORIGIN}/auth`;
        const sent = await MailService.sendAdminInvite(data.email, data.role, inviteUrl, data.fullName, data.message);

        if (!sent) throw new ApiError(500, "Failed to send invite email");

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

        await MailService.sendPayoutNotice(partner.email, data.amount, payout.status, data.referenceId);

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

    static async createMall(data: any) {
        const baseSlug = slugify(data.name);
        let slug = baseSlug;
        let suffix = 1;

        while (await Mall.exists({ slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        return await Mall.create({
            ...data,
            slug,
            totalStores: data.totalStores || 0,
            status: data.status || "APPROVED",
            isActive: data.isActive ?? true,
        });
    }

    static async updateMall(mallId: string, data: any) {
        const update: any = { $set: data };
        if (data.isFeatured === false) {
            delete update.$set.featuredRank;
            update.$unset = { featuredRank: 1 };
        }

        const mall = await Mall.findByIdAndUpdate(mallId, update, { returnDocument: "after" });
        if (!mall) throw new ApiError(404, "Mall not found");
        return mall;
    }

    static async deleteMall(mallId: string) {
        const mall = await Mall.findByIdAndUpdate(mallId, { $set: { isActive: false } }, { returnDocument: "after" });
        if (!mall) throw new ApiError(404, "Mall not found");
        return mall;
    }

    static async assignSellerToMall(userId: string, data: any) {
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

        const seller = await Seller.findOneAndUpdate(
            { userId },
            update,
            { returnDocument: "after" },
        ).populate("mallId", "name slug address.city isActive");

        if (!seller) throw new ApiError(404, "Seller profile not found");
        return seller;
    }

    static async reviewMallRequest(userId: string, adminId: string, data: any) {
        const seller = await Seller.findOne({ userId }).populate("mallRequest.mallId", "name slug address.city isActive");
        if (!seller) throw new ApiError(404, "Seller profile not found");
        if (seller.mallRequest?.status !== "PENDING") {
            throw new ApiError(400, "No pending mall request found for this seller");
        }

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
        return await seller.populate("mallId", "name slug address.city isActive");
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
        return await mall.populate("requestedBy", "fullName email phone");
    }

    static async listPayoutMethods(query: any = {}) {
        const sellerFilter: any = {};
        if (query.status) {
            sellerFilter["payoutMethods.status"] = query.status;
        }

        const sellers = await Seller.find(sellerFilter)
            .populate("userId", "fullName email phone")
            .sort({ updatedAt: -1 })
            .lean();

        return sellers.flatMap((seller: any) =>
            (seller.payoutMethods || [])
                .filter((method: any) => !query.status || method.status === query.status)
                .map((method: any) => ({
                    _id: method._id?.toString(),
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
    }

    static async reviewPayoutMethod(userId: string, methodId: string, adminId: string, data: any) {
        const seller = await Seller.findOne({ userId });
        if (!seller) throw new ApiError(404, "Seller profile not found");

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
            return request;
        }

        const submission = await model.findOne({ _id: id, scope: "SELLER" });
        if (!submission) throw new ApiError(404, "Seller submission not found");

        submission.approvalStatus = data.status;
        submission.reviewedBy = new Types.ObjectId(adminId);
        submission.reviewedAt = new Date();
        submission.rejectionReason = data.status === "REJECTED" ? data.reason : undefined;
        submission.isActive = data.status === "APPROVED";

        await submission.save();
        await notificationForSubmission(submission.sellerId, type, data.status, submission._id.toString(), data.reason);
        return submission;
    }

    static async updatePayoutStatus(payoutId: string, adminId: string, data: any) {
        const payout = await AdminPayout.findById(payoutId);
        if (!payout) throw new ApiError(404, "Payout not found");

        const previousStatus = payout.status;
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

        await payout.save();
        return await payout.populate("partnerId", "fullName email");
    }
}
