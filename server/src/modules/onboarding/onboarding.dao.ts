/**
 * Onboarding data-access layer.
 *
 * Encapsulates all persistence for the seller/rider onboarding flow: reading a user's
 * approved profiles and applications, creating applications, and provisioning Seller /
 * DeliveryBoy profiles on approval. Keeps Mongoose queries out of the service layer.
 */

import { Application, ApplicationStatus, ApplicationType } from "./onboarding.model";
import { Seller } from "../seller/seller.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { Types } from "mongoose";

/**
 * Loads a user's approved Seller and Rider profiles (if any) in parallel.
 *
 * @param userId - Owning user's id (string or ObjectId).
 * @returns Object with `seller` and `rider` documents (each `null` when absent).
 */
export async function findApprovedProfile(userId: string | Types.ObjectId) {
  const [seller, rider] = await Promise.all([
    Seller.findOne({ userId }),
    DeliveryBoy.findOne({ userId }),
  ]);
  return { seller, rider };
}

/**
 * Finds a user's currently active application (PENDING or APPROVED), if one exists.
 *
 * @param userId - Owning user's id (string or ObjectId).
 * @returns The active application document, or `null`.
 */
export async function findActiveApplication(userId: string | Types.ObjectId) {
  return await Application.findOne({
    userId,
    status: { $in: [ApplicationStatus.PENDING, ApplicationStatus.APPROVED] },
  });
}

/**
 * Persists a new onboarding application.
 *
 * @param data - Application payload (userId, type, documents, details).
 * @returns The created application document.
 */
export async function createApplication(data: any) {
  return await Application.create(data);
}

/**
 * Returns all of a user's applications, newest first.
 *
 * @param userId - Owning user's id (string or ObjectId).
 * @returns Array of application documents sorted by `createdAt` descending.
 */
export async function findMyApplications(userId: string | Types.ObjectId) {
  return await Application.find({ userId }).sort({ createdAt: -1 });
}

/**
 * Finds a single application by id with its owning user populated.
 *
 * @param applicationId - Application ObjectId (as string).
 * @returns The application document with `userId` populated, or `null`.
 */
export async function findApplicationById(applicationId: string) {
  return await Application.findById(applicationId).populate("userId");
}

/**
 * Finds all applications matching a filter (admin listing), with owner summary populated.
 *
 * @param filter - Mongoose filter (e.g. `{ status, type }`).
 * @returns Array of applications with `userId` populated to name/email/phone.
 */
export async function findAllApplications(filter: any) {
  return await Application.find(filter).populate("userId", "fullName email phone");
}

/**
 * Creates a Seller profile (on application approval).
 *
 * @param data - Seller profile payload.
 * @returns The created Seller document.
 */
export async function createSellerProfile(data: any) {
  return await Seller.create(data);
}

/**
 * Creates a DeliveryBoy (rider) profile (on application approval).
 *
 * @param data - Rider profile payload.
 * @returns The created DeliveryBoy document.
 */
export async function createRiderProfile(data: any) {
  return await DeliveryBoy.create(data);
}
