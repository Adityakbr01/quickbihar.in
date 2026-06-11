import axiosInstance from "@/src/api/axiosInstance";

export interface DeliveryLocationPayload {
  latitude: number;
  longitude: number;
  heading?: number;
}

export type RiderOrderStatus =
  | "READY_FOR_PICKUP"
  | "RIDER_ASSIGNMENT_OPEN"
  | "RIDER_ASSIGNED"
  | "RIDER_ACCEPTED"
  | "RIDER_REJECTED"
  | "RIDER_ARRIVING"
  | "RIDER_REACHED_STORE"
  | "PICKUP_VERIFICATION_PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "NEAR_CUSTOMER"
  | "DELIVERED"
  | "DELIVERY_CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "RIDER_CANCELLED"
  | "DELIVERY_FAILED"
  | "CUSTOMER_UNREACHABLE"
  | "RETURNED";

export interface RiderWallet {
  availableBalance: number;
  pendingPayoutBalance: number;
  lifetimeEarnings: number;
  collectedCodLiability?: number;
}

export interface RiderPayoutMethod {
  _id: string;
  type: "BANK" | "UPI";
  label?: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
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
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt?: string;
  displayName?: string;
  source?: "PROFILE" | "ADDED";
}

export interface RiderPayout {
  _id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  method?: string;
  referenceId?: string;
  note?: string;
  processedBy?: { _id?: string; fullName?: string; email?: string } | string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RiderProfile {
  _id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  bankDetails?: Record<string, string>;
  payoutMethods?: RiderPayoutMethod[];
  wallet?: RiderWallet;
  currentLocation?: DeliveryLocationPayload | null;
  approvalMissingFields?: string[];
  canAcceptOffers?: boolean;
  offerBlockReason?: string;
}

export interface RiderOrder {
  _id: string;
  orderId: string;
  subOrderId?: string;
  userId?: any;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };
  items?: Array<{
    title?: string;
    sku?: string;
    size?: string;
    color?: string;
    quantity?: number;
    price?: number;
  }>;
  status: RiderOrderStatus;
  payableAmount?: number;
  shippingFee?: number;
  delivery?: {
    status?: RiderOrderStatus | string;
    riderId?: string;
    partnerUserId?: string;
    payoutAmount?: number;
    pickupOtp?: string;
    deliveryOtp?: string;
    pickupPhoto?: string;
    deliveryPhoto?: string;
    deliverySignature?: string;
    currentLocation?: DeliveryLocationPayload;
    events?: any[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RiderPaginatedOrders {
  data: RiderOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RiderDashboardResponse {
  profile: RiderProfile;
  stats: {
    activeOrders: number;
    todayDeliveries: number;
    completedOrders: number;
    pendingPayouts: number;
    availableBalance: number;
    pendingPayoutBalance: number;
    lifetimeEarnings: number;
  };
  activeOrders: RiderOrder[];
  recentOrders: RiderOrder[];
  recentPayouts: RiderPayout[];
}

export interface RiderEarningsResponse {
  wallet: RiderWallet;
  totalCredited: number;
  ledger: Array<{
    _id: string;
    orderId: string;
    amount: number;
    creditedAt?: string;
    deliveredAt?: string;
    customerName?: string;
    status?: RiderOrderStatus | string;
  }>;
}

export interface RiderPayoutsResponse {
  wallet: RiderWallet;
  payoutMethods: RiderPayoutMethod[];
  payouts: RiderPayout[];
}

export interface RiderOffer {
  _id: string;
  offerId: string;
  subOrderId: string;
  status: string;
  stage: number;
  radiusKm: number;
  payoutAmount: number;
  distanceKm?: number;
  riderDistanceToStoreKm?: number;
  expiresAt: string;
  metadata?: Record<string, any>;
  subOrder?: any;
}

export const deliveryApi = {
  getDashboard: async (): Promise<RiderDashboardResponse> => {
    const response = await axiosInstance.get("/delivery/dashboard");
    return response.data.data;
  },

  sync: async () => {
    const response = await axiosInstance.get("/delivery/sync");
    return response.data.data;
  },

  updateAvailability: async (payload: { isOnline: boolean; location?: DeliveryLocationPayload }) => {
    const response = await axiosInstance.patch("/delivery/availability", payload);
    return response.data.data;
  },

  getHistory: async (params: {
    status?: RiderOrderStatus | string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<RiderPaginatedOrders> => {
    const response = await axiosInstance.get("/delivery/history", { params });
    return response.data.data;
  },

  getEarnings: async (params: { dateFrom?: string; dateTo?: string } = {}): Promise<RiderEarningsResponse> => {
    const response = await axiosInstance.get("/delivery/earnings", { params });
    return response.data.data;
  },

  getPayouts: async (): Promise<RiderPayoutsResponse> => {
    const response = await axiosInstance.get("/delivery/payouts");
    return response.data.data;
  },

  getOffers: async (): Promise<RiderOffer[]> => {
    const response = await axiosInstance.get("/delivery/offers");
    return response.data.data;
  },

  acceptOffer: async (offerId: string) => {
    const response = await axiosInstance.post(`/delivery/offers/${offerId}/accept`);
    return response.data.data;
  },

  rejectOffer: async (offerId: string, reason = "Rejected by rider") => {
    const response = await axiosInstance.post(`/delivery/offers/${offerId}/reject`, { reason });
    return response.data.data;
  },

  addPayoutMethod: async (
    payload:
      | { type: "BANK"; label?: string; bank: NonNullable<RiderPayoutMethod["bank"]> }
      | { type: "UPI"; label?: string; upi: NonNullable<RiderPayoutMethod["upi"]> },
  ): Promise<RiderPayoutMethod> => {
    const response = await axiosInstance.post("/delivery/payout-methods", payload);
    return response.data.data;
  },

  setDefaultPayoutMethod: async (methodId: string): Promise<RiderPayoutMethod[]> => {
    const response = await axiosInstance.patch(`/delivery/payout-methods/${methodId}/default`);
    return response.data.data;
  },

  requestPayout: async (payload: { amount: number; payoutMethodId: string; note?: string }): Promise<RiderPayout> => {
    const response = await axiosInstance.post("/delivery/payout-requests", payload);
    return response.data.data;
  },

  updateProfile: async (payload: {
    phone?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    licenseNumber?: string;
    address?: Record<string, string>;
    bankDetails?: Record<string, string>;
  }): Promise<RiderProfile> => {
    const response = await axiosInstance.patch("/delivery/profile", payload);
    return response.data.data;
  },

  arriving: async (subOrderId: string) => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/arriving`);
    return response.data.data;
  },

  reachedStore: async (subOrderId: string, location: DeliveryLocationPayload) => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/reached-store`, location);
    return response.data.data;
  },

  pickup: async (subOrderId: string, payload: { pickupOtp: string; pickupPhoto: string }) => {
    const response = await axiosInstance.post(`/delivery/sub-orders/${subOrderId}/pickup`, payload);
    return response.data.data;
  },

  transit: async (subOrderId: string) => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/transit`);
    return response.data.data;
  },

  nearCustomer: async (subOrderId: string, location: DeliveryLocationPayload) => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/near-customer`, location);
    return response.data.data;
  },

  deliver: async (subOrderId: string, payload: { deliveryOtp: string; deliveryPhoto: string; deliverySignature?: string }) => {
    const response = await axiosInstance.post(`/delivery/sub-orders/${subOrderId}/deliver`, payload);
    return response.data.data;
  },

  cancel: async (subOrderId: string, reason: string) => {
    const response = await axiosInstance.post(`/delivery/sub-orders/${subOrderId}/cancel`, { reason });
    return response.data.data;
  },
};
