import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { orderService } from "./order.service";
import { adminOrderStatusSchema, assignDeliverySchema, createOrderSchema, verifyPaymentSchema } from "./order.validator";
import { SubOrderService } from "./subOrder.service";
import { ApiError } from "../../utils/ApiError";

export class OrderController {
    static createOrder = asyncHandler(async (req, res) => {
        const validatedData = createOrderSchema.parse(req.body);
        const result = await orderService.createOrder((req as any).user._id, validatedData);

        return res.status(201).json(
            new ApiResponse(201, result, "Order initiated successfully")
        );
    });

    static verifyPayment = asyncHandler(async (req, res) => {
        const validatedData = verifyPaymentSchema.parse(req.body);
        const result = await orderService.verifyPayment(validatedData);

        return res.status(200).json(
            new ApiResponse(200, result, "Payment verified and order confirmed")
        );
    });

    static getMyOrders = asyncHandler(async (req, res) => {
        const result = await orderService.getMyOrders((req as any).user._id);

        return res.status(200).json(
            new ApiResponse(200, result, "Orders fetched successfully")
        );
    });

    static getOrderById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await orderService.getOrderById((req as any).user._id, id as string);

        return res.status(200).json(
            new ApiResponse(200, result, "Order details fetched successfully")
        );
    });

    static getAdminOrders = asyncHandler(async (req, res) => {
        const result = await orderService.getAdminOrders(req.query);

        return res.status(200).json(
            new ApiResponse(200, result, "Admin orders fetched successfully")
        );
    });

    static adminUpdateOrderStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, cancellationReason } = adminOrderStatusSchema.parse(req.body);
        console.log(`[OrderController] Admin updating order ${id} to ${status}`);
        
        const result = await orderService.adminUpdateOrderStatus(id as string, status, cancellationReason);

        return res.status(200).json(
            new ApiResponse(200, result, "Order status updated successfully")
        );
    });

    static assignDeliveryPartner = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const body = assignDeliverySchema.parse(req.body);
        const result = await orderService.assignDeliveryPartner(id as string, body, (req as any).user._id);

        return res.status(200).json(
            new ApiResponse(200, result, "Delivery partner assigned successfully")
        );
    });

    static unassignDeliveryPartner = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await orderService.unassignDeliveryPartner(id as string, (req as any).user._id);

        return res.status(200).json(
            new ApiResponse(200, result, "Delivery partner unassigned successfully")
        );
    });

    static getSubOrderDetails = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const subOrder = await SubOrderService.getSubOrderById(id as string);
        
        const userId = (req as any).user._id.toString();
        const userRole = (req as any).user.roleId?.name || (req as any).user.role || "";
        const parentOrder = subOrder.parentOrderId as any;
        const isCustomer = parentOrder?.userId?.toString() === userId;
        const isSeller = subOrder.sellerId?.toString() === userId;
        const isRider = subOrder.delivery?.riderId?.toString() === userId;
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

        if (!isCustomer && !isSeller && !isRider && !isAdmin) {
            throw new ApiError(403, "You do not have permission to view this sub-order");
        }

        return res.status(200).json(
            new ApiResponse(200, subOrder, "Sub-order details fetched successfully")
        );
    });

    static cancelSubOrder = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user._id.toString();

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.customerRequestCancellation(id as string, userId, reason || "No reason specified", { ipAddress, deviceInfo });
        return res.status(200).json(
            new ApiResponse(200, result, result.message)
        );
    });

    static returnSubOrder = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user._id.toString();

        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.customerRequestReturn(
            id as string,
            userId,
            reason || "No reason specified",
            { ipAddress, deviceInfo },
        );

        return res.status(201).json(
            new ApiResponse(201, result, "Return request created successfully")
        );
    });

    static getAdminSubOrders = asyncHandler(async (req, res) => {
        const result = await SubOrderService.listAdminSubOrders(req.query);
        return res.status(200).json(
            new ApiResponse(200, result, "Admin sub-orders fetched successfully")
        );
    });

    static adminAssignRider = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { riderUserId } = req.body;
        const adminUserId = (req as any).user._id.toString();
        
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.adminManualAssignRider(
            id as string,
            riderUserId,
            { actorId: adminUserId, ipAddress, deviceInfo }
        );

        return res.status(200).json(
            new ApiResponse(200, result, "Rider manually assigned to sub-order successfully")
        );
    });

    static adminSettleCod = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const adminUserId = (req as any).user._id.toString();
        
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        const result = await SubOrderService.adminConfirmCodDeposit(
            id as string,
            adminUserId,
            { actorId: adminUserId, ipAddress, deviceInfo }
        );

        return res.status(200).json(
            new ApiResponse(200, result, "COD liability settled successfully")
        );
    });
}
