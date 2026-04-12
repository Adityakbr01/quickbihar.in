import axiosInstance from "@/src/api/axiosInstance";
import { Banner } from "../types/banner.types";

export const getBannersRequest = async (placement?: string) => {
  const response = await axiosInstance.get("/banners", {
    params: { placement },
  });
  return response.data;
};

export const getAllBannersRequest = async () => {
  const response = await axiosInstance.get("/banners/all");
  return response.data;
};

export const createBannerRequest = async (data: any) => {
  const response = await axiosInstance.post("/banners", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateBannerRequest = async ({ id, data }: { id: string; data: any }) => {
  const response = await axiosInstance.patch(`/banners/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteBannerRequest = async (id: string) => {
  const response = await axiosInstance.delete(`/banners/${id}`);
  return response.data;
};

export const trackClickRequest = async (id: string) => {
  const response = await axiosInstance.post(`/banners/${id}/click`);
  return response.data;
};
