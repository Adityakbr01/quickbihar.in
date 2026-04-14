import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { paymentMethodService } from "./paymentMethod.service";

export class PaymentMethodController {
    static addPaymentMethod = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const result = await paymentMethodService.addPaymentMethod(userId, req.body);
        return res.status(201).json(new ApiResponse(201, result, "Payment method saved successfully"));
    });

    static getMyPaymentMethods = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const result = await paymentMethodService.getMyPaymentMethods(userId);
        return res.status(200).json(new ApiResponse(200, result, "Payment methods fetched successfully"));
    });

    static deletePaymentMethod = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const result = await paymentMethodService.deletePaymentMethod(req.params.id as unknown as string, userId);
        return res.status(200).json(new ApiResponse(200, result, "Payment method deleted successfully"));
    });

    static setDefaultPaymentMethod = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const result = await paymentMethodService.setDefaultPaymentMethod(req.params.id as unknown as string, userId);
        return res.status(200).json(new ApiResponse(200, result, "Default payment method set successfully"));
    });
};