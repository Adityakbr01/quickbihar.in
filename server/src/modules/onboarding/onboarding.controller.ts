import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as OnboardingService from "./onboarding.service";

/**
 * Submits a new seller/rider onboarding application for the authenticated user.
 *
 * @route POST /api/v1/onboarding/apply
 * @access Protected
 */
export const apply = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const application = await OnboardingService.apply(userId, req.body);
  return res.status(201).json(new ApiResponse(201, application, "Application submitted successfully"));
});

/**
 * Lists the authenticated user's onboarding applications.
 *
 * @route GET /api/v1/onboarding/my-applications
 * @access Protected
 */
export const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const applications = await OnboardingService.getMyApplications(userId);
  return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully"));
});

/**
 * Returns the authenticated user's consolidated onboarding status.
 *
 * @route GET /api/v1/onboarding/status
 * @access Protected
 */
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const status = await OnboardingService.getStatus(userId);
  return res.status(200).json(new ApiResponse(200, status, "Onboarding status fetched successfully"));
});

/**
 * Uploads onboarding document files and returns their stored metadata.
 *
 * @route POST /api/v1/onboarding/documents
 * @access Protected
 */
export const uploadDocuments = asyncHandler(async (req: Request, res: Response) => {
  const documents = await OnboardingService.uploadDocuments((req as any).files || []);
  return res.status(201).json(new ApiResponse(201, documents, "Documents uploaded successfully"));
});

/**
 * Lists all onboarding applications for admin review (filterable by status/type).
 *
 * @route GET /api/v1/onboarding/admin/applications
 * @access Protected (admin)
 */
export const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
  const { status, type } = req.query;
  const applications = await OnboardingService.getAllApplications(status as string, type as string);
  return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully"));
});

/**
 * Reviews (approves/rejects) a pending onboarding application.
 *
 * @route PATCH /api/v1/onboarding/admin/applications/:applicationId/review
 * @access Protected (admin)
 */
export const reviewApplication = asyncHandler(async (req: Request, res: Response) => {
  const { applicationId } = req.params as { applicationId: string };
  const { status, reason } = req.body;
  const adminId = (req as any).user._id;

  const application = await OnboardingService.reviewApplication(applicationId, adminId, status, reason);
  return res.status(200).json(new ApiResponse(200, application, `Application ${status.toLowerCase()} successfully`));
});
