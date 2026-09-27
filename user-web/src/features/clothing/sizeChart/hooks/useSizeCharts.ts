import { useQuery } from "@tanstack/react-query";
import { getAllSizeChartsRequest, getSizeChartByIdRequest } from "../api/sizeChart.api";

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
