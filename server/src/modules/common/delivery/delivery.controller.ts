import { asyncHandler } from "@/utils/asyncHandler";
import * as deliveryService from "./delivery.service";
import { SubOrderService } from "@/modules/common/order/subOrder.service";
import { returnPickupSchema } from "@/modules/common/order/order.validator";
import { ApiError } from "@/utils/ApiError";
import { Types } from "mongoose";
import { SubOrder } from "@/modules/common/order/subOrder.model";
import { DeliveryBoy } from "@/modules/common/deliveryBoy/delivery.model";
import * as matchingService from "./matching.service";
import {
    deliveryEarningsSchema,
    deliveryHistorySchema,
    deliveryPayoutMethodSchema,
    deliveryPayoutRequestSchema,
    deliveryProfileUpdateSchema,
    listDeliveryOrdersSchema,
    listRidersSchema,
    reviewRiderDocumentSchema,
    updateAvailabilitySchema,
} from "./delivery.validation";

/**
 * Lists delivery riders for the admin console (supports availability/search filters).
 *
 * @route GET /api/v1/delivery/admin/riders
 * @access Protected (admin)
 */
export const adminRiders = asyncHandler(async (req, res) => {
    const query = listRidersSchema.parse(req.query);
    const riders = await deliveryService.listAdminRiders(query);
    res.ok(riders, "Delivery riders fetched successfully");
});

/**
 * Returns rider-matching diagnostics for a sub-order (admin debugging).
 *
 * @route GET /api/v1/delivery/admin/matching-diagnostics/:subOrderId
 * @access Protected (admin)
 */
export const matchingDiagnostics = asyncHandler(async (req, res) => {
    const diagnostics = await matchingService.diagnostics(req.params.subOrderId as string);
    res.ok(diagnostics, "Matching diagnostics fetched successfully");
});

/**
 * Approves or rejects a single rider KYC document (individually reviewable).
 *
 * @route PATCH /api/v1/delivery/admin/riders/:riderId/documents
 * @access Protected (admin)
 */
export const adminReviewRiderDocument = asyncHandler(async (req, res) => {
    const body = reviewRiderDocumentSchema.parse(req.body);
    const result = await deliveryService.reviewRiderDocument(
        req.params.riderId as string,
        (req as any).user._id.toString(),
        body,
    );
    res.ok(result, `Rider document ${body.status === "APPROVED" ? "approved" : "rejected"} successfully`);
});

/**
 * Returns the authenticated rider's delivery profile.
 *
 * @route GET /api/v1/delivery/me
 * @access Protected (delivery rider)
 */
export const me = asyncHandler(async (req, res) => {
    const data = await deliveryService.getMyProfile((req as any).user._id);
    res.ok(data, "Delivery profile fetched successfully");
});

/**
 * Returns the rider's dashboard snapshot.
 *
 * @route GET /api/v1/delivery/dashboard
 * @access Protected (delivery rider)
 */
export const dashboard = asyncHandler(async (req, res) => {
    const data = await deliveryService.getDashboard((req as any).user._id);
    res.ok(data, "Delivery dashboard fetched successfully");
});

/**
 * Returns the rider's completed delivery history.
 *
 * @route GET /api/v1/delivery/history
 * @access Protected (delivery rider)
 */
export const history = asyncHandler(async (req, res) => {
    const query = deliveryHistorySchema.parse(req.query);
    const data = await deliveryService.listHistory((req as any).user._id, query);
    res.ok(data, "Delivery history fetched successfully");
});

/**
 * Returns the rider's earnings breakdown for the requested period.
 *
 * @route GET /api/v1/delivery/earnings
 * @access Protected (delivery rider)
 */
export const earnings = asyncHandler(async (req, res) => {
    const query = deliveryEarningsSchema.parse(req.query);
    const data = await deliveryService.getEarnings((req as any).user._id, query);
    res.ok(data, "Delivery earnings fetched successfully");
});

/**
 * Lists the rider's payout requests.
 *
 * @route GET /api/v1/delivery/payouts
 * @access Protected (delivery rider)
 */
export const payouts = asyncHandler(async (req, res) => {
    const data = await deliveryService.listPayouts((req as any).user._id);
    res.ok(data, "Delivery payouts fetched successfully");
});

/**
 * Adds a payout method for the rider.
 *
 * @route POST /api/v1/delivery/payout-methods
 * @access Protected (delivery rider)
 */
export const addPayoutMethod = asyncHandler(async (req, res) => {
    const body = deliveryPayoutMethodSchema.parse(req.body);
    const data = await deliveryService.addPayoutMethod((req as any).user._id, body);
    res.created(data, "Payout method submitted successfully");
});

/**
 * Sets one of the rider's payout methods as default.
 *
 * @route PATCH /api/v1/delivery/payout-methods/:methodId/default
 * @access Protected (delivery rider)
 */
export const setDefaultPayoutMethod = asyncHandler(async (req, res) => {
    const data = await deliveryService.setDefaultPayoutMethod((req as any).user._id, req.params.methodId as string);
    res.ok(data, "Default payout method updated successfully");
});

/**
 * Creates a payout (withdrawal) request for the rider.
 *
 * @route POST /api/v1/delivery/payout-requests
 * @access Protected (delivery rider)
 */
export const requestPayout = asyncHandler(async (req, res) => {
    const body = deliveryPayoutRequestSchema.parse(req.body);
    const data = await deliveryService.createPayoutRequest((req as any).user._id, body);
    res.created(data, "Payout request submitted successfully");
});

/**
 * Updates the rider's editable profile fields.
 *
 * @route PATCH /api/v1/delivery/profile
 * @access Protected (delivery rider)
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const body = deliveryProfileUpdateSchema.parse(req.body);
    const data = await deliveryService.updateProfile((req as any).user._id, body);
    res.ok(data, "Delivery profile updated successfully");
});

/**
 * Updates the rider's online/availability state.
 *
 * @route PATCH /api/v1/delivery/availability
 * @access Protected (delivery rider)
 */
export const updateAvailability = asyncHandler(async (req, res) => {
    const body = updateAvailabilitySchema.parse(req.body);
    const profile = await deliveryService.updateAvailability((req as any).user._id, body);
    res.ok(profile, "Availability updated successfully");
});

/**
 * Lists the rider's assigned/active delivery orders.
 *
 * @route GET /api/v1/delivery/orders
 * @access Protected (delivery rider)
 */
export const orders = asyncHandler(async (req, res) => {
    const query = listDeliveryOrdersSchema.parse(req.query);
    const orders = await deliveryService.listMyOrders((req as any).user._id, query);
    res.ok(orders, "Delivery orders fetched successfully");
});

/**
 * Lists the open rider offers available to the rider.
 *
 * @route GET /api/v1/delivery/offers
 * @access Protected (delivery rider)
 */
export const offers = asyncHandler(async (req, res) => {
    const offers = await deliveryService.listOffers((req as any).user._id);
    res.ok(offers, "Open rider offers fetched successfully");
});

/**
 * Accepts an open rider offer (captures IP/device for auditing).
 *
 * @route POST /api/v1/delivery/offers/:id/accept
 * @access Protected (delivery rider)
 */
export const acceptOffer = asyncHandler(async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";
    const result = await deliveryService.acceptOffer(
        (req as any).user._id,
        req.params.id as string,
        { ipAddress, deviceInfo },
    );
    res.ok(result, "Offer accepted successfully");
});

/**
 * Rejects an open rider offer with an optional reason.
 *
 * @route POST /api/v1/delivery/offers/:id/reject
 * @access Protected (delivery rider)
 */
export const rejectOffer = asyncHandler(async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";
    const result = await deliveryService.rejectOffer(
        (req as any).user._id,
        req.params.id as string,
        req.body?.reason || "Not specified",
        { ipAddress, deviceInfo },
    );
    res.ok(result, "Offer rejected successfully");
});

/**
 * Returns a single delivery order assigned to the rider.
 *
 * @route GET /api/v1/delivery/orders/:id
 * @access Protected (delivery rider)
 */
export const orderById = asyncHandler(async (req, res) => {
    const order = await deliveryService.getMyOrder((req as any).user._id, req.params.id as string);
    res.ok(order, "Delivery order fetched successfully");
});

/**
 * Rider accepts a sub-order job offer.
 *
 * @route POST /api/v1/delivery/sub-orders/:id/accept
 * @access Protected (delivery rider)
 */
export const acceptSubOrder = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderAcceptOrder(riderUserId, subOrderId, { ipAddress, deviceInfo });
    res.ok(result, "Job offer accepted successfully");
});

/**
 * Marks the rider as arriving at the store for a sub-order.
 *
 * @route PATCH /api/v1/delivery/sub-orders/:id/arriving
 * @access Protected (delivery rider)
 */
export const subOrderArriving = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderArriving(subOrderId, riderUserId, { ipAddress, deviceInfo });
    res.ok(result, "Status updated to ARRIVING successfully");
});

/**
 * Verifies the rider reached the store (GPS checkpoint) for a sub-order.
 *
 * @route PATCH /api/v1/delivery/sub-orders/:id/reached-store
 * @access Protected (delivery rider)
 */
export const subOrderReachedStore = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const { latitude, longitude } = req.body;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new ApiError(400, "Current GPS location coordinates (latitude, longitude) are required");
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderReachedStore(subOrderId, riderUserId, { latitude, longitude }, { ipAddress, deviceInfo });
    res.ok(result, "Reached store checkpoint verified");
});

/**
 * Verifies store pickup for a sub-order (OTP/photo).
 *
 * @route POST /api/v1/delivery/sub-orders/:id/pickup
 * @access Protected (delivery rider)
 */
export const subOrderPickup = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const { pickupOtp, pickupPhoto } = req.body;

    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderPickup(subOrderId, riderUserId, pickupOtp, pickupPhoto, { ipAddress, deviceInfo });
    res.ok(result, "Store pickup verification successful");
});

/**
 * Marks a sub-order as in transit to the customer.
 *
 * @route PATCH /api/v1/delivery/sub-orders/:id/transit
 * @access Protected (delivery rider)
 */
export const subOrderTransit = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.startTransit(subOrderId, riderUserId, { ipAddress, deviceInfo });
    res.ok(result, "Status updated to transit");
});

/**
 * Verifies the rider is near the customer (GPS checkpoint) for a sub-order.
 *
 * @route PATCH /api/v1/delivery/sub-orders/:id/near-customer
 * @access Protected (delivery rider)
 */
export const subOrderNearCustomer = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const { latitude, longitude } = req.body;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new ApiError(400, "Current GPS location coordinates (latitude, longitude) are required");
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderNearCustomer(subOrderId, riderUserId, { latitude, longitude }, { ipAddress, deviceInfo });
    res.ok(result, "Rider near customer checkpoint verified");
});

/**
 * Verifies delivery for a sub-order (OTP/photo/signature) and credits earnings.
 *
 * @route POST /api/v1/delivery/sub-orders/:id/deliver
 * @access Protected (delivery rider)
 */
export const subOrderDeliver = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const { deliveryOtp, deliveryPhoto, deliverySignature } = req.body;

    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderDeliver(subOrderId, riderUserId, deliveryOtp, deliveryPhoto, deliverySignature, { ipAddress, deviceInfo });
    res.ok(result, "Delivery verification successful. Earnings credited.");
});

/**
 * Rider cancels a sub-order before pickup; returns it to the matching pool.
 *
 * @route POST /api/v1/delivery/sub-orders/:id/cancel
 * @access Protected (delivery rider)
 */
export const subOrderCancel = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const { reason } = req.body;

    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderCancelBeforePickup(subOrderId, riderUserId, reason || "Not specified", { ipAddress, deviceInfo });
    res.ok(result, "Rider cancelled delivery offer; order returned to matching pool");
});

/**
 * Returns the rider's active orders and live profile state for client resync.
 *
 * @route GET /api/v1/delivery/sync
 * @access Protected (delivery rider)
 */
export const sync = asyncHandler(async (req, res) => {
    const userId = (req as any).user._id.toString();
    const activeStatuses = [
        "RIDER_ASSIGNED",
        "RIDER_ARRIVING",
        "RIDER_REACHED_STORE",
        "PICKED_UP",
        "IN_TRANSIT",
        "NEAR_CUSTOMER",
    ];

    const activeOrders = await SubOrder.find({
        "delivery.riderId": new Types.ObjectId(userId),
        status: { $in: activeStatuses },
    })
        .populate("storeId parentOrderId")
        .sort({ "delivery.assignedAt": -1, updatedAt: -1 })
        .limit(25);

    const profile = await DeliveryBoy.findOne({ userId: new Types.ObjectId(userId) });

    res.ok({
        activeOrder: activeOrders[0] || null,
        activeOrders,
        profile: profile ? {
            isOnline: profile.isOnline,
            status: profile.status,
            wallet: profile.wallet,
            currentLocation: profile.currentLocation
        } : null
    }, "Delivery sync state fetched successfully");
});

/**
 * Lists approved returns available for any eligible rider to claim (pull model).
 *
 * @route GET /api/v1/delivery/return-tasks
 * @access Protected (delivery rider)
 */
export const returnTasks = asyncHandler(async (req, res) => {
    const tasks = await SubOrderService.listClaimableReturns((req as any).user._id.toString());
    res.ok(tasks, "Claimable return tasks fetched successfully");
});

/**
 * Rider claims an approved return pickup (race-safe; first rider wins).
 *
 * @route POST /api/v1/delivery/sub-orders/:id/return-claim
 * @access Protected (delivery rider)
 */
export const claimReturn = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderClaimReturn(subOrderId, riderUserId, { ipAddress, deviceInfo });
    res.ok(result, "Return pickup claimed successfully");
});

/**
 * Rider verifies return pickup from the customer (OTP + photo proof).
 *
 * @route POST /api/v1/delivery/sub-orders/:id/return-pickup
 * @access Protected (delivery rider)
 */
export const returnPickup = asyncHandler(async (req, res) => {
    const riderUserId = (req as any).user._id.toString();
    const subOrderId = req.params.id as string;
    const { returnOtp, proofPhoto } = returnPickupSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const result = await SubOrderService.riderReturnPickup(subOrderId, riderUserId, returnOtp, proofPhoto, { ipAddress, deviceInfo });
    res.ok(result, "Return pickup verified successfully");
});
