import axiosInstance from "@/src/api/axiosInstance";
import { ISizeChart, CreateSizeChartDto, UpdateSizeChartDto } from "../types/sizeChart.types";

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

/**
 * Create a new size chart
 */
export const createSizeChartRequest = async (data: CreateSizeChartDto): Promise<ISizeChart> => {
  const response = await axiosInstance.post("/size-charts", data);
  return response.data.data;
};

/**
 * Update an existing size chart
 */
export const updateSizeChartRequest = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateSizeChartDto;
}): Promise<ISizeChart> => {
  const response = await axiosInstance.patch(`/size-charts/${id}`, data);
  return response.data.data;
};

/**
 * Delete a size chart
 */
export const deleteSizeChartRequest = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/size-charts/${id}`);
};
