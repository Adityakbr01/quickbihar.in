import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { savedAddressService } from "./savedAddresses.service";
import { addressSchema, updateAddressSchema } from "./savedAddresses.validation";

export class SavedAddressController {
    static createAddress = asyncHandler(async (req, res) => {
        const validatedData = addressSchema.parse(req.body);
        const result = await savedAddressService.createAddress((req as any).user._id, validatedData);
        return res.status(201).json(new ApiResponse(201, result, "Address saved successfully"));
    });

    static getMyAddresses = asyncHandler(async (req, res) => {
        const result = await savedAddressService.getUserAddresses((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, result, "Addresses fetched successfully"));
    });

    static updateAddress = asyncHandler(async (req, res) => {
        const validatedData = updateAddressSchema.parse(req.body);
        const result = await savedAddressService.updateAddress(req.params.id as unknown as string, (req as any).user._id, validatedData);
        return res.status(200).json(new ApiResponse(200, result, "Address updated successfully"));
    });

    static deleteAddress = asyncHandler(async (req, res) => {
        const result = await savedAddressService.deleteAddress(req.params.id as unknown as string, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, result, "Address deleted successfully"));
    });

    static setDefaultAddress = asyncHandler(async (req, res) => {
        const result = await savedAddressService.setDefaultAddress(req.params.id as unknown as string, (req as any).user._id);
        return res.status(200).json(new ApiResponse(200, result, "Default address set successfully"));
    });
}
