import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { orderService } from "./order.service";
import { createOrderSchema, verifyPaymentSchema } from "./order.validator";

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
        const result = await orderService.getAdminOrders();

        return res.status(200).json(
            new ApiResponse(200, result, "Admin orders fetched successfully")
        );
    });

    static adminUpdateOrderStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, cancellationReason } = req.body;
        console.log(`[OrderController] Admin updating order ${id} to ${status}`);
        
        const result = await orderService.adminUpdateOrderStatus(id as string, status, cancellationReason);

        return res.status(200).json(
            new ApiResponse(200, result, "Order status updated successfully")
        );
    });
}
