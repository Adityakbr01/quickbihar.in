import axiosInstance from "@/lib/axios";

export type DeliveryStatus =
  | "UNASSIGNED"
  | "ASSIGNMENT_OPEN"
  | "ASSIGNED"
  | "ACCEPTED"
  | "RIDER_REJECTED"
  | "ARRIVING_AT_STORE"
  | "REACHED_STORE"
  | "PICKUP_VERIFICATION_PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "NEAR_CUSTOMER"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_CONFIRMED"
  | "CANCELLED"
  | "FAILED"
  | "RETURNING"
  | "RETURNED";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED"
  | "REFUNDED"
  | "FAILED";

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  updatedAt?: string;
}

export interface DeliveryPartner {
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
  wallet?: DeliveryWallet;
  currentLocation?: DeliveryLocation | null;
  distanceKm?: number;
}

export interface DeliveryWallet {
  availableBalance: number;
  pendingPayoutBalance: number;
  lifetimeEarnings: number;
  collectedCodLiability?: number;
}

export type DeliveryPayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";
export type DeliveryPayoutMethodStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export interface DeliveryPayoutMethod {
  _id: string;
  type: "BANK" | "UPI";
  label?: string;
  status: DeliveryPayoutMethodStatus;
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
  displayName?: string;
  createdAt?: string;
  verifiedAt?: string;
}

export interface DeliveryPayout {
  _id: string;
  amount: number;
  status: DeliveryPayoutStatus;
  method?: string;
  referenceId?: string;
  note?: string;
  processedBy?: {
    _id?: string;
    fullName?: string;
    email?: string;
  } | string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryOrder {
  _id: string;
  orderId: string;
  userId?: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };
  items: Array<{
    title: string;
    sku: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    pickupLocation?: string;
    warehouseName?: string;
  }>;
  status: OrderStatus;
  payableAmount: number;
  shippingFee?: number;
  delivery?: {
    status?: DeliveryStatus;
    partnerUserId?: DeliveryPartner | string;
    payoutAmount?: number;
    payoutCreditedAt?: string;
    assignedAt?: string;
    acceptedAt?: string;
    pickedUpAt?: string;
    outForDeliveryAt?: string;
    deliveredAt?: string;
    currentLocation?: DeliveryLocation;
    otp?: {
      code?: string;
      generatedAt?: string;
      verifiedAt?: string;
    };
    events?: Array<{
      status: DeliveryStatus;
      action: string;
      note?: string;
      at: string;
    }>;
  };
  deliveryPartner?: DeliveryPartner | null;
  deliveryPartnerLocation?: DeliveryLocation | null;
  deliveryOtp?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedDeliveryOrders {
  data: DeliveryOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeliveryProfileResponse {
  profile: DeliveryPartner & {
    address?: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    bankDetails?: Record<string, string>;
    payoutMethods?: DeliveryPayoutMethod[];
  };
  stats: {
    activeOrders: number;
    completedOrders: number;
  };
}

export interface DeliveryDashboardResponse {
  profile: DeliveryProfileResponse["profile"];
  stats: {
    activeOrders: number;
    todayDeliveries: number;
    completedOrders: number;
    pendingPayouts: number;
    availableBalance: number;
    pendingPayoutBalance: number;
    lifetimeEarnings: number;
  };
  activeOrders: DeliveryOrder[];
  recentOrders: DeliveryOrder[];
  recentPayouts: DeliveryPayout[];
}

export interface DeliveryEarningsResponse {
  wallet: DeliveryWallet;
  totalCredited: number;
  ledger: Array<{
    _id: string;
    orderId: string;
    amount: number;
    creditedAt?: string;
    deliveredAt?: string;
    customerName?: string;
    status?: DeliveryStatus;
  }>;
}

export interface DeliveryPayoutsResponse {
  wallet: DeliveryWallet;
  payoutMethods: DeliveryPayoutMethod[];
  payouts: DeliveryPayout[];
}

export const deliveryApi = {
  getProfile: async (): Promise<DeliveryProfileResponse> => {
    const response = await axiosInstance.get("/delivery/me");
    return response.data.data;
  },

  getDashboard: async (): Promise<DeliveryDashboardResponse> => {
    const response = await axiosInstance.get("/delivery/dashboard");
    return response.data.data;
  },

  updateAvailability: async (payload: { isOnline: boolean; location?: DeliveryLocation }) => {
    const response = await axiosInstance.patch("/delivery/availability", payload);
    return response.data.data;
  },

  getOrders: async (params: { status?: DeliveryStatus; page?: number; limit?: number }): Promise<PaginatedDeliveryOrders> => {
    const response = await axiosInstance.get("/delivery/orders", { params });
    return response.data.data;
  },

  getHistory: async (params: {
    status?: DeliveryStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedDeliveryOrders> => {
    const response = await axiosInstance.get("/delivery/history", { params });
    return response.data.data;
  },

  getEarnings: async (params: { dateFrom?: string; dateTo?: string } = {}): Promise<DeliveryEarningsResponse> => {
    const response = await axiosInstance.get("/delivery/earnings", { params });
    return response.data.data;
  },

  getPayouts: async (): Promise<DeliveryPayoutsResponse> => {
    const response = await axiosInstance.get("/delivery/payouts");
    return response.data.data;
  },

  getOrder: async (orderId: string): Promise<DeliveryOrder> => {
    const response = await axiosInstance.get(`/delivery/orders/${orderId}`);
    return response.data.data;
  },

  addPayoutMethod: async (payload:
    | { type: "BANK"; label?: string; bank: NonNullable<DeliveryPayoutMethod["bank"]> }
    | { type: "UPI"; label?: string; upi: NonNullable<DeliveryPayoutMethod["upi"]> }
  ): Promise<DeliveryPayoutMethod> => {
    const response = await axiosInstance.post("/delivery/payout-methods", payload);
    return response.data.data;
  },

  setDefaultPayoutMethod: async (methodId: string): Promise<DeliveryPayoutMethod[]> => {
    const response = await axiosInstance.patch(`/delivery/payout-methods/${methodId}/default`);
    return response.data.data;
  },

  requestPayout: async (payload: { amount: number; payoutMethodId: string; note?: string }): Promise<DeliveryPayout> => {
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
  }) => {
    const response = await axiosInstance.patch("/delivery/profile", payload);
    return response.data.data;
  },

  acceptSubOrder: async (subOrderId: string): Promise<any> => {
    const response = await axiosInstance.post(`/delivery/sub-orders/${subOrderId}/accept`);
    return response.data.data;
  },

  subOrderArriving: async (subOrderId: string): Promise<any> => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/arriving`);
    return response.data.data;
  },

  subOrderReachedStore: async (subOrderId: string, location: { latitude: number; longitude: number }): Promise<any> => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/reached-store`, location);
    return response.data.data;
  },

  subOrderPickup: async (subOrderId: string, payload: { pickupOtp: string; pickupPhoto?: string }): Promise<any> => {
    const response = await axiosInstance.post(`/delivery/sub-orders/${subOrderId}/pickup`, payload);
    return response.data.data;
  },

  subOrderTransit: async (subOrderId: string): Promise<any> => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/transit`);
    return response.data.data;
  },

  subOrderNearCustomer: async (subOrderId: string, location: { latitude: number; longitude: number }): Promise<any> => {
    const response = await axiosInstance.patch(`/delivery/sub-orders/${subOrderId}/near-customer`, location);
    return response.data.data;
  },

  subOrderDeliver: async (subOrderId: string, payload: { deliveryOtp: string; deliveryPhoto?: string; deliverySignature?: string }): Promise<any> => {
    const response = await axiosInstance.post(`/delivery/sub-orders/${subOrderId}/deliver`, payload);
    return response.data.data;
  },

  subOrderCancel: async (subOrderId: string, reason: string): Promise<any> => {
    const response = await axiosInstance.post(`/delivery/sub-orders/${subOrderId}/cancel`, { reason });
    return response.data.data;
  },
};
