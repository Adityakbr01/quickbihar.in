import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { OnboardingService } from "./onboarding.service";

export class OnboardingController {
  static apply = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const application = await OnboardingService.apply(userId, req.body);
    return res.status(201).json(new ApiResponse(201, application, "Application submitted successfully"));
  });

  static getMyApplications = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const applications = await OnboardingService.getMyApplications(userId);
    return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully"));
  });

  static getAllApplications = asyncHandler(async (req: Request, res: Response) => {
    const { status, type } = req.query;
    const applications = await OnboardingService.getAllApplications(status as string, type as string);
    return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully"));
  });

  static reviewApplication = asyncHandler(async (req: Request, res: Response) => {
    const { applicationId } = req.params as { applicationId: string };
    const { status, reason } = req.body;
    const adminId = (req as any).user._id;

    const application = await OnboardingService.reviewApplication(applicationId, adminId, status, reason);
    return res.status(200).json(new ApiResponse(200, application, `Application ${status.toLowerCase()} successfully`));
  });
}
