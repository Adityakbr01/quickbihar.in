import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { deliveryLocationSchema, updateDeliveryStatusSchema } from "../order/order.validator";
import { deliveryService } from "./delivery.service";
import { SubOrderService } from "../order/subOrder.service";
import { ApiError } from "../../utils/ApiError";
import { Types } from "mongoose";
import { SubOrder } from "../order/subOrder.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { MatchingService } from "./matching.service";
import {
    deliveryEarningsSchema,
    deliveryHistorySchema,
    deliveryPayoutMethodSchema,
    deliveryPayoutRequestSchema,
    deliveryProfileUpdateSchema,
    listDeliveryOrdersSchema,
    listRidersSchema,
    updateAvailabilitySchema,
} from "./delivery.validation";

export class DeliveryController {
    static adminRiders = asyncHandler(async (req, res) => {
        const query = listRidersSchema.parse(req.query);
        const riders = await deliveryService.listAdminRiders(query);
        return res.status(200).json(new ApiResponse(200, riders, "Delivery riders fetched successfully"));
    });

    static matchingDiagnostics = asyncHandler(async (req, res) => {
        const diagnostics = await MatchingService.diagnostics(req.params.subOrderId as string);
        return res.status(200).json(new ApiResponse(200, diagnostics, "Matching diagnostics fetched successfully"));
    });

    static me = asyncHandler(async (req, res) => {
        const data = await deliveryService.getMyProfile((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, data, "Delivery profile fetched successfully"));
    });

    static dashboard = asyncHandler(async (req, res) => {
        const data = await deliveryService.getDashboard((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, data, "Delivery dashboard fetched successfully"));
    });

    static history = asyncHandler(async (req, res) => {
        const query = deliveryHistorySchema.parse(req.query);
        const data = await deliveryService.listHistory((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, data, "Delivery history fetched successfully"));
    });

    static earnings = asyncHandler(async (req, res) => {
        const query = deliveryEarningsSchema.parse(req.query);
        const data = await deliveryService.getEarnings((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, data, "Delivery earnings fetched successfully"));
    });

    static payouts = asyncHandler(async (req, res) => {
        const data = await deliveryService.listPayouts((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, data, "Delivery payouts fetched successfully"));
    });

    static addPayoutMethod = asyncHandler(async (req, res) => {
        const body = deliveryPayoutMethodSchema.parse(req.body);
        const data = await deliveryService.addPayoutMethod((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, data, "Payout method submitted successfully"));
    });

    static setDefaultPayoutMethod = asyncHandler(async (req, res) => {
        const data = await deliveryService.setDefaultPayoutMethod((req as any).user._id, req.params.methodId as string);
        return res.status(200).json(new ApiResponse(200, data, "Default payout method updated successfully"));
    });

    static requestPayout = asyncHandler(async (req, res) => {
        const body = deliveryPayoutRequestSchema.parse(req.body);
        const data = await deliveryService.createPayoutRequest((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, data, "Payout request submitted successfully"));
    });

    static updateProfile = asyncHandler(async (req, res) => {
        const body = deliveryProfileUpdateSchema.parse(req.body);
        const data = await deliveryService.updateProfile((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, data, "Delivery profile updated successfully"));
    });

    static updateAvailability = asyncHandler(async (req, res) => {
        const body = updateAvailabilitySchema.parse(req.body);
        const profile = await deliveryService.updateAvailability((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, profile, "Availability updated successfully"));
    });

    static orders = asyncHandler(async (req, res) => {
        const query = listDeliveryOrdersSchema.parse(req.query);
        const orders = await deliveryService.listMyOrders((req as any).user._id, query);
        return res.status(200).json(new ApiResponse(200, orders, "Delivery orders fetched successfully"));
    });

    static offers = asyncHandler(async (req, res) => {
        const offers = await deliveryService.listOffers((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, offers, "Open rider offers fetched successfully"));
    });

    static acceptOffer = asyncHandler(async (req, res) => {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";
        const result = await deliveryService.acceptOffer(
            (req as any).user._id,
            req.params.id as string,
            { ipAddress, deviceInfo },
        );
        return res.status(200).json(new ApiResponse(200, result, "Offer accepted successfully"));
    });

    static rejectOffer = asyncHandler(async (req, res) => {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";
        const result = await deliveryService.rejectOffer(
            (req as any).user._id,
            req.params.id as string,
            req.body?.reason || "Not specified",
            { ipAddress, deviceInfo },
        );
        return res.status(200).json(new ApiResponse(200, result, "Offer rejected successfully"));
    });

    static orderById = asyncHandler(async (req, res) => {
        const order = await deliveryService.getMyOrder((req as any).user._id, req.params.id as string);
        return res.status(200).json(new ApiResponse(200, order, "Delivery order fetched successfully"));
    });

    static updateOrderStatus = asyncHandler(async (req, res) => {
        const body = updateDeliveryStatusSchema.parse(req.body);
        const order = await deliveryService.updateOrderStatus((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, order, "Delivery status updated successfully"));
    });

    static updateOrderLocation = asyncHandler(async (req, res) => {
        const body = deliveryLocationSchema.parse(req.body);
        const order = await deliveryService.updateOrderLocation((req as any).user._id, req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, order, "Delivery location updated successfully"));
    });

    static acceptSubOrder = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.riderAcceptOrder(riderUserId, subOrderId, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Job offer accepted successfully"));
    });

    static subOrderArriving = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.riderArriving(subOrderId, riderUserId, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Status updated to ARRIVING successfully"));
    });

    static subOrderReachedStore = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const { latitude, longitude } = req.body;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            throw new ApiError(400, "Current GPS location coordinates (latitude, longitude) are required");
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.riderReachedStore(subOrderId, riderUserId, { latitude, longitude }, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Reached store checkpoint verified"));
    });

    static subOrderPickup = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const { pickupOtp, pickupPhoto } = req.body;

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.riderPickup(subOrderId, riderUserId, pickupOtp, pickupPhoto, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Store pickup verification successful"));
    });

    static subOrderTransit = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.startTransit(subOrderId, riderUserId, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Status updated to transit"));
    });

    static subOrderNearCustomer = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const { latitude, longitude } = req.body;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            throw new ApiError(400, "Current GPS location coordinates (latitude, longitude) are required");
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.riderNearCustomer(subOrderId, riderUserId, { latitude, longitude }, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Rider near customer checkpoint verified"));
    });

    static subOrderDeliver = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const { deliveryOtp, deliveryPhoto, deliverySignature } = req.body;

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.riderDeliver(subOrderId, riderUserId, deliveryOtp, deliveryPhoto, deliverySignature, { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Delivery verification successful. Earnings credited."));
    });

    static subOrderCancel = asyncHandler(async (req, res) => {
        const riderUserId = (req as any).user._id.toString();
        const subOrderId = req.params.id as string;
        const { reason } = req.body;

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.riderCancelBeforePickup(subOrderId, riderUserId, reason || "Not specified", { ipAddress, deviceInfo });
        return res.status(200).json(new ApiResponse(200, result, "Rider cancelled delivery offer; order returned to matching pool"));
    });

    static sync = asyncHandler(async (req, res) => {
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
        
        return res.status(200).json(new ApiResponse(200, {
            activeOrder: activeOrders[0] || null,
            activeOrders,
            profile: profile ? {
                isOnline: profile.isOnline,
                status: profile.status,
                wallet: profile.wallet,
                currentLocation: profile.currentLocation
            } : null
        }, "Delivery sync state fetched successfully"));
    });
}
