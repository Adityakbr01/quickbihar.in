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
  };
  couponCode?: string;
}

export interface VerifyPaymentData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

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
