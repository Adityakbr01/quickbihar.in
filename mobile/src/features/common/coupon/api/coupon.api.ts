import axiosInstance from "@/src/api/axiosInstance";
import { ICoupon } from "../types/coupon.types";

/**
 * Fetch coupons applicable to the current cart's product set. The server
 * filters by product, vertical, and active status; the client renders the
 * result in the "View Offers" bottom sheet.
 */
export const getApplicableCouponsRequest = async (productIds?: string[]): Promise<ICoupon[]> => {
  const params = productIds && productIds.length > 0 ? { productIds: productIds.join(",") } : {};
  const response = await axiosInstance.get("/coupons/public/applicable", { params });
  return response.data.data;
};
