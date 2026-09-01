import axiosInstance from "@/src/api/axiosInstance";
import { ISizeChart } from "../types/sizeChart.types";

/**
 * Fetch all size charts
 */
export const getAllSizeChartsRequest = async (): Promise<ISizeChart[]> => {
  const response = await axiosInstance.get("/size-charts/my");
  return response.data.data;
};

/**
 * Fetch a single size chart by ID
 */
export const getSizeChartByIdRequest = async (id: string): Promise<ISizeChart> => {
  const response = await axiosInstance.get(`/size-charts/${id}`);
  return response.data.data;
};
