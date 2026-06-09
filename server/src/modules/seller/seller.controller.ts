import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { SellerService } from "./seller.service";
import {
    createMallRequestSchema,
    payoutMethodSchema,
    payoutRequestSchema,
    requestMallSchema,
} from "./seller.validation";

export class SellerController {
    static setupStatus = asyncHandler(async (req, res) => {
        const setup = await SellerService.getSetupStatus((req as any).user._id);
        return res.status(200).json(new ApiResponse(200, setup, "Seller setup status fetched successfully"));
    });

    static requestMallConnection = asyncHandler(async (req, res) => {
        const body = requestMallSchema.parse(req.body);
        const seller = await SellerService.requestMallConnection((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, seller, "Mall connection request submitted successfully"));
    });

    static requestMallCreation = asyncHandler(async (req, res) => {
        const body = createMallRequestSchema.parse(req.body);
        const mall = await SellerService.requestMallCreation((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, mall, "Mall creation request submitted successfully"));
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
}
