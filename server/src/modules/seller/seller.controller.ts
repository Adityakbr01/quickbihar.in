import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { SellerService } from "./seller.service";
import { SubOrderService } from "../order/subOrder.service";
import { ApiError } from "../../utils/ApiError";
import { normalizeMallPayload, uploadMallMediaFiles } from "../mall/mall.media";
import {
    createMallRequestSchema,
    payoutMethodSchema,
    payoutRequestSchema,
    requestMallSchema,
    sellerBannerSchema,
    sellerCategoryRequestSchema,
    sellerCouponSchema,
    sellerListQuerySchema,
    sellerOrderStatusSchema,
    sellerSizeChartAssignSchema,
    sellerSizeChartSchema,
    sellerStockUpdateSchema,
    sellerStoreSchema,
    sellerStoreToggleSchema,
    sellerSubmitReviewSchema,
} from "./seller.validation";

export class SellerController {
    static dashboard = asyncHandler(async (req, res) => {
        const dashboard = await SellerService.getDashboard((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, dashboard, "Seller dashboard fetched successfully"));
    });

    static setupStatus = asyncHandler(async (req, res) => {
        const setup = await SellerService.getSetupStatus((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, setup, "Seller setup status fetched successfully"));
    });

    static getStore = asyncHandler(async (req, res) => {
        const store = await SellerService.getStore((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, store, "Seller store fetched successfully"));
    });

    static saveStore = asyncHandler(async (req, res) => {
        const body = sellerStoreSchema.parse(req.body);
        const store = await SellerService.saveStore((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, store, "Seller store saved successfully"));
    });

    static toggleStoreOpen = asyncHandler(async (req, res) => {
        const body = sellerStoreToggleSchema.parse(req.body);
        const store = await SellerService.toggleStoreOpen((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, store, "Store availability updated successfully"));
    });

    static listProducts = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const products = await SellerService.listProducts((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, products, "Seller products fetched successfully"));
    });

    static createProduct = asyncHandler(async (req, res) => {
        const product = await SellerService.createProduct(
            (req as any).user._id,
            req.body,
            (req.files as any[]) || [],
        );
        return res.status(201).json(new ApiResponse(201, product, "Product draft created successfully"));
    });

    static updateProduct = asyncHandler(async (req, res) => {
        const product = await SellerService.updateProduct(
            (req as any).user._id,
            req.params.id as string,
            req.body,
            (req.files as any[]) || [],
        );
        return res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
    });

    static deleteProduct = asyncHandler(async (req, res) => {
        await SellerService.deleteProduct((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
    });

    static submitProduct = asyncHandler(async (req, res) => {
        sellerSubmitReviewSchema.parse(req.body);
        const product = await SellerService.submitProductForReview((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, product, "Product submitted for admin review"));
    });

    static categories = asyncHandler(async (req, res) => {
        const categories = await SellerService.listCategories((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, categories, "Seller categories fetched successfully"));
    });

    static refundPolicies = asyncHandler(async (req, res) => {
        const policies = await SellerService.listRefundPolicies((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, policies, "Seller refund policies fetched successfully"));
    });

    static policies = asyncHandler(async (req, res) => {
        const policies = await SellerService.listPolicies((req as any).user._id, req.query);
        return res.status(200).json(new ApiResponse(200, policies, "Seller policies fetched successfully"));
    });

    static warehouses = asyncHandler(async (req, res) => {
        const warehouses = await SellerService.listWarehouses((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, warehouses, "Seller warehouses fetched successfully"));
    });

    static requestCategoryChange = asyncHandler(async (req, res) => {
        const body = sellerCategoryRequestSchema.parse(req.body);
        const request = await SellerService.requestCategoryChange((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, request, "Category change request submitted successfully"));
    });

    static inventory = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const inventory = await SellerService.listInventory((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, inventory, "Seller inventory fetched successfully"));
    });

    static updateStock = asyncHandler(async (req, res) => {
        const body = sellerStockUpdateSchema.parse(req.body);
        const inventory = await SellerService.updateVariantStock((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, inventory, "Variant stock updated successfully"));
    });

    static inventoryMovements = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const movements = await SellerService.listInventoryMovements((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, movements, "Inventory movements fetched successfully"));
    });

    static orders = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const orders = await SellerService.listOrders((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, orders, "Seller orders fetched successfully"));
    });

    static orderDetails = asyncHandler(async (req, res) => {
        const order = await SellerService.getOrder((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, order, "Seller order fetched successfully"));
    });

    static updateOrderStatus = asyncHandler(async (req, res) => {
        const body = sellerOrderStatusSchema.parse(req.body);
        const order = await SellerService.updateOrderFulfillmentStatus(
            (req as any).user._id,
            req.params.id as string,
            body,
        );
        return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
    });

    static coupons = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const coupons = await SellerService.listCoupons((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, coupons, "Seller coupons fetched successfully"));
    });

    static createCoupon = asyncHandler(async (req, res) => {
        const body = sellerCouponSchema.parse(req.body);
        const coupon = await SellerService.createCoupon((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, coupon, "Coupon draft created successfully"));
    });

    static updateCoupon = asyncHandler(async (req, res) => {
        const body = sellerCouponSchema.partial().parse(req.body);
        const coupon = await SellerService.updateCoupon((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, coupon, "Coupon updated successfully"));
    });

    static deleteCoupon = asyncHandler(async (req, res) => {
        const coupon = await SellerService.deleteCoupon((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, coupon, "Coupon deleted successfully"));
    });

    static submitCoupon = asyncHandler(async (req, res) => {
        sellerSubmitReviewSchema.parse(req.body);
        const coupon = await SellerService.submitCouponForReview((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, coupon, "Coupon submitted for admin review"));
    });

    static customers = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const customers = await SellerService.listCustomers((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, customers, "Seller customers fetched successfully"));
    });

    static banners = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const banners = await SellerService.listBanners((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, banners, "Seller banners fetched successfully"));
    });

    static createBanner = asyncHandler(async (req, res) => {
        const body = sellerBannerSchema.parse(req.body);
        const banner = await SellerService.createBanner((req as any).user._id, body, req.file);
        return res.status(201).json(new ApiResponse(201, banner, "Banner draft created successfully"));
    });

    static updateBanner = asyncHandler(async (req, res) => {
        const body = sellerBannerSchema.partial().parse(req.body);
        const banner = await SellerService.updateBanner((req as any).user._id, req.params.id as string, body, req.file);
        return res.status(200).json(new ApiResponse(200, banner, "Banner updated successfully"));
    });

    static deleteBanner = asyncHandler(async (req, res) => {
        const banner = await SellerService.deleteBanner((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, banner, "Banner deleted successfully"));
    });

    static submitBanner = asyncHandler(async (req, res) => {
        sellerSubmitReviewSchema.parse(req.body);
        const banner = await SellerService.submitBannerForReview((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, banner, "Banner submitted for admin review"));
    });

    static sizeCharts = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const charts = await SellerService.listSizeCharts((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, charts, "Seller size charts fetched successfully"));
    });

    static createSizeChart = asyncHandler(async (req, res) => {
        const body = sellerSizeChartSchema.parse(req.body);
        const chart = await SellerService.createSizeChart((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, chart, "Size chart draft created successfully"));
    });

    static updateSizeChart = asyncHandler(async (req, res) => {
        const body = sellerSizeChartSchema.partial().parse(req.body);
        const chart = await SellerService.updateSizeChart((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, chart, "Size chart updated successfully"));
    });

    static deleteSizeChart = asyncHandler(async (req, res) => {
        const chart = await SellerService.deleteSizeChart((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, chart, "Size chart deleted successfully"));
    });

    static submitSizeChart = asyncHandler(async (req, res) => {
        sellerSubmitReviewSchema.parse(req.body);
        const chart = await SellerService.submitSizeChartForReview((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, chart, "Size chart submitted for admin review"));
    });

    static assignSizeChartProducts = asyncHandler(async (req, res) => {
        const body = sellerSizeChartAssignSchema.parse(req.body);
        const chart = await SellerService.assignSizeChartProducts(
            (req as any).user._id,
            req.params.id as string,
            body.productIds,
        );
        return res.status(200).json(new ApiResponse(200, chart, "Size chart product assignment updated successfully"));
    });

    static payouts = asyncHandler(async (req, res) => {
        const payouts = await SellerService.listPayouts((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, payouts, "Seller payouts fetched successfully"));
    });

    static reports = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const reports = await SellerService.getReports((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, reports, "Seller reports fetched successfully"));
    });

    static notifications = asyncHandler(async (req, res) => {
        const query = sellerListQuerySchema.parse(req.query);
        const notifications = await SellerService.listNotifications((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, notifications, "Seller notifications fetched successfully"));
    });

    static markNotificationRead = asyncHandler(async (req, res) => {
        const notification = await SellerService.markNotificationRead((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
    });

    static getMall = asyncHandler(async (req, res) => {
        const detail = await SellerService.getSellerMall((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, detail, "Seller mall details fetched successfully"));
    });

    static requestMallConnection = asyncHandler(async (req, res) => {
        const body = requestMallSchema.parse(req.body);
        const seller = await SellerService.requestMallConnection((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, seller, "Mall connection request submitted successfully"));
    });

    static requestMallCreation = asyncHandler(async (req, res) => {
        const media = await uploadMallMediaFiles(req.files);
        const normalized = normalizeMallPayload(req.body);
        let images = normalized.images || [];
        if (media.images) {
            images = [...images, ...media.images];
        }

        const body = createMallRequestSchema.parse({
            ...normalized,
            logoUrl: media.logoUrl || normalized.logoUrl,
            logoImagePublicId: media.logoImagePublicId || normalized.logoImagePublicId,
            coverImageUrl: media.coverImageUrl || normalized.coverImageUrl,
            coverImagePublicId: media.coverImagePublicId || normalized.coverImagePublicId,
            images,
        });
        const mall = await SellerService.requestMallCreation((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, mall, "Mall creation request submitted successfully"));
    });

    static updateMall = asyncHandler(async (req, res) => {
        const mallId = req.params.id as string;
        if (!mallId) throw new ApiError(400, "Mall ID is required");

        const media = await uploadMallMediaFiles(req.files);
        const normalized = normalizeMallPayload(req.body);
        let images = normalized.images || [];
        if (media.images) {
            images = [...images, ...media.images];
        }

        const body = createMallRequestSchema.partial().parse({
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

        const mall = await SellerService.updateSellerMall((req as any).user._id, mallId, body);
        return res.status(200).json(new ApiResponse(200, mall, "Mall details updated and submitted for approval"));
    });

    static deleteMall = asyncHandler(async (req, res) => {
        const mallId = req.params.id as string;
        if (!mallId) throw new ApiError(400, "Mall ID is required");

        const seller = await SellerService.deleteSellerMall((req as any).user._id, mallId);
        return res.status(200).json(new ApiResponse(200, seller, "Mall association removed successfully"));
    });

    static addPayoutMethod = asyncHandler(async (req, res) => {
        const body = payoutMethodSchema.parse(req.body);
        const method = await SellerService.addPayoutMethod((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, method, "Payout method submitted for verification"));
    });

    static setDefaultPayoutMethod = asyncHandler(async (req, res) => {
        const methods = await SellerService.setDefaultPayoutMethod(
            (req as any).user._id,
            req.params.methodId as string,
        );
        return res.status(200).json(new ApiResponse(200, methods, "Default payout method updated successfully"));
    });

    static createPayoutRequest = asyncHandler(async (req, res) => {
        const body = payoutRequestSchema.parse(req.body);
        const payout = await SellerService.createPayoutRequest((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, payout, "Payout request submitted successfully"));
    });

    static listSubOrders = asyncHandler(async (req, res) => {
        const query = req.query;
        const subOrders = await SubOrderService.listSellerSubOrders((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, subOrders, "Seller sub-orders fetched successfully"));
    });

    static subOrderDetails = asyncHandler(async (req, res) => {
        const subOrder = await SubOrderService.getSellerSubOrder((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, subOrder, "Seller sub-order details fetched successfully"));
    });

    static updateSubOrderStatus = asyncHandler(async (req, res) => {
        const sellerId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const { status, packageDetails } = req.body;
        
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        let result;
        if (status === "PROCESSING") {
            result = await SubOrderService.transitionToProcessing(subOrderId, sellerId, { ipAddress, deviceInfo });
        } else if (status === "PACKED") {
            result = await SubOrderService.transitionToPacked(subOrderId, sellerId, { ipAddress, deviceInfo });
        } else if (status === "READY_FOR_PICKUP") {
            if (!packageDetails || typeof packageDetails.weight !== "number") {
                throw new ApiError(400, "Package details (weight) are required to mark ready for pickup");
            }
            result = await SubOrderService.transitionToReadyForPickup(subOrderId, sellerId, packageDetails, { ipAddress, deviceInfo });
        } else {
            throw new ApiError(400, `Invalid status update by seller: ${status}`);
        }

        return res.status(200).json(new ApiResponse(200, result, `Sub-order status updated to ${status} successfully`));
    });

    static approveSubOrderCancellation = asyncHandler(async (req, res) => {
        const sellerId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const { approve } = req.body;

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.sellerApproveCancellation(subOrderId, sellerId, !!approve, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, approve ? "Cancellation approved" : "Cancellation rejected"));
    });
}
