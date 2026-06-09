import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AdminService } from "./admin.service";
import {
    blockUserSchema,
    assignSellerMallSchema,
    createMallSchema,
    createPayoutSchema,
    inviteUserSchema,
    listPayoutMethodsSchema,
    listPeopleSchema,
    reviewMallCreationSchema,
    reviewMallRequestSchema,
    reviewPayoutMethodSchema,
    updatePayoutStatusSchema,
    updateMallSchema,
    updatePartnerStatusSchema,
} from "./admin.validation";

export class AdminController {
    static managementCatalog = asyncHandler(async (_req, res) => {
        const catalog = AdminService.getManagementCatalog();
        return res.status(200).json(new ApiResponse(200, catalog, "Admin management catalog fetched successfully"));
    });

    static dashboard = asyncHandler(async (_req, res) => {
        const data = await AdminService.getDashboard();
        return res.status(200).json(new ApiResponse(200, data, "Admin dashboard fetched successfully"));
    });

    static people = asyncHandler(async (req, res) => {
        const query = listPeopleSchema.parse(req.query);
        const people = await AdminService.listPeople(query);
        return res.status(200).json(new ApiResponse(200, people, "People fetched successfully"));
    });

    static blockUser = asyncHandler(async (req, res) => {
        const body = blockUserSchema.parse(req.body);
        const user = await AdminService.setUserBlocked(req.params.id as string, body.isBlocked);
        return res
            .status(200)
            .json(new ApiResponse(200, user, `User ${body.isBlocked ? "blocked" : "unblocked"} successfully`));
    });

    static updatePartnerStatus = asyncHandler(async (req, res) => {
        const body = updatePartnerStatusSchema.parse(req.body);
        const profile = await AdminService.updatePartnerStatus(req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, profile, "Partner status updated successfully"));
    });

    static invite = asyncHandler(async (req, res) => {
        const body = inviteUserSchema.parse(req.body);
        const invite = await AdminService.sendInvite((req as any).user._id, body);
        return res.status(200).json(new ApiResponse(200, invite, "Invite sent successfully"));
    });

    static payouts = asyncHandler(async (_req, res) => {
        const payouts = await AdminService.listPayouts();
        return res.status(200).json(new ApiResponse(200, payouts, "Payouts fetched successfully"));
    });

    static createPayout = asyncHandler(async (req, res) => {
        const body = createPayoutSchema.parse(req.body);
        const payout = await AdminService.createPayout((req as any).user._id, body);
        return res.status(201).json(new ApiResponse(201, payout, "Payout recorded successfully"));
    });

    static updatePayoutStatus = asyncHandler(async (req, res) => {
        const body = updatePayoutStatusSchema.parse(req.body);
        const payout = await AdminService.updatePayoutStatus(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, payout, "Payout status updated successfully"));
    });

    static payoutMethods = asyncHandler(async (req, res) => {
        const query = listPayoutMethodsSchema.parse(req.query);
        const methods = await AdminService.listPayoutMethods(query);
        return res.status(200).json(new ApiResponse(200, methods, "Payout methods fetched successfully"));
    });

    static reviewPayoutMethod = asyncHandler(async (req, res) => {
        const body = reviewPayoutMethodSchema.parse(req.body);
        const method = await AdminService.reviewPayoutMethod(
            req.params.sellerId as string,
            req.params.methodId as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, method, "Payout method reviewed successfully"));
    });

    static malls = asyncHandler(async (_req, res) => {
        const malls = await AdminService.listMalls();
        return res.status(200).json(new ApiResponse(200, malls, "Malls fetched successfully"));
    });

    static mallRequests = asyncHandler(async (_req, res) => {
        const requests = await AdminService.listMallRequests();
        return res.status(200).json(new ApiResponse(200, requests, "Mall requests fetched successfully"));
    });

    static mallCreationRequests = asyncHandler(async (_req, res) => {
        const requests = await AdminService.listMallCreationRequests();
        return res.status(200).json(new ApiResponse(200, requests, "Mall creation requests fetched successfully"));
    });

    static createMall = asyncHandler(async (req, res) => {
        const body = createMallSchema.parse(req.body);
        const mall = await AdminService.createMall(body);
        return res.status(201).json(new ApiResponse(201, mall, "Mall created successfully"));
    });

    static updateMall = asyncHandler(async (req, res) => {
        const body = updateMallSchema.parse(req.body);
        const mall = await AdminService.updateMall(req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, mall, "Mall updated successfully"));
    });

    static reviewMallCreation = asyncHandler(async (req, res) => {
        const body = reviewMallCreationSchema.parse(req.body);
        const mall = await AdminService.reviewMallCreationRequest(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, mall, "Mall creation request reviewed successfully"));
    });

    static deleteMall = asyncHandler(async (req, res) => {
        const mall = await AdminService.deleteMall(req.params.id as string);
        return res.status(200).json(new ApiResponse(200, mall, "Mall deactivated successfully"));
    });

    static assignSellerMall = asyncHandler(async (req, res) => {
        const body = assignSellerMallSchema.parse(req.body);
        const seller = await AdminService.assignSellerToMall(req.params.id as string, body);
        return res.status(200).json(new ApiResponse(200, seller, "Seller mall assignment updated successfully"));
    });

    static reviewMallRequest = asyncHandler(async (req, res) => {
        const body = reviewMallRequestSchema.parse(req.body);
        const seller = await AdminService.reviewMallRequest(
            req.params.id as string,
            (req as any).user._id,
            body,
        );
        return res.status(200).json(new ApiResponse(200, seller, "Seller mall request reviewed successfully"));
    });
}
