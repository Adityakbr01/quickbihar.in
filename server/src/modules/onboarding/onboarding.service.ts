import { ApiError } from "../../utils/ApiError";
import { MailService } from "../../utils/mail.service";
import * as rbacService from "../rbac/rbac.service";
import { RoleEnum } from "../rbac/rbac.types";
import { OnboardingDAO } from "./onboarding.dao";
import { ApplicationStatus, ApplicationType } from "./onboarding.model";

export class OnboardingService {
  static async apply(userId: string, data: any) {
    const { type, documents, details } = data;

    // 1. Check if user already has an APPROVED profile of ANY type
    const { seller, rider } = await OnboardingDAO.findApprovedProfile(userId);
    if (seller || rider) {
      const role = seller ? "Seller" : "Rider";
      throw new ApiError(400, `You are already registered as a ${role}. You cannot apply for another role.`);
    }

    // 2. Check if there's already ANY active (PENDING or APPROVED) application
    const activeApplication = await OnboardingDAO.findActiveApplication(userId);
    if (activeApplication) {
      const statusMsg = activeApplication.status === ApplicationStatus.PENDING ? "pending" : "already approved";
      throw new ApiError(400, `You already have a ${activeApplication.type} application that is ${statusMsg}. You cannot apply for another role.`);
    }

    return await OnboardingDAO.createApplication({
      userId,
      type,
      documents,
      details,
    });
  }

  static async getMyApplications(userId: string) {
    return await OnboardingDAO.findMyApplications(userId);
  }

  static async getAllApplications(status?: string, type?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    return await OnboardingDAO.findAllApplications(filter);
  }

  static async reviewApplication(applicationId: string, adminId: string, status: string, reason?: string) {
    const application = await OnboardingDAO.findApplicationById(applicationId);
    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApiError(400, "Application has already been reviewed");
    }

    application.status = status as ApplicationStatus;
    application.rejectionReason = reason;
    application.reviewedBy = adminId as any;
    application.reviewedAt = new Date();
    await application.save();

    const user = application.userId as any;

    if (status === ApplicationStatus.APPROVED) {
      // 0. Safety Check: Ensure they didn't get another role approved in the meantime
      const { seller, rider } = await OnboardingDAO.findApprovedProfile(user._id);
      if (seller || rider) {
        const role = seller ? "Seller" : "Rider";
        throw new ApiError(400, `This user is already registered as a ${role}. You cannot approve this application.`);
      }

      // 1. Assign Role
      const targetRoleName = application.type === ApplicationType.SELLER ? RoleEnum.SELLER : RoleEnum.DELIVERY;
      const role = await rbacService.getRoleByName(targetRoleName);
      if (role) {
        await rbacService.assignUserToRole(user._id.toString(), role._id.toString());
      }

      // 2. Create Profile
      const details = application.details instanceof Map ? Object.fromEntries(application.details) : application.details;
      const { location, ...otherDetails } = details;

      const profileData: any = {
        userId: user._id,
        status: "APPROVED",
        isVerified: true,
        ...otherDetails
      };

      if (location) {
        profileData.currentLocation = {
          type: "Point",
          coordinates: [location.lng, location.lat]
        };
      }

      if (application.type === ApplicationType.SELLER) {
        await OnboardingDAO.createSellerProfile({
          ...profileData,
          businessName: otherDetails.businessName || user.fullName,
          sellerType: otherDetails.sellerType,
        });
      } else if (application.type === ApplicationType.RIDER) {
        await OnboardingDAO.createRiderProfile(profileData);
      }
    }

    // Send email notification
    await MailService.sendApplicationStatus(user.email, status, reason);

    return application;
  }
}
