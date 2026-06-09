import axiosInstance from "@/lib/axios";

export type AdminRole = "USER" | "SELLER" | "DELIVERY" | "ADMIN" | "SUPER_ADMIN";
export type PartnerType = "SELLER" | "DELIVERY";
export type PartnerStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";
export type ManagementStatus = "ACTIVE" | "PARTIAL" | "PLANNED";

export interface PartnerProfile {
  status: PartnerStatus;
  isVerified: boolean;
  businessName?: string;
  sellerType?: string;
  gstNumber?: string;
  mallId?: string;
  mallName?: string;
  mallUnit?: string;
  mallFloor?: string;
  mallRequest?: SellerMallRequest["request"] | null;
  payoutMethodsSummary?: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  wallet?: {
    availableBalance: number;
    pendingPayoutBalance: number;
    lifetimeEarnings: number;
  };
  isOnline?: boolean;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}

export interface ManagedPerson {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: AdminRole;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt?: string;
  sellerProfile?: PartnerProfile | null;
  deliveryProfile?: PartnerProfile | null;
}

export interface DashboardStats {
  totalUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  sellers: number;
  deliveryBoys: number;
  pendingPartners: number;
  pendingPayouts: number;
  totalPaid: number;
  malls: number;
  activeMalls: number;
  mallLinkedSellers: number;
  pendingMallRequests: number;
  pendingMallCreations?: number;
  pendingPayoutMethods?: number;
}

export interface Payout {
  _id: string;
  partnerId: ManagedPerson | { fullName: string; email: string; _id: string };
  partnerType: PartnerType;
  amount: number;
  status: PayoutStatus;
  method?: string;
  payoutMethodId?: string;
  referenceId?: string;
  note?: string;
  createdAt?: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentPayouts: Payout[];
  topMalls: Mall[];
}

export interface Mall {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  contact?: {
    managerName?: string;
    phone?: string;
    email?: string;
  };
  logoUrl?: string;
  coverImageUrl?: string;
  totalStores?: number;
  sellerCount?: number;
  rating?: number;
  isFeatured?: boolean;
  featuredRank?: number;
  isActive: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy?: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  request?: {
    mallUnit?: string;
    mallFloor?: string;
    message?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MallPayload {
  name: string;
  description?: string;
  address?: Mall["address"];
  contact?: Mall["contact"];
  logoUrl?: string;
  coverImageUrl?: string;
  totalStores?: number;
  rating?: number;
  isFeatured?: boolean;
  featuredRank?: number;
  isActive?: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

export interface SellerMallRequest {
  _id: string;
  sellerId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  status?: PartnerStatus;
  currentMallId?: string;
  request: {
    mallId: string;
    mallName?: string;
    mallUnit?: string;
    mallFloor?: string;
    message?: string;
    status: PartnerStatus;
    requestedAt?: string;
  };
}

export interface ManagementFeature {
  name: string;
  status: ManagementStatus;
  module: string;
  route?: string | null;
  note: string;
}

export interface ManagementGroup {
  id: string;
  title: string;
  features: ManagementFeature[];
  summary: {
    total: number;
    active: number;
    partial: number;
    planned: number;
  };
}

export interface PayoutMethod {
  _id: string;
  sellerId: string;
  sellerProfileId: string;
  sellerName?: string;
  sellerEmail?: string;
  businessName?: string;
  type: "BANK" | "UPI" | "PAYPAL" | "STRIPE_CONNECT";
  label?: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  isDefault: boolean;
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
  createdAt?: string;
  verifiedAt?: string;
}

export interface AppConfig {
  store?: {
    storeName?: string;
    appTitle?: string;
  };
  policies?: {
    privacyPolicy?: string;
    termsAndConditions?: string;
    returnPolicy?: string;
    shippingPolicy?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  shipping?: {
    freeShippingThreshold?: number;
    shippingFee?: number;
  };
  tax?: {
    enabled?: boolean;
    rate?: number;
    inclusive?: boolean;
  };
  currency?: {
    code?: string;
    symbol?: string;
  };
  delivery?: {
    defaultRadiusKm?: number;
    minOrderAmount?: number;
    estimatedMinutes?: number;
  };
}

export const adminManagementApi = {
  getManagementCatalog: async (): Promise<ManagementGroup[]> => {
    const response = await axiosInstance.get("/admin/management-catalog");
    return response.data.data;
  },

  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await axiosInstance.get("/admin/dashboard");
    return response.data.data;
  },

  getAppConfig: async (): Promise<AppConfig> => {
    const response = await axiosInstance.get("/app-config");
    return response.data.data;
  },

  updateAppConfig: async (payload: AppConfig): Promise<AppConfig> => {
    const response = await axiosInstance.patch("/app-config", payload);
    return response.data.data;
  },

  getPeople: async (params: { role?: string; status?: string; search?: string }): Promise<ManagedPerson[]> => {
    const response = await axiosInstance.get("/admin/people", { params });
    return response.data.data;
  },

  setBlocked: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }): Promise<ManagedPerson> => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/block`, { isBlocked });
    return response.data.data;
  },

  updatePartnerStatus: async ({
    userId,
    type,
    status,
  }: {
    userId: string;
    type: PartnerType;
    status: PartnerStatus;
  }) => {
    const response = await axiosInstance.patch(`/admin/partners/${userId}/status`, { type, status });
    return response.data.data;
  },

  sendInvite: async (payload: { email: string; role: AdminRole; fullName?: string; message?: string }) => {
    const response = await axiosInstance.post("/admin/invites", payload);
    return response.data.data;
  },

  getPayouts: async (): Promise<Payout[]> => {
    const response = await axiosInstance.get("/admin/payouts");
    return response.data.data;
  },

  createPayout: async (payload: {
    partnerId: string;
    partnerType: PartnerType;
    amount: number;
    method?: string;
    referenceId?: string;
    note?: string;
    status?: PayoutStatus;
  }): Promise<Payout> => {
    const response = await axiosInstance.post("/admin/payouts", payload);
    return response.data.data;
  },

  updatePayoutStatus: async ({
    payoutId,
    status,
    referenceId,
    note,
  }: {
    payoutId: string;
    status: PayoutStatus;
    referenceId?: string;
    note?: string;
  }): Promise<Payout> => {
    const response = await axiosInstance.patch(`/admin/payouts/${payoutId}/status`, { status, referenceId, note });
    return response.data.data;
  },

  getPayoutMethods: async (params: { status?: PayoutMethod["status"] } = {}): Promise<PayoutMethod[]> => {
    const response = await axiosInstance.get("/admin/payout-methods", { params });
    return response.data.data;
  },

  reviewPayoutMethod: async ({
    sellerId,
    methodId,
    status,
    reason,
  }: {
    sellerId: string;
    methodId: string;
    status: "VERIFIED" | "REJECTED";
    reason?: string;
  }): Promise<PayoutMethod> => {
    const response = await axiosInstance.patch(`/admin/sellers/${sellerId}/payout-methods/${methodId}/status`, { status, reason });
    return response.data.data;
  },

  getMalls: async (): Promise<Mall[]> => {
    const response = await axiosInstance.get("/admin/malls");
    return response.data.data;
  },

  getMallRequests: async (): Promise<SellerMallRequest[]> => {
    const response = await axiosInstance.get("/admin/mall-requests");
    return response.data.data;
  },

  getMallCreationRequests: async (): Promise<Mall[]> => {
    const response = await axiosInstance.get("/admin/mall-creation-requests");
    return response.data.data;
  },

  createMall: async (payload: MallPayload): Promise<Mall> => {
    const response = await axiosInstance.post("/admin/malls", payload);
    return response.data.data;
  },

  updateMall: async ({ mallId, updates }: { mallId: string; updates: Partial<MallPayload> }): Promise<Mall> => {
    const response = await axiosInstance.patch(`/admin/malls/${mallId}`, updates);
    return response.data.data;
  },

  reviewMallCreation: async ({
    mallId,
    status,
    reason,
  }: {
    mallId: string;
    status: "APPROVED" | "REJECTED";
    reason?: string;
  }): Promise<Mall> => {
    const response = await axiosInstance.patch(`/admin/malls/${mallId}/review`, { status, reason });
    return response.data.data;
  },

  deactivateMall: async (mallId: string): Promise<Mall> => {
    const response = await axiosInstance.delete(`/admin/malls/${mallId}`);
    return response.data.data;
  },

  assignSellerMall: async (payload: {
    sellerId: string;
    mallId?: string | null;
    mallUnit?: string;
    mallFloor?: string;
  }) => {
    const { sellerId, ...body } = payload;
    const response = await axiosInstance.patch(`/admin/sellers/${sellerId}/mall`, body);
    return response.data.data;
  },

  reviewMallRequest: async ({
    sellerId,
    status,
    reason,
  }: {
    sellerId: string;
    status: "APPROVED" | "REJECTED";
    reason?: string;
  }) => {
    const response = await axiosInstance.patch(`/admin/sellers/${sellerId}/mall-request`, { status, reason });
    return response.data.data;
  },
};
