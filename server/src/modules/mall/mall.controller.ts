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
}
