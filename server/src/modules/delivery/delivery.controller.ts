import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { deliveryLocationSchema, updateDeliveryStatusSchema } from "../order/order.validator";
import { deliveryService } from "./delivery.service";
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
}
