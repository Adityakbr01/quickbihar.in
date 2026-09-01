import axiosInstance from "@/src/api/axiosInstance";
import { Banner } from "../types/banner.types";

export const getBannersRequest = async (placement?: string) => {
  const response = await axiosInstance.get("/banners", {
    params: { placement },
  });
  return response.data;
};

export const trackClickRequest = async (id: string) => {
  const response = await axiosInstance.post(`/banners/${id}/click`);
  return response.data;
};
