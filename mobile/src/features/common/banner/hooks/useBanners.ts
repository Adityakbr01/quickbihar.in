import { useMutation, useQuery } from "@tanstack/react-query";
import { getBannersRequest, trackClickRequest } from "../api/banner.api";
import { Banner } from "../types/banner.types";

export const useBanners = (placement?: string) => {
  return useQuery({
    queryKey: ["banners", placement],
    queryFn: () => getBannersRequest(placement),
    select: (response: any): Banner[] => response?.data || [],
  });
};

export const useTrackClick = () => {
  return useMutation({
    mutationFn: trackClickRequest,
  });
};
