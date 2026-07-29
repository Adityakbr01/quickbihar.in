import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMallDetailRequest, postMallReviewRequest, getPublicMallsRequest } from "../api/mall.api";

export const usePublicMalls = () => {
  return useQuery<any[], Error>({
    queryKey: ["publicMalls"],
    queryFn: getPublicMallsRequest,
  });
};

export const useMallDetail = (id: string) => {
  return useQuery<any, Error>({
    queryKey: ["mall", id],
    queryFn: () => getMallDetailRequest(id),
    enabled: !!id,
  });
};

export const useSubmitMallReview = (mallId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      postMallReviewRequest(mallId, payload),
    onSuccess: () => {
      // Invalidate queries to refresh detail and lists
      queryClient.invalidateQueries({ queryKey: ["mall", mallId] });
      queryClient.invalidateQueries({ queryKey: ["topMalls"] });
    },
  });
};
