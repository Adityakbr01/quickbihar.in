import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { MallService } from "./mall.service";

export class MallController {
    static listPublic = asyncHandler(async (_req, res) => {
        const malls = await MallService.listPublicMalls();
        return res.status(200).json(new ApiResponse(200, malls, "Malls fetched successfully"));
    });

    static top = asyncHandler(async (_req, res) => {
        const malls = await MallService.getTopMalls(10);
        return res.status(200).json(new ApiResponse(200, malls, "Top malls fetched successfully"));
    });

    static getDetail = asyncHandler(async (req, res) => {
        const data = await MallService.getMallDetail(req.params.id as string);
        console.log("[SERVER_DEBUG] Mall details response data:", JSON.stringify(data, null, 2));
        return res.status(200).json(new ApiResponse(200, data, "Mall details fetched successfully"));
    });

    static postReview = asyncHandler(async (req, res) => {
        const { rating, comment } = req.body;
        const review = await MallService.postMallReview(req.params.id as string, (req as any).user._id, { rating, comment });
        return res.status(200).json(new ApiResponse(200, review, "Review submitted successfully"));
    });
}
