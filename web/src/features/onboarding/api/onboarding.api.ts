import axiosInstance from "@/lib/axios";

export type ApplicationType = "SELLER" | "RIDER";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OnboardingDocument {
  name: string;
  url: string;
  fileId: string;
}

export interface OnboardingApplication {
  _id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt?: string;
  reviewedAt?: string;
}

export interface OnboardingStatus {
  applications: OnboardingApplication[];
  sellerProfile?: unknown | null;
  riderProfile?: unknown | null;
  latestSellerApplication?: OnboardingApplication | null;
  latestRiderApplication?: OnboardingApplication | null;
}

export interface SellerApplicationPayload {
  type: "SELLER";
  documents: OnboardingDocument[];
  details: {
    businessName: string;
    sellerType: "CLOTHING";
    gstNumber?: string;
    bankDetails?: {
      accountNumber: string;
      ifsc: string;
      bankName: string;
      pan: string;
      upi?: string;
      aadhar: string;
    };
    address?: {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
}

export interface RiderApplicationPayload {
  type: "RIDER";
  documents: OnboardingDocument[];
  details: {
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    location: {
      lat: number;
      lng: number;
    };
    bankDetails?: {
      accountNumber: string;
      ifsc: string;
      bankName: string;
      pan: string;
      upi?: string;
      aadhar: string;
    };
    address?: {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
}

export const onboardingApi = {
  status: async (): Promise<OnboardingStatus> => {
    const response = await axiosInstance.get("/onboarding/status");
    return response.data.data;
  },

  uploadDocuments: async (files: File[]): Promise<OnboardingDocument[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("documents", file));
    const response = await axiosInstance.post("/onboarding/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  apply: async (payload: SellerApplicationPayload | RiderApplicationPayload): Promise<OnboardingApplication> => {
    const response = await axiosInstance.post("/onboarding/apply", payload);
    return response.data.data;
  },
};
