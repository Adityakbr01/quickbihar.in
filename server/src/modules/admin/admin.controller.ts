import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AdminService } from "./admin.service";
import {
    adminListQuerySchema,
    adminPolicySchema,
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

export class AdminController {
    static managementCatalog = asyncHandler(async (_req, res) => {
        const catalog = AdminService.getManagementCatalog();
        return res.status(200).json(new ApiResponse(200, catalog, "Admin management catalog fetched successfully"));
    });

    static dashboard = asyncHandler(async (_req, res) => {
        const data = await AdminService.getDashboard();
        return res.status(200).json(new ApiResponse(200, data, "Admin dashboard fetched successfully"));
    });

    static cmsPages = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const pages = await AdminService.listCMSPages(query);
        return res.status(200).json(new ApiResponse(200, pages, "CMS pages fetched successfully"));
    });

    static createCMSPage = asyncHandler(async (req, res) => {
        const body = cmsPageSchema.parse(req.body);
        const page = await AdminService.createCMSPage((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, page, "CMS page created successfully"));
    });

    static updateCMSPage = asyncHandler(async (req, res) => {
        const body = updateCmsPageSchema.parse(req.body);
        const page = await AdminService.updateCMSPage((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, page, "CMS page updated successfully"));
    });

    static deleteCMSPage = asyncHandler(async (req, res) => {
        const page = await AdminService.deleteCMSPage((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, page, "CMS page deleted successfully"));
    });

    static faqs = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const faqs = await AdminService.listFAQs(query);
        return res.status(200).json(new ApiResponse(200, faqs, "FAQs fetched successfully"));
    });

    static createFAQ = asyncHandler(async (req, res) => {
        const body = faqSchema.parse(req.body);
        const faq = await AdminService.createFAQ((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, faq, "FAQ created successfully"));
    });

    static updateFAQ = asyncHandler(async (req, res) => {
        const body = updateFaqSchema.parse(req.body);
        const faq = await AdminService.updateFAQ((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, faq, "FAQ updated successfully"));
    });

    static deleteFAQ = asyncHandler(async (req, res) => {
        const faq = await AdminService.deleteFAQ((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, faq, "FAQ deleted successfully"));
    });

    static blogPosts = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const posts = await AdminService.listBlogPosts(query);
        return res.status(200).json(new ApiResponse(200, posts, "Blog posts fetched successfully"));
    });

    static createBlogPost = asyncHandler(async (req, res) => {
        const body = blogPostSchema.parse(req.body);
        const post = await AdminService.createBlogPost((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, post, "Blog post created successfully"));
    });

    static updateBlogPost = asyncHandler(async (req, res) => {
        const body = updateBlogPostSchema.parse(req.body);
        const post = await AdminService.updateBlogPost((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, post, "Blog post updated successfully"));
    });

    static deleteBlogPost = asyncHandler(async (req, res) => {
        const post = await AdminService.deleteBlogPost((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, post, "Blog post deleted successfully"));
    });

    static announcements = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const announcements = await AdminService.listAnnouncements(query);
        return res.status(200).json(new ApiResponse(200, announcements, "Announcements fetched successfully"));
    });

    static createAnnouncement = asyncHandler(async (req, res) => {
        const body = announcementSchema.parse(req.body);
        const announcement = await AdminService.createAnnouncement((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, announcement, "Announcement created successfully"));
    });

    static updateAnnouncement = asyncHandler(async (req, res) => {
        const body = updateAnnouncementSchema.parse(req.body);
        const announcement = await AdminService.updateAnnouncement((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, announcement, "Announcement updated successfully"));
    });

    static deleteAnnouncement = asyncHandler(async (req, res) => {
        const announcement = await AdminService.deleteAnnouncement((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, announcement, "Announcement deleted successfully"));
    });

    static flashSales = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const sales = await AdminService.listFlashSales(query);
        return res.status(200).json(new ApiResponse(200, sales, "Flash sales fetched successfully"));
    });

    static createFlashSale = asyncHandler(async (req, res) => {
        const body = flashSaleSchema.parse(req.body);
        const sale = await AdminService.createFlashSale((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, sale, "Flash sale created successfully"));
    });

    static updateFlashSale = asyncHandler(async (req, res) => {
        const body = updateFlashSaleSchema.parse(req.body);
        const sale = await AdminService.updateFlashSale((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, sale, "Flash sale updated successfully"));
    });

    static deleteFlashSale = asyncHandler(async (req, res) => {
        const sale = await AdminService.deleteFlashSale((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, sale, "Flash sale deleted successfully"));
    });

    static featureProduct = asyncHandler(async (req, res) => {
        const body = featureProductSchema.parse(req.body);
        const product = await AdminService.setProductFeature((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, product, "Product merchandising flags updated successfully"));
    });

    static warehouses = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const warehouses = await AdminService.listWarehouses(query);
        return res.status(200).json(new ApiResponse(200, warehouses, "Warehouses fetched successfully"));
    });

    static sellerSizeCharts = asyncHandler(async (req, res) => {
        const charts = await AdminService.listSellerSizeCharts(req.params.sellerId as string);
        return res.status(200).json(new ApiResponse(200, charts, "Seller size charts fetched successfully"));
    });

    static createWarehouse = asyncHandler(async (req, res) => {
        const body = warehouseSchema.parse(req.body);
        const warehouse = await AdminService.createWarehouse((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, warehouse, "Warehouse created successfully"));
    });

    static updateWarehouse = asyncHandler(async (req, res) => {
        const body = updateWarehouseSchema.parse(req.body);
        const warehouse = await AdminService.updateWarehouse((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, warehouse, "Warehouse updated successfully"));
    });

    static deleteWarehouse = asyncHandler(async (req, res) => {
        const warehouse = await AdminService.deleteWarehouse((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, warehouse, "Warehouse deactivated successfully"));
    });

    static shippingProviders = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const providers = await AdminService.listShippingProviders(query);
        return res.status(200).json(new ApiResponse(200, providers, "Shipping providers fetched successfully"));
    });

    static createShippingProvider = asyncHandler(async (req, res) => {
        const body = shippingProviderSchema.parse(req.body);
        const provider = await AdminService.createShippingProvider((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, provider, "Shipping provider created successfully"));
    });

    static updateShippingProvider = asyncHandler(async (req, res) => {
        const body = updateShippingProviderSchema.parse(req.body);
        const provider = await AdminService.updateShippingProvider((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, provider, "Shipping provider updated successfully"));
    });

    static deleteShippingProvider = asyncHandler(async (req, res) => {
        const provider = await AdminService.deleteShippingProvider((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, provider, "Shipping provider deactivated successfully"));
    });

    static inventory = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const inventory = await AdminService.listInventory(query);
        return res.status(200).json(new ApiResponse(200, inventory, "Inventory fetched successfully"));
    });

    static updateInventory = asyncHandler(async (req, res) => {
        const body = updateInventorySchema.parse(req.body);
        const inventory = await AdminService.updateInventoryStock((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, inventory, "Inventory updated successfully"));
    });

    static reports = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const reports = await AdminService.getReports(query);
        return res.status(200).json(new ApiResponse(200, reports, "Reports fetched successfully"));
    });

    static activityLogs = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const logs = await AdminService.listActivityLogs(query);
        return res.status(200).json(new ApiResponse(200, logs, "Activity logs fetched successfully"));
    });

    static auditLogs = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const logs = await AdminService.listAuditLogs(query);
        return res.status(200).json(new ApiResponse(200, logs, "Audit logs fetched successfully"));
    });

    static systemConfig = asyncHandler(async (_req, res) => {
        const config = await AdminService.getSystemConfig();
        return res.status(200).json(new ApiResponse(200, config, "System configuration fetched successfully"));
    });

    static updateSystemConfig = asyncHandler(async (req, res) => {
        const body = systemConfigSchema.parse(req.body);
        const config = await AdminService.updateSystemConfig((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, config, "System configuration saved successfully"));
    });

    static backups = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const backups = await AdminService.listBackups(query);
        return res.status(200).json(new ApiResponse(200, backups, "Backups fetched successfully"));
    });

    static createBackup = asyncHandler(async (req, res) => {
        const body = backupCreateSchema.parse(req.body);
        const backup = await AdminService.createBackup((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, backup, "Backup created successfully"));
    });

    static dryRunRestore = asyncHandler(async (req, res) => {
        const result = await AdminService.dryRunRestore(req.params.id as string);
        return res.status(200).json(new ApiResponse(200, result, "Backup dry run completed successfully"));
    });

    static restoreBackup = asyncHandler(async (req, res) => {
        backupRestoreSchema.parse(req.body);
        const result = await AdminService.restoreBackup((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, result, "Backup restored successfully"));
    });

    static people = asyncHandler(async (req, res) => {
        const query = listPeopleSchema.parse(req.query);
        const people = await AdminService.listPeople(query);
        return res.status(200).json(new ApiResponse(200, people, "People fetched successfully"));
    });

    static policies = asyncHandler(async (req, res) => {
        const query = adminListQuerySchema.parse(req.query);
        const policies = await AdminService.listPolicies({ ...query, type: req.query.type });
        return res.status(200).json(new ApiResponse(200, policies, "Policies fetched successfully"));
    });

    static createPolicy = asyncHandler(async (req, res) => {
        const body = adminPolicySchema.parse(req.body);
        const policy = await AdminService.createPolicy((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, policy, "Policy created successfully"));
    });

    static updatePolicy = asyncHandler(async (req, res) => {
        const body = updateAdminPolicySchema.parse(req.body);
        const policy = await AdminService.updatePolicy((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, policy, "Policy updated successfully"));
    });

    static deletePolicy = asyncHandler(async (req, res) => {
        const policy = await AdminService.deletePolicy((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, policy, "Policy deactivated successfully"));
    });

    static sellers = asyncHandler(async (req, res) => {
        const query = listPeopleSchema.parse({ ...req.query, role: "SELLER" });
        const sellers = await AdminService.listSellers(query);
        return res.status(200).json(new ApiResponse(200, sellers, "Sellers fetched successfully"));
    });

    static sellerDetails = asyncHandler(async (req, res) => {
        const seller = await AdminService.getSeller(req.params.id as string);
        return res.status(200).json(new ApiResponse(200, seller, "Seller fetched successfully"));
    });

    static createSeller = asyncHandler(async (req, res) => {
        const body = adminSellerSchema.parse(req.body);
        const seller = await AdminService.createSeller((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, seller, "Seller created successfully"));
    });

    static updateSeller = asyncHandler(async (req, res) => {
        const body = updateAdminSellerSchema.parse(req.body);
        const seller = await AdminService.updateSeller((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, seller, "Seller updated successfully"));
    });

    static deleteSeller = asyncHandler(async (req, res) => {
        const seller = await AdminService.deleteSeller((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, seller, "Seller deactivated successfully"));
    });

    static blockUser = asyncHandler(async (req, res) => {
        const body = blockUserSchema.parse(req.body);
        const user = await AdminService.setUserBlocked(req.params.id as string, body.isBlocked, (req as any).user._id);
        return res
            .status(200)
            .json(new ApiResponse(200, user, `User ${body.isBlocked ? "blocked" : "unblocked"} successfully`));
    });

    static updatePartnerStatus = asyncHandler(async (req, res) => {
        const body = updatePartnerStatusSchema.parse(req.body);
        const profile = await AdminService.updatePartnerStatus(req.params.id as string, body, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, profile, "Partner status updated successfully"));
    });

    static invite = asyncHandler(async (req, res) => {
        const body = inviteUserSchema.parse(req.body);
        const invite = await AdminService.sendInvite((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, invite, "Invite sent successfully"));
    });

    static payouts = asyncHandler(async (_req, res) => {
        const payouts = await AdminService.listPayouts();
        return res.status(200).json(new ApiResponse(200, payouts, "Payouts fetched successfully"));
    });

    static createPayout = asyncHandler(async (req, res) => {
        const body = createPayoutSchema.parse(req.body);
        const payout = await AdminService.createPayout((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, payout, "Payout recorded successfully"));
    });

    static updatePayoutStatus = asyncHandler(async (req, res) => {
        const body = updatePayoutStatusSchema.parse(req.body);
        const payout = await AdminService.updatePayoutStatus(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, payout, "Payout status updated successfully"));
    });

    static payoutMethods = asyncHandler(async (req, res) => {
        const query = listPayoutMethodsSchema.parse(req.query);
        const methods = await AdminService.listPayoutMethods(query);
        return res.status(200).json(new ApiResponse(200, methods, "Payout methods fetched successfully"));
    });

    static reviewPayoutMethod = asyncHandler(async (req, res) => {
        const body = reviewPayoutMethodSchema.parse(req.body);
        const method = await AdminService.reviewPayoutMethod(
            req.params.sellerId as string,
            req.params.methodId as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, method, "Payout method reviewed successfully"));
    });

    static reviewDeliveryPayoutMethod = asyncHandler(async (req, res) => {
        const body = reviewPayoutMethodSchema.parse(req.body);
        const method = await AdminService.reviewDeliveryPayoutMethod(
            req.params.deliveryId as string,
            req.params.methodId as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, method, "Delivery payout method reviewed successfully"));
    });

    static sellerSubmissions = asyncHandler(async (req, res) => {
        const query = listSellerSubmissionsSchema.parse(req.query);
        const submissions = await AdminService.listSellerSubmissions(query);
        return res.status(200).json(new ApiResponse(200, submissions, "Seller submissions fetched successfully"));
    });

    static reviewSellerSubmission = asyncHandler(async (req, res) => {
        const body = reviewSellerSubmissionSchema.parse(req.body);
        const submission = await AdminService.reviewSellerSubmission(
            req.params.type as string,
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, submission, "Seller submission reviewed successfully"));
    });

    static malls = asyncHandler(async (_req, res) => {
        const malls = await AdminService.listMalls();
        return res.status(200).json(new ApiResponse(200, malls, "Malls fetched successfully"));
    });

    static mallRequests = asyncHandler(async (_req, res) => {
        const requests = await AdminService.listMallRequests();
        return res.status(200).json(new ApiResponse(200, requests, "Mall requests fetched successfully"));
    });

    static mallCreationRequests = asyncHandler(async (_req, res) => {
        const requests = await AdminService.listMallCreationRequests();
        return res.status(200).json(new ApiResponse(200, requests, "Mall creation requests fetched successfully"));
    });

    static createMall = asyncHandler(async (req, res) => {
        const body = createMallSchema.parse(req.body);
        const mall = await AdminService.createMall(body, (req as any).user._id);
        return res.status(201).json(new ApiResponse(201, mall, "Mall created successfully"));
    });

    static updateMall = asyncHandler(async (req, res) => {
        const body = updateMallSchema.parse(req.body);
        const mall = await AdminService.updateMall(req.params.id as string, body, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, mall, "Mall updated successfully"));
    });

    static reviewMallCreation = asyncHandler(async (req, res) => {
        const body = reviewMallCreationSchema.parse(req.body);
        const mall = await AdminService.reviewMallCreationRequest(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, mall, "Mall creation request reviewed successfully"));
    });

    static deleteMall = asyncHandler(async (req, res) => {
        const mall = await AdminService.deleteMall(req.params.id as string, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, mall, "Mall deactivated successfully"));
    });

    static assignSellerMall = asyncHandler(async (req, res) => {
        const body = assignSellerMallSchema.parse(req.body);
        const seller = await AdminService.assignSellerToMall(req.params.id as string, body, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, seller, "Seller mall assignment updated successfully"));
    });

    static reviewMallRequest = asyncHandler(async (req, res) => {
        const body = reviewMallRequestSchema.parse(req.body);
        const seller = await AdminService.reviewMallRequest(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, seller, "Seller mall request reviewed successfully"));
    });
}
