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
  };
  mallUnit?: string;
  mallFloor?: string;
  message?: string;
}

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

  requestMallCreation: async (payload: SellerMallCreatePayload) => {
    const response = await axiosInstance.post("/sellers/malls", payload);
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
};
