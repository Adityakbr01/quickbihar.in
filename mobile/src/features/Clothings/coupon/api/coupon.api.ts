import axiosInstance from "@/src/api/axiosInstance";
import { ICoupon } from "../types/coupon.types";

export const getAllCouponsRequest = async (): Promise<ICoupon[]> => {
    const response = await axiosInstance.get("/coupons");
    return response.data.data;
};

export const createCouponRequest = async (data: Partial<ICoupon>): Promise<ICoupon> => {
    const response = await axiosInstance.post("/coupons", data);
    return response.data.data;
};

export const updateCouponRequest = async ({ id, data }: { id: string, data: Partial<ICoupon> }): Promise<ICoupon> => {
    const response = await axiosInstance.patch(`/coupons/${id}`, data);
    return response.data.data;
};

export const deleteCouponRequest = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/coupons/${id}`);
};

export const validateCouponRequest = async (code: string, orderAmount: number) => {
    const response = await axiosInstance.post("/coupons/validate", { code, orderAmount });
    return response.data.data;
};
