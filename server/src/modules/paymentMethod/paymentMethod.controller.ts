/**
 * Payment-method HTTP controllers.
 *
 * `asyncHandler`-wrapped Express handlers that resolve the acting user from the request and
 * delegate all persistence logic to `paymentMethodService`, owning only response shaping.
 */
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as paymentMethodService from "./paymentMethod.service";

/** POST / — save a new payment method for the authenticated user. */
export const addPaymentMethod = asyncHandler(async (req, res) => {
    const userId = (req as any).user._id;
    const result = await paymentMethodService.addPaymentMethod(userId, req.body);
    return res.status(201).json(new ApiResponse(201, result, "Payment method saved successfully"));
});

/** GET / — list the authenticated user's saved payment methods. */
export const getMyPaymentMethods = asyncHandler(async (req, res) => {
    const userId = (req as any).user._id;
    const result = await paymentMethodService.getMyPaymentMethods(userId);
    return res.status(200).json(new ApiResponse(200, result, "Payment methods fetched successfully"));
});

/** DELETE /:id — remove one of the user's payment methods. */
export const deletePaymentMethod = asyncHandler(async (req, res) => {
    const userId = (req as any).user._id;
    const result = await paymentMethodService.deletePaymentMethod(req.params.id as unknown as string, userId);
    return res.status(200).json(new ApiResponse(200, result, "Payment method deleted successfully"));
});

/** PATCH /:id/default — mark one of the user's methods as the default. */
export const setDefaultPaymentMethod = asyncHandler(async (req, res) => {
    const userId = (req as any).user._id;
    const result = await paymentMethodService.setDefaultPaymentMethod(req.params.id as unknown as string, userId);
    return res.status(200).json(new ApiResponse(200, result, "Default payment method set successfully"));
});
