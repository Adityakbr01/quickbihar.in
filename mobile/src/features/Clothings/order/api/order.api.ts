import axiosInstance from "@/src/api/axiosInstance";

export interface CreateOrderData {
  items: {
    productId: string;
    sku: string;
    quantity: number;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    latitude: number;
    longitude: number;
  };
  couponCode?: string;
  couponCodes?: string[];
}

export interface VerifyPaymentData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface OrderQuoteBreakdown {
  sellerId: string;
  storeId?: string;
  sellerItemSubtotal: number;
  sellerCouponShare: number;
  customerDeliveryFeeShare: number;
  customerDynamicSurchargeShare: number;
  platformCommission: number;
  sellerNet: number;
  distanceKm: number;
  riderBasePayout: number;
  riderPayoutEstimate: number;
  riderBonuses: {
    rain: number;
    peak: number;
    festival: number;
    night: number;
  };
  bonusFlags: {
    rain: boolean;
    peak: boolean;
    festival: boolean;
    night: boolean;
  };
}

export interface OrderQuoteData {
  subtotal: number;
  totalAmount: number;
  totalTax: number;
  mrpTotal: number;
  productDiscount: number;
  discountAmount: number;
  shippingFee: number;
  dynamicDeliverySurcharge: number;
  payableAmount: number;
  platformCommissionTotal: number;
  riderPayoutEstimateTotal: number;
  appGrossRevenue: number;
  appNetAfterRiderEstimate: number;
  sellerBreakdowns: OrderQuoteBreakdown[];
}

export const quoteOrderRequest = async (data: CreateOrderData) => {
  const response = await axiosInstance.post("/orders/quote", data);
  return response.data;
};

export const createOrderRequest = async (data: CreateOrderData) => {
  const response = await axiosInstance.post("/orders", data);
  return response.data;
};

export const verifyPaymentRequest = async (data: VerifyPaymentData) => {
  const response = await axiosInstance.post("/orders/verify", data);
  return response.data;
};

export const getMyOrdersRequest = async () => {
  const response = await axiosInstance.get("/orders/me");
  return response.data;
};

export const getOrderByIdRequest = async (orderId: string) => {
  const response = await axiosInstance.get(`/orders/${orderId}`);
  return response.data;
};

export const getAdminOrdersRequest = async () => {
  const response = await axiosInstance.get("/orders/admin/all");
  return response.data;
};

export const updateOrderStatusRequest = async (orderId: string, status: string, reason?: string) => {
  const response = await axiosInstance.patch(`/orders/admin/status/${orderId}`, { status, cancellationReason: reason });
  return response.data;
};

export const getSubOrderByIdRequest = async (subOrderId: string) => {
  const response = await axiosInstance.get(`/orders/sub-orders/${subOrderId}`);
  return response.data;
};

export const cancelSubOrderRequest = async (subOrderId: string, reason: string) => {
  const response = await axiosInstance.post(`/orders/sub-orders/${subOrderId}/cancel`, { reason });
  return response.data;
};

export const returnSubOrderRequest = async (subOrderId: string, reason: string) => {
  const response = await axiosInstance.post(`/orders/sub-orders/${subOrderId}/return`, { reason });
  return response.data;
};
