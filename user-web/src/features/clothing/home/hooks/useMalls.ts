import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMallDetailBySlugRequest, getMallDetailRequest, postMallReviewRequest, getPublicMallsRequest } from "../api/mall.api";

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

/**
 * Fetch mall detail by slug (canonical SEO lookup, plan §26 A2).
 */
export const useMallDetailBySlug = (slug: string) => {
  return useQuery<any, Error>({
    queryKey: ["mall", "slug", slug],
    queryFn: () => getMallDetailBySlugRequest(slug),
    enabled: !!slug,
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
