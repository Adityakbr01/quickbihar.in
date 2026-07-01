/**
 * Saved-address HTTP controllers.
 *
 * Validates the request body with Zod, pulls the authenticated user id off `req.user`,
 * and delegates to `savedAddressService`. Zod failures propagate to the global handler.
 */
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as savedAddressService from "./savedAddresses.service";
import { addressSchema, updateAddressSchema } from "./savedAddresses.validation";

/** POST / — save a new address for the current user. */
export const createAddress = asyncHandler(async (req, res) => {
    const validatedData = addressSchema.parse(req.body);
    const result = await savedAddressService.createAddress((req as any).user._id, validatedData);
    return res.status(201).json(new ApiResponse(201, result, "Address saved successfully"));
});

/** GET / — list the current user's addresses. */
export const getMyAddresses = asyncHandler(async (req, res) => {
    const result = await savedAddressService.getUserAddresses((req as any).user._id);
    return res.status(200).json(new ApiResponse(200, result, "Addresses fetched successfully"));
});

/** PATCH /:id — update one of the current user's addresses. */
export const updateAddress = asyncHandler(async (req, res) => {
    const validatedData = updateAddressSchema.parse(req.body);
    const result = await savedAddressService.updateAddress(req.params.id as unknown as string, (req as any).user._id, validatedData);
    return res.status(200).json(new ApiResponse(200, result, "Address updated successfully"));
});

/** DELETE /:id — remove one of the current user's addresses. */
export const deleteAddress = asyncHandler(async (req, res) => {
    const result = await savedAddressService.deleteAddress(req.params.id as unknown as string, (req as any).user._id);
    return res.status(200).json(new ApiResponse(200, result, "Address deleted successfully"));
});

/** PATCH /:id/default — mark one of the current user's addresses as default. */
export const setDefaultAddress = asyncHandler(async (req, res) => {
    const result = await savedAddressService.setDefaultAddress(req.params.id as unknown as string, (req as any).user._id);
    return res.status(200).json(new ApiResponse(200, result, "Default address set successfully"));
});
