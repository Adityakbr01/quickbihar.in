import axiosInstance from "@/lib/axios";

export type PayoutMethodType = "BANK" | "UPI" | "PAYPAL" | "STRIPE_CONNECT";
export type PayoutMethodStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export interface SellerPayoutMethod {
  _id: string;
  type: PayoutMethodType;
  label?: string;
  status: PayoutMethodStatus;
  isDefault?: boolean;
  bank?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  };
  upi?: {
    upiId?: string;
  };
  paypal?: {
    email?: string;
  };
  stripeConnect?: {
    accountId?: string;
  };
  rejectionReason?: string;
}

export interface SellerSetupStatus {
  seller: {
    _id: string;
    userId: string;
    businessName?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    isVerified: boolean;
    sellerType?: string;
    mallId?: string;
    mallName?: string;
    mallUnit?: string;
    mallFloor?: string;
    mallRequest?: {
      mallId?: string;
      mallName?: string;
      mallUnit?: string;
      mallFloor?: string;
      message?: string;
      status?: "PENDING" | "APPROVED" | "REJECTED";
      requestedAt?: string;
      reviewedAt?: string;
      rejectionReason?: string;
    } | null;
    wallet: {
      availableBalance: number;
      pendingPayoutBalance: number;
      lifetimeEarnings: number;
    };
    payoutMethods: SellerPayoutMethod[];
  };
  store: {
    _id: string;
    name?: string;
    isActive?: boolean;
    isSetupComplete?: boolean;
    setupMissingFields?: string[];
  } | null;
  setup: {
    sellerApproved: boolean;
    storeExists: boolean;
    storeConfigured: boolean;
    storeMissingFields: string[];
    storeActive: boolean;
    hasVerifiedPayoutMethod: boolean;
    productsUnlocked: boolean;
    payoutsUnlocked: boolean;
    mallLinked: boolean;
    mallOptional: boolean;
  };
}

export interface SellerMallCreatePayload {
  name: string;
  description?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  contact?: {
    managerName?: string;
    email?: string;
  };
  logoUrl?: string;
  coverImageUrl?: string;
  logo?: File;
  coverImage?: File;
  images?: Array<{ url: string; fileId?: string }>;
  newImages?: File[];
  mallUnit?: string;
  mallFloor?: string;
  message?: string;
  mobileNumber?: string;
  isMobileVisible?: boolean;
}

const appendText = (formData: FormData, key: string, value?: string) => {
  if (value?.trim()) formData.append(key, value.trim());
};

export const buildSellerMallFormData = (payload: SellerMallCreatePayload | FormData) => {
  if (payload instanceof FormData) return payload;

  const formData = new FormData();
  appendText(formData, "name", payload.name);
  appendText(formData, "description", payload.description);
  appendText(formData, "logoUrl", payload.logoUrl);
  appendText(formData, "coverImageUrl", payload.coverImageUrl);
  appendText(formData, "mallUnit", payload.mallUnit);
  appendText(formData, "mallFloor", payload.mallFloor);
  appendText(formData, "message", payload.message);
  appendText(formData, "mobileNumber", payload.mobileNumber);
  if (payload.isMobileVisible !== undefined) {
    formData.append("isMobileVisible", String(payload.isMobileVisible));
  }
  
  if (payload.address) formData.append("address", JSON.stringify(payload.address));
  if (payload.contact) formData.append("contact", JSON.stringify(payload.contact));
  if (payload.images) formData.append("images", JSON.stringify(payload.images));
  
  if (payload.logo) formData.append("logo", payload.logo);
  if (payload.coverImage) formData.append("coverImage", payload.coverImage);
  
  if (payload.newImages && Array.isArray(payload.newImages)) {
    payload.newImages.forEach((file: File) => {
      formData.append("images", file);
    });
  }
  
  return formData;
};

export interface SellerPayoutMethodPayload {
  type: PayoutMethodType;
  label?: string;
  bank?: SellerPayoutMethod["bank"];
  upi?: SellerPayoutMethod["upi"];
  paypal?: SellerPayoutMethod["paypal"];
  stripeConnect?: SellerPayoutMethod["stripeConnect"];
}

export const sellerPanelApi = {
  getSetupStatus: async (): Promise<SellerSetupStatus> => {
    const response = await axiosInstance.get("/sellers/setup-status");
    return response.data.data;
  },

  requestMallConnection: async (payload: {
    mallId: string;
    mallUnit?: string;
    mallFloor?: string;
    message?: string;
  }) => {
    const response = await axiosInstance.post("/sellers/mall-request", payload);
    return response.data.data;
  },

  requestMallCreation: async (payload: SellerMallCreatePayload | FormData) => {
    const body = buildSellerMallFormData(payload);
    const response = await axiosInstance.post("/sellers/malls", body, {
      headers: body instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return response.data.data;
  },

  addPayoutMethod: async (payload: SellerPayoutMethodPayload): Promise<SellerPayoutMethod> => {
    const response = await axiosInstance.post("/sellers/payout-methods", payload);
    return response.data.data;
  },

  setDefaultPayoutMethod: async (methodId: string): Promise<SellerPayoutMethod[]> => {
    const response = await axiosInstance.patch(`/sellers/payout-methods/${methodId}/default`);
    return response.data.data;
  },

  requestPayout: async (payload: { amount: number; payoutMethodId: string; note?: string }) => {
    const response = await axiosInstance.post("/sellers/payout-requests", payload);
    return response.data.data;
  },

  getPublicMalls: async (): Promise<any[]> => {
    const response = await axiosInstance.get("/malls");
    return response.data.data;
  },
};
