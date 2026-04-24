import { Application, ApplicationStatus, ApplicationType } from "./onboarding.model";
import { Seller } from "../seller/seller.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { Types } from "mongoose";

export class OnboardingDAO {
  static async findApprovedProfile(userId: string | Types.ObjectId) {
    const [seller, rider] = await Promise.all([
      Seller.findOne({ userId }),
      DeliveryBoy.findOne({ userId }),
    ]);
    return { seller, rider };
  }

  static async findActiveApplication(userId: string | Types.ObjectId) {
    return await Application.findOne({
      userId,
      status: { $in: [ApplicationStatus.PENDING, ApplicationStatus.APPROVED] },
    });
  }

  static async createApplication(data: any) {
    return await Application.create(data);
  }

  static async findMyApplications(userId: string | Types.ObjectId) {
    return await Application.find({ userId });
  }

  static async findApplicationById(applicationId: string) {
    return await Application.findById(applicationId).populate("userId");
  }

  static async findAllApplications(filter: any) {
    return await Application.find(filter).populate("userId", "fullName email phone");
  }

  static async createSellerProfile(data: any) {
    return await Seller.create(data);
  }

  static async createRiderProfile(data: any) {
    return await DeliveryBoy.create(data);
  }
}
