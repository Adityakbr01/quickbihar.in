/**
 * Onboarding service.
 *
 * Business logic for seller/rider onboarding: submitting applications (with one-active-role
 * guarding), listing a user's applications and status, uploading supporting documents to
 * ImageKit, and the admin review flow that — on approval — assigns the RBAC role, provisions
 * the Seller/Rider profile, and emails the applicant. Persistence is delegated to `OnboardingDAO`.
 */

import { ApiError } from "@/utils/ApiError";
import { uploadToImageKit } from "@/utils/imagekit.util";
import { MailService } from "@/utils/mail.service";
import { formatGeoJsonPoint } from "@/utils/geo.util";
import * as rbacService from "@/modules/common/rbac/rbac.service";
import { RoleEnum } from "@/modules/common/rbac/rbac.types";
import * as OnboardingDAO from "./onboarding.dao";
import { ApplicationStatus, ApplicationType } from "./onboarding.model";
import { Store } from "@/modules/common/store/store.model";

import { User } from "@/modules/common/user/user.model";

/**
 * Submits a new onboarding application for a user.
 * Rejects the request if:
 * 1. The user already holds an approved Seller/Rider profile.
 * 2. The user has any active (PENDING/APPROVED) application — a user may only ever hold one role.
 * 3. The applicant's phone number is already associated with an approved partner profile or
 *    active (PENDING/APPROVED) application across ANY account.
 *
 * @param userId - Applicant user's id.
 * @param data - Application payload: `type`, `documents`, and `details`.
 * @returns The created application document.
 * @throws {ApiError} 400 if the user or phone number is already registered or has an active application.
 */
export async function apply(userId: string, data: any) {
  const { type, documents, details } = data;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  // 1. Check if user already has an APPROVED profile of ANY type
  const { seller, rider } = await OnboardingDAO.findApprovedProfile(userId);
  if (seller || rider) {
    const role = seller ? "Seller" : "Rider";
    throw new ApiError(400, `You are already registered as a ${role}. Each account can only hold one partner role.`);
  }

  // 2. Check if there's already ANY active (PENDING or APPROVED) application for this account
  const activeApplication = await OnboardingDAO.findActiveApplication(userId);
  if (activeApplication) {
    const statusMsg = activeApplication.status === ApplicationStatus.PENDING ? "pending review" : "approved";
    throw new ApiError(400, `You already have a ${activeApplication.type} application that is ${statusMsg}. Each account can only hold one partner role.`);
  }

  // 3. Resolve & validate applicant phone number
  const cleanPhone = (details?.phone || user.phone || "").trim().replace(/[\s\-()]/g, "");
  if (!cleanPhone) {
    throw new ApiError(400, "Mobile number is required for partner onboarding.");
  }

  // If applicant phone is new/different, check uniqueness and sync to user
  if (user.phone !== cleanPhone) {
    const phoneOccupied = await User.findOne({ phone: cleanPhone, _id: { $ne: userId } });
    if (phoneOccupied) {
      throw new ApiError(400, "This phone number is already linked to another account.");
    }
    user.phone = cleanPhone;
    await user.save();
  }

  // 4. Partner Phone Collision Guard:
  // Ensure the phone number is not linked to an approved partner or active (PENDING/APPROVED) application
  const usersWithPhone = await User.find({ phone: cleanPhone }).select("_id email");
  const phoneUserIds = usersWithPhone.map((u) => u._id);

  // Check if any account with this phone has an approved Seller or Rider profile
  const { seller: phoneSeller, rider: phoneRider } = await OnboardingDAO.findApprovedProfilesByUserIds(phoneUserIds);
  if (phoneSeller || phoneRider) {
    const role = phoneSeller ? "Seller" : "Rider";
    throw new ApiError(400, `This phone number is already linked to an approved ${role} partner account. A phone number cannot be used for multiple partner accounts.`);
  }

  // Check if any account with this phone has an active (PENDING or APPROVED) partner application
  const existingAppWithPhone = await OnboardingDAO.findActiveApplicationByPhoneOrUserIds(cleanPhone, phoneUserIds);
  if (existingAppWithPhone && existingAppWithPhone.userId.toString() !== userId.toString()) {
    const statusMsg = existingAppWithPhone.status === ApplicationStatus.PENDING ? "pending review" : "approved";
    throw new ApiError(400, `This phone number is already linked to a ${existingAppWithPhone.type} application that is ${statusMsg}. A phone number cannot be used for multiple partner accounts.`);
  }

  return await OnboardingDAO.createApplication({
    userId,
    type,
    documents,
    details: {
      ...details,
      phone: cleanPhone,
    },
  });
}

/**
 * Returns all applications belonging to a user, newest first.
 *
 * @param userId - Owning user's id.
 * @returns Array of application documents.
 */
export async function getMyApplications(userId: string) {
  return await OnboardingDAO.findMyApplications(userId);
}

/**
 * Returns a consolidated onboarding status snapshot for a user.
 * Combines the user's applications with their approved profiles and surfaces the latest
 * seller/rider application for quick client rendering.
 *
 * @param userId - Owning user's id.
 * @returns Object with `applications`, `sellerProfile`, `riderProfile`,
 *          `latestSellerApplication`, and `latestRiderApplication`.
 */
export async function getStatus(userId: string) {
  const [applications, approvedProfiles] = await Promise.all([
    OnboardingDAO.findMyApplications(userId),
    OnboardingDAO.findApprovedProfile(userId),
  ]);

  return {
    applications,
    sellerProfile: approvedProfiles.seller,
    riderProfile: approvedProfiles.rider,
    latestSellerApplication: applications.find((item: any) => item.type === ApplicationType.SELLER) || null,
    latestRiderApplication: applications.find((item: any) => item.type === ApplicationType.RIDER) || null,
  };
}

/**
 * Uploads onboarding document files to ImageKit and returns their metadata.
 *
 * @param files - Multer files to upload. Defaults to an empty array.
 * @returns Array of `{ name, url, fileId }` for each uploaded document.
 * @throws {ApiError} 400 if no files are provided.
 */
export async function uploadDocuments(files: Express.Multer.File[] = []) {
  if (!files.length) {
    throw new ApiError(400, "At least one document file is required");
  }

  const uploads = await Promise.all(
    files.map(async (file) => {
      const upload = await uploadToImageKit(file.buffer, file.originalname, "onboarding-documents");
      return {
        name: file.originalname,
        url: upload.url,
        fileId: upload.fileId,
      };
    }),
  );

  return uploads;
}

/**
 * Lists all applications for admin review, optionally filtered by status and/or type.
 *
 * @param status - Optional application status filter.
 * @param type - Optional application type filter.
 * @returns Array of applications with owner summary populated.
 */
export async function getAllApplications(status?: string, type?: string) {
  const filter: any = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  return await OnboardingDAO.findAllApplications(filter);
}

/**
 * Admin decision on a pending application. On APPROVED, re-checks role uniqueness, assigns
 * the appropriate RBAC role, provisions the Seller/Rider profile (mapping location and any
 * mall request), and emails the applicant either way.
 *
 * @param applicationId - Application ObjectId (as string).
 * @param adminId - Reviewing admin's user id (recorded on the application).
 * @param status - New status (e.g. APPROVED / REJECTED).
 * @param reason - Optional rejection reason, included in the notification email.
 * @returns The updated application document.
 * @throws {ApiError} 404 if the application does not exist.
 * @throws {ApiError} 400 if the application was already reviewed, or the user gained a
 *                     conflicting approved role before this approval.
 */
export async function reviewApplication(applicationId: string, adminId: string, status: string, reason?: string) {
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
    const { location, mallRequest, ...otherDetails } = details;

    const profileData: any = {
      userId: user._id,
      status: "APPROVED",
      isVerified: true,
      ...otherDetails
    };

    profileData.currentLocation = formatGeoJsonPoint(location);

    if (mallRequest?.mallId) {
      profileData.mallRequest = {
        ...mallRequest,
        status: "PENDING",
        requestedAt: new Date(),
      };
    }

    if (application.type === ApplicationType.SELLER) {
      await OnboardingDAO.createSellerProfile({
        ...profileData,
        businessName: otherDetails.businessName || user.fullName,
        sellerType: otherDetails.sellerType,
      });

      const existingStore = await Store.findOne({ sellerId: user._id });
      if (!existingStore) {
        const addr = otherDetails.address || {};
        await Store.create({
          sellerId: user._id,
          name: otherDetails.businessName || user.fullName || "My Store",
          type: otherDetails.sellerType || "CLOTHING",
          address: {
            line1: addr.address || addr.line1 || "Main Street",
            city: addr.city || "Patna",
            state: addr.state || "Bihar",
            pincode: addr.pincode || addr.postalCode || "800001",
            postalCode: addr.pincode || addr.postalCode || "800001",
            country: "India",
          },
          contact: {
            email: user.email,
            phone: user.phone,
          },
          currentLocation: profileData.currentLocation || {
            type: "Point",
            coordinates: [85.1376, 25.5941],
          },
          deliveryConfig: {
            shippingFee: 0,
            freeShippingThreshold: 0,
            deliveryAreas: [addr.city || "Local Area"],
          },
          seo: {
            storeTitle: otherDetails.businessName || user.fullName,
            metaTitle: otherDetails.businessName || user.fullName,
            metaDescription: `Welcome to ${otherDetails.businessName || user.fullName}`,
          },
          isOpen: true,
          isActive: true,
          isVerified: true,
          isSetupComplete: true,
          setupCompletedAt: new Date(),
        });
      }
    } else if (application.type === ApplicationType.RIDER) {
      await OnboardingDAO.createRiderProfile(profileData);
    }
  }

  // Send email notification
  await MailService.sendApplicationStatus(user.email, status, reason);

  return application;
}
