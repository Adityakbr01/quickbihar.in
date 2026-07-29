import axiosInstance from "@/src/api/axiosInstance";

export const getAppConfigRequest = () => axiosInstance.get("/app-config");

export const updateAppConfigRequest = (data: any) =>
    axiosInstance.patch("/app-config", data);
