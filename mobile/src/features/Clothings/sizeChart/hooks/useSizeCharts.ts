import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllSizeChartsRequest,
  getSizeChartByIdRequest,
  createSizeChartRequest,
  updateSizeChartRequest,
  deleteSizeChartRequest,
} from "../api/sizeChart.api";
import { CreateSizeChartDto, UpdateSizeChartDto } from "../types/sizeChart.types";

export const useSizeCharts = () => {
  return useQuery({
    queryKey: ["sizeCharts"],
    queryFn: getAllSizeChartsRequest,
  });
};

export const useSizeChart = (id: string) => {
  return useQuery({
    queryKey: ["sizeCharts", id],
    queryFn: () => getSizeChartByIdRequest(id),
    enabled: !!id,
  });
};

export const useCreateSizeChart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSizeChartDto) => createSizeChartRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizeCharts"] });
    },
  });
};

export const useUpdateSizeChart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSizeChartDto }) =>
      updateSizeChartRequest({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sizeCharts"] });
      queryClient.invalidateQueries({ queryKey: ["sizeCharts", data._id] });
    },
  });
};

export const useDeleteSizeChart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSizeChartRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizeCharts"] });
    },
  });
};
