import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as AdminService from "./admin.service";
import { ApiError } from "../../utils/ApiError";
import { Types } from "mongoose";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { CodSettlement } from "../fulfillment/codSettlement.model";
import { normalizeMallPayload, uploadMallMediaFiles } from "../mall/mall.media";
import {
    adminListQuerySchema,
    adminPolicySchema,
    adminUserSchema,
    adminSellerSchema,
    announcementSchema,
    backupCreateSchema,
    backupRestoreSchema,
    blogPostSchema,
    blockUserSchema,
    assignSellerMallSchema,
    cmsPageSchema,
    createMallSchema,
    createPayoutSchema,
    faqSchema,
    featureProductSchema,
    flashSaleSchema,
    inviteUserSchema,
    listPayoutMethodsSchema,
    listSellerSubmissionsSchema,
    listPeopleSchema,
    reviewMallCreationSchema,
    reviewMallRequestSchema,
    reviewPayoutMethodSchema,
    reviewSellerSubmissionSchema,
    shippingProviderSchema,
    systemConfigSchema,
    updateAnnouncementSchema,
    updateAdminPolicySchema,
    updateAdminUserSchema,
    updateAdminSellerSchema,
    updateBlogPostSchema,
    updateCmsPageSchema,
    updateFaqSchema,
    updateFlashSaleSchema,
    updateInventorySchema,
    updatePayoutStatusSchema,
    updateMallSchema,
    updatePartnerStatusSchema,
    updateShippingProviderSchema,
    updateWarehouseSchema,
    warehouseSchema,
} from "./admin.validation";

export const managementCatalog = asyncHandler(async (_req, res) => {
        const catalog = AdminService.getManagementCatalog();
        return res.status(200).json(new ApiResponse(200, catalog, "Admin management catalog fetched successfully"));
    });

export const dashboard = asyncHandler(async (_req, res) => {
        const data = await AdminService.getDashboard();
        return res.status(200).json(new ApiResponse(200, data, "Admin dashboard fetched successfully"));
    });

export const cmsPages = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const pages = await AdminService.listCMSPages(query);
        return res.status(200).json(new ApiResponse(200, pages, "CMS pages fetched successfully"));
    });

export const createCMSPage = asyncHandler(async (req, res) => {
        const body = cmsPageSchema.parse(req.body);
        const page = await AdminService.createCMSPage((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, page, "CMS page created successfully"));
    });

export const updateCMSPage = asyncHandler(async (req, res) => {
        const body = updateCmsPageSchema.parse(req.body);
        const page = await AdminService.updateCMSPage((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, page, "CMS page updated successfully"));
    });

export const deleteCMSPage = asyncHandler(async (req, res) => {
        const page = await AdminService.deleteCMSPage((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, page, "CMS page deleted successfully"));
    });

export const faqs = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const faqs = await AdminService.listFAQs(query);
        return res.status(200).json(new ApiResponse(200, faqs, "FAQs fetched successfully"));
    });

export const createFAQ = asyncHandler(async (req, res) => {
        const body = faqSchema.parse(req.body);
        const faq = await AdminService.createFAQ((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, faq, "FAQ created successfully"));
    });

export const updateFAQ = asyncHandler(async (req, res) => {
        const body = updateFaqSchema.parse(req.body);
        const faq = await AdminService.updateFAQ((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, faq, "FAQ updated successfully"));
    });

export const deleteFAQ = asyncHandler(async (req, res) => {
        const faq = await AdminService.deleteFAQ((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, faq, "FAQ deleted successfully"));
    });

export const blogPosts = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const posts = await AdminService.listBlogPosts(query);
        return res.status(200).json(new ApiResponse(200, posts, "Blog posts fetched successfully"));
    });

export const createBlogPost = asyncHandler(async (req, res) => {
        const body = blogPostSchema.parse(req.body);
        const post = await AdminService.createBlogPost((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, post, "Blog post created successfully"));
    });

export const updateBlogPost = asyncHandler(async (req, res) => {
        const body = updateBlogPostSchema.parse(req.body);
        const post = await AdminService.updateBlogPost((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, post, "Blog post updated successfully"));
    });

export const deleteBlogPost = asyncHandler(async (req, res) => {
        const post = await AdminService.deleteBlogPost((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, post, "Blog post deleted successfully"));
    });

export const announcements = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const announcements = await AdminService.listAnnouncements(query);
        return res.status(200).json(new ApiResponse(200, announcements, "Announcements fetched successfully"));
    });

export const createAnnouncement = asyncHandler(async (req, res) => {
        const body = announcementSchema.parse(req.body);
        const announcement = await AdminService.createAnnouncement((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, announcement, "Announcement created successfully"));
    });

export const updateAnnouncement = asyncHandler(async (req, res) => {
        const body = updateAnnouncementSchema.parse(req.body);
        const announcement = await AdminService.updateAnnouncement((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, announcement, "Announcement updated successfully"));
    });

export const deleteAnnouncement = asyncHandler(async (req, res) => {
        const announcement = await AdminService.deleteAnnouncement((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, announcement, "Announcement deleted successfully"));
    });

export const flashSales = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const sales = await AdminService.listFlashSales(query);
        return res.status(200).json(new ApiResponse(200, sales, "Flash sales fetched successfully"));
    });

export const createFlashSale = asyncHandler(async (req, res) => {
        const body = flashSaleSchema.parse(req.body);
        const sale = await AdminService.createFlashSale((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, sale, "Flash sale created successfully"));
    });

export const updateFlashSale = asyncHandler(async (req, res) => {
        const body = updateFlashSaleSchema.parse(req.body);
        const sale = await AdminService.updateFlashSale((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, sale, "Flash sale updated successfully"));
    });

export const deleteFlashSale = asyncHandler(async (req, res) => {
        const sale = await AdminService.deleteFlashSale((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, sale, "Flash sale deleted successfully"));
    });

export const featureProduct = asyncHandler(async (req, res) => {
        const body = featureProductSchema.parse(req.body);
        const product = await AdminService.setProductFeature((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, product, "Product merchandising flags updated successfully"));
    });

export const warehouses = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const warehouses = await AdminService.listWarehouses(query);
        return res.status(200).json(new ApiResponse(200, warehouses, "Warehouses fetched successfully"));
    });

export const sellerSizeCharts = asyncHandler(async (req, res) => {
        const charts = await AdminService.listSellerSizeCharts(req.params.sellerId as string);
        return res.status(200).json(new ApiResponse(200, charts, "Seller size charts fetched successfully"));
    });

export const createWarehouse = asyncHandler(async (req, res) => {
        const body = warehouseSchema.parse(req.body);
        const warehouse = await AdminService.createWarehouse((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, warehouse, "Warehouse created successfully"));
    });

export const updateWarehouse = asyncHandler(async (req, res) => {
        const body = updateWarehouseSchema.parse(req.body);
        const warehouse = await AdminService.updateWarehouse((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, warehouse, "Warehouse updated successfully"));
    });

export const deleteWarehouse = asyncHandler(async (req, res) => {
        const warehouse = await AdminService.deleteWarehouse((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, warehouse, "Warehouse deactivated successfully"));
    });

export const shippingProviders = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const providers = await AdminService.listShippingProviders(query);
        return res.status(200).json(new ApiResponse(200, providers, "Shipping providers fetched successfully"));
    });

export const createShippingProvider = asyncHandler(async (req, res) => {
        const body = shippingProviderSchema.parse(req.body);
        const provider = await AdminService.createShippingProvider((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, provider, "Shipping provider created successfully"));
    });

export const updateShippingProvider = asyncHandler(async (req, res) => {
        const body = updateShippingProviderSchema.parse(req.body);
        const provider = await AdminService.updateShippingProvider((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, provider, "Shipping provider updated successfully"));
    });

export const deleteShippingProvider = asyncHandler(async (req, res) => {
        const provider = await AdminService.deleteShippingProvider((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, provider, "Shipping provider deactivated successfully"));
    });

export const inventory = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const inventory = await AdminService.listInventory(query);
        return res.status(200).json(new ApiResponse(200, inventory, "Inventory fetched successfully"));
    });

export const updateInventory = asyncHandler(async (req, res) => {
        const body = updateInventorySchema.parse(req.body);
        const inventory = await AdminService.updateInventoryStock((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, inventory, "Inventory updated successfully"));
    });

export const reports = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const reports = await AdminService.getReports(query);
        return res.status(200).json(new ApiResponse(200, reports, "Reports fetched successfully"));
    });

export const activityLogs = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const logs = await AdminService.listActivityLogs(query);
        return res.status(200).json(new ApiResponse(200, logs, "Activity logs fetched successfully"));
    });

export const auditLogs = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const logs = await AdminService.listAuditLogs(query);
        return res.status(200).json(new ApiResponse(200, logs, "Audit logs fetched successfully"));
    });

export const systemConfig = asyncHandler(async (_req, res) => {
        const config = await AdminService.getSystemConfig();
        return res.status(200).json(new ApiResponse(200, config, "System configuration fetched successfully"));
    });

export const updateSystemConfig = asyncHandler(async (req, res) => {
        const body = systemConfigSchema.parse(req.body);
        const config = await AdminService.updateSystemConfig((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, config, "System configuration saved successfully"));
    });

export const backups = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const backups = await AdminService.listBackups(query);
        return res.status(200).json(new ApiResponse(200, backups, "Backups fetched successfully"));
    });

export const createBackup = asyncHandler(async (req, res) => {
        const body = backupCreateSchema.parse(req.body);
        const backup = await AdminService.createBackup((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, backup, "Backup created successfully"));
    });

export const dryRunRestore = asyncHandler(async (req, res) => {
        const result = await AdminService.dryRunRestore(req.params.id as string);
        return res.status(200).json(new ApiResponse(200, result, "Backup dry run completed successfully"));
    });

export const restoreBackup = asyncHandler(async (req, res) => {
        backupRestoreSchema.parse(req.body);
        const result = await AdminService.restoreBackup((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, result, "Backup restored successfully"));
    });

export const people = asyncHandler(async (req, res) => {
        const query = listPeopleSchema.parse(req.query);
        const people = await AdminService.listPeople(query);
        return res.status(200).json(new ApiResponse(200, people, "People fetched successfully"));
    });

export const userDetails = asyncHandler(async (req, res) => {
        const user = await AdminService.getUser(req.params.id as string);
        return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
    });

export const createUser = asyncHandler(async (req, res) => {
        const body = adminUserSchema.parse(req.body);
        const user = await AdminService.createUser((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, user, "User created successfully"));
    });

export const updateUser = asyncHandler(async (req, res) => {
        const body = updateAdminUserSchema.parse(req.body);
        const user = await AdminService.updateUser((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
    });

export const deleteUser = asyncHandler(async (req, res) => {
        const body = updateAdminUserSchema.pick({ deletionReason: true }).parse(req.body || {});
        const user = await AdminService.deleteUser(
            (req as any).user._id,
            req.params.id as string,
            body.deletionReason,
        );
        return res.status(200).json(new ApiResponse(200, user, "User deactivated successfully"));
    });

export const policies = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const policies = await AdminService.listPolicies({ ...query, type: req.query.type });
        return res.status(200).json(new ApiResponse(200, policies, "Policies fetched successfully"));
    });

export const createPolicy = asyncHandler(async (req, res) => {
        const body = adminPolicySchema.parse(req.body);
        const policy = await AdminService.createPolicy((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, policy, "Policy created successfully"));
    });

export const updatePolicy = asyncHandler(async (req, res) => {
        const body = updateAdminPolicySchema.parse(req.body);
        const policy = await AdminService.updatePolicy((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, policy, "Policy updated successfully"));
    });

export const deletePolicy = asyncHandler(async (req, res) => {
        const policy = await AdminService.deletePolicy((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, policy, "Policy deactivated successfully"));
    });

export const sellers = asyncHandler(async (req, res) => {
        const query = listPeopleSchema.parse({ ...req.query, role: "SELLER" });
        const sellers = await AdminService.listSellers(query);
        return res.status(200).json(new ApiResponse(200, sellers, "Sellers fetched successfully"));
    });

export const sellerDetails = asyncHandler(async (req, res) => {
        const seller = await AdminService.getSeller(req.params.id as string);
        return res.status(200).json(new ApiResponse(200, seller, "Seller fetched successfully"));
    });

export const sellerInsights = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const insights = await AdminService.getSellerInsights(req.params.id as string, query);
        return res.status(200).json(new ApiResponse(200, insights, "Seller insights fetched successfully"));
    });

export const riders = asyncHandler(async (req, res) => {
        const query = listPeopleSchema.parse({ ...req.query, role: "DELIVERY" });
        const riders = await AdminService.listRiders(query);
        return res.status(200).json(new ApiResponse(200, riders, "Riders fetched successfully"));
    });

export const riderDetails = asyncHandler(async (req, res) => {
        const rider = await AdminService.getRider(req.params.id as string);
        return res.status(200).json(new ApiResponse(200, rider, "Rider fetched successfully"));
    });

export const riderInsights = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const insights = await AdminService.getRiderInsights(req.params.id as string, query);
        return res.status(200).json(new ApiResponse(200, insights, "Rider insights fetched successfully"));
    });

export const createSeller = asyncHandler(async (req, res) => {
        const body = adminSellerSchema.parse(req.body);
        const seller = await AdminService.createSeller((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, seller, "Seller created successfully"));
    });

export const updateSeller = asyncHandler(async (req, res) => {
        const body = updateAdminSellerSchema.parse(req.body);
        const seller = await AdminService.updateSeller((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, seller, "Seller updated successfully"));
    });

export const deleteSeller = asyncHandler(async (req, res) => {
        const seller = await AdminService.deleteSeller((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, seller, "Seller deactivated successfully"));
    });

export const blockUser = asyncHandler(async (req, res) => {
        const body = blockUserSchema.parse(req.body);
        const user = await AdminService.setUserBlocked(req.params.id as string, body.isBlocked, (req as any).user._id);
        return res
            .status(200)
            .json(new ApiResponse(200, user, `User ${body.isBlocked ? "blocked" : "unblocked"} successfully`));
    });

export const updatePartnerStatus = asyncHandler(async (req, res) => {
        const body = updatePartnerStatusSchema.parse(req.body);
        const profile = await AdminService.updatePartnerStatus(req.params.id as string, body, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, profile, "Partner status updated successfully"));
    });

export const invite = asyncHandler(async (req, res) => {
        const body = inviteUserSchema.parse(req.body);
        const invite = await AdminService.sendInvite((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, invite, "Invite sent successfully"));
    });

export const payouts = asyncHandler(async (_req, res) => {
        const payouts = await AdminService.listPayouts();
        return res.status(200).json(new ApiResponse(200, payouts, "Payouts fetched successfully"));
    });

export const createPayout = asyncHandler(async (req, res) => {
        const body = createPayoutSchema.parse(req.body);
        const payout = await AdminService.createPayout((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, payout, "Payout recorded successfully"));
    });

export const updatePayoutStatus = asyncHandler(async (req, res) => {
        const body = updatePayoutStatusSchema.parse(req.body);
        const payout = await AdminService.updatePayoutStatus(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, payout, "Payout status updated successfully"));
    });

export const payoutMethods = asyncHandler(async (req, res) => {
        const query = listPayoutMethodsSchema.parse(req.query);
        const methods = await AdminService.listPayoutMethods(query);
        return res.status(200).json(new ApiResponse(200, methods, "Payout methods fetched successfully"));
    });

export const reviewPayoutMethod = asyncHandler(async (req, res) => {
        const body = reviewPayoutMethodSchema.parse(req.body);
        const method = await AdminService.reviewPayoutMethod(
            req.params.sellerId as string,
            req.params.methodId as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, method, "Payout method reviewed successfully"));
    });

export const reviewDeliveryPayoutMethod = asyncHandler(async (req, res) => {
        const body = reviewPayoutMethodSchema.parse(req.body);
        const method = await AdminService.reviewDeliveryPayoutMethod(
            req.params.deliveryId as string,
            req.params.methodId as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, method, "Delivery payout method reviewed successfully"));
    });

export const sellerSubmissions = asyncHandler(async (req, res) => {
        const query = listSellerSubmissionsSchema.parse(req.query);
        const submissions = await AdminService.listSellerSubmissions(query);
        return res.status(200).json(new ApiResponse(200, submissions, "Seller submissions fetched successfully"));
    });

export const reviewSellerSubmission = asyncHandler(async (req, res) => {
        const body = reviewSellerSubmissionSchema.parse(req.body);
        const submission = await AdminService.reviewSellerSubmission(
            req.params.type as string,
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, submission, "Seller submission reviewed successfully"));
    });

export const malls = asyncHandler(async (_req, res) => {
        const malls = await AdminService.listMalls();
        return res.status(200).json(new ApiResponse(200, malls, "Malls fetched successfully"));
    });

export const mallRequests = asyncHandler(async (_req, res) => {
        const requests = await AdminService.listMallRequests();
        return res.status(200).json(new ApiResponse(200, requests, "Mall requests fetched successfully"));
    });

export const mallCreationRequests = asyncHandler(async (_req, res) => {
        const requests = await AdminService.listMallCreationRequests();
        return res.status(200).json(new ApiResponse(200, requests, "Mall creation requests fetched successfully"));
    });

export const createMall = asyncHandler(async (req, res) => {
        const media = await uploadMallMediaFiles(req.files);
        const normalized = normalizeMallPayload(req.body);
        let images = normalized.images || [];
        if (media.images) {
            images = [...images, ...media.images];
        }

        const body = createMallSchema.parse({
            ...normalized,
            logoUrl: media.logoUrl || normalized.logoUrl,
            logoImagePublicId: media.logoImagePublicId || normalized.logoImagePublicId,
            coverImageUrl: media.coverImageUrl || normalized.coverImageUrl,
            coverImagePublicId: media.coverImagePublicId || normalized.coverImagePublicId,
            images,
        });
        const mall = await AdminService.createMall(body, (req as any).user._id);
        return res.status(201).json(new ApiResponse(201, mall, "Mall created successfully"));
    });

export const updateMall = asyncHandler(async (req, res) => {
        const media = await uploadMallMediaFiles(req.files);
        const normalized = normalizeMallPayload(req.body);
        let images = normalized.images || [];
        if (media.images) {
            images = [...images, ...media.images];
        }

        const body = updateMallSchema.parse({
            ...normalized,
            logoUrl: media.logoUrl !== undefined ? media.logoUrl : normalized.logoUrl,
            logoImagePublicId: media.logoImagePublicId !== undefined ? media.logoImagePublicId : normalized.logoImagePublicId,
            coverImageUrl: media.coverImageUrl !== undefined ? media.coverImageUrl : normalized.coverImageUrl,
            coverImagePublicId: media.coverImagePublicId !== undefined ? media.coverImagePublicId : normalized.coverImagePublicId,
            images: images.length > 0 ? images : undefined,
        });

        if (body.images && (body.images.length < 1 || body.images.length > 5)) {
            throw new ApiError(400, "Mall must have between 1 and 5 images");
        }

        const mall = await AdminService.updateMall(req.params.id as string, body, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, mall, "Mall updated successfully"));
    });

export const reviewMallCreation = asyncHandler(async (req, res) => {
        const body = reviewMallCreationSchema.parse(req.body);
        const mall = await AdminService.reviewMallCreationRequest(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, mall, "Mall creation request reviewed successfully"));
    });

export const deleteMall = asyncHandler(async (req, res) => {
        const mall = await AdminService.deleteMall(req.params.id as string, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, mall, "Mall deactivated successfully"));
    });

export const assignSellerMall = asyncHandler(async (req, res) => {
        const body = assignSellerMallSchema.parse(req.body);
        const seller = await AdminService.assignSellerToMall(req.params.id as string, body, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, seller, "Seller mall assignment updated successfully"));
    });

export const reviewMallRequest = asyncHandler(async (req, res) => {
        const body = reviewMallRequestSchema.parse(req.body);
        const seller = await AdminService.reviewMallRequest(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, seller, "Seller mall request reviewed successfully"));
    });

export const settleCodLiability = asyncHandler(async (req, res) => {
        const riderId = req.params.riderId as string;
        if (!riderId) {
            throw new ApiError(400, "Rider ID is required");
        }
        const { amount } = req.body;
        if (typeof amount !== "number" || amount <= 0) {
            throw new ApiError(400, "Valid deposit amount is required");
        }

        const riderProfile = await DeliveryBoy.findOne({
            $or: [
                { userId: new Types.ObjectId(riderId) },
                ...(riderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: new Types.ObjectId(riderId) }] : [])
            ]
        });

        if (!riderProfile) {
            throw new ApiError(404, "Rider profile not found");
        }

        if (!riderProfile.wallet) {
            riderProfile.wallet = { availableBalance: 0, pendingPayoutBalance: 0, lifetimeEarnings: 0, collectedCodLiability: 0 };
        }

        const currentLiability = riderProfile.wallet.collectedCodLiability || 0;
        if (amount > currentLiability) {
            throw new ApiError(400, `Cannot settle amount ${amount} greater than current collected liability ${currentLiability}`);
        }

        riderProfile.wallet.collectedCodLiability = Math.max(0, currentLiability - amount);
        await riderProfile.save();

        await CodSettlement.create({
            riderId: riderProfile.userId as any,
            riderProfileId: riderProfile._id,
            amount,
            previousLiability: currentLiability,
            newLiability: riderProfile.wallet.collectedCodLiability,
            status: "VERIFIED",
            note: req.body?.note || "COD cash deposit settled by admin",
            referenceId: req.body?.referenceId,
            verifiedBy: (req as any).user._id,
        });

        const { AdminPayout } = await import("./admin.model");
        const payoutLog = await AdminPayout.create({
            partnerId: riderProfile.userId as any,
            partnerType: "DELIVERY",
            amount,
            status: "PAID",
            method: "COD_CASH_DEPOSIT",
            note: `COD liability cash deposit settled by Admin. Previous liability: ${currentLiability}. New: ${riderProfile.wallet.collectedCodLiability}`,
            requestedBy: (req as any).user._id,
            processedBy: (req as any).user._id,
            processedAt: new Date()
        });

        return res.status(200).json(new ApiResponse(200, {
            payoutLog,
            collectedCodLiability: riderProfile.wallet.collectedCodLiability
        }, `Successfully settled rider COD liability of ₹${amount}`));
    });
