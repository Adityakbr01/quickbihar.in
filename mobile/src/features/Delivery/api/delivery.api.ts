import axiosInstance from "@/src/api/axiosInstance";

export interface DeliveryLocationPayload {
  latitude: number;
  longitude: number;
  heading?: number;
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
  sync: async () => {
    const response = await axiosInstance.get("/delivery/sync");
    return response.data.data;
  },

  updateAvailability: async (payload: { isOnline: boolean; location?: DeliveryLocationPayload }) => {
    const response = await axiosInstance.patch("/delivery/availability", payload);
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
