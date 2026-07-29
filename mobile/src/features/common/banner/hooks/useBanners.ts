import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getAllBannersRequest, 
  getBannersRequest, 
  createBannerRequest, 
  updateBannerRequest, 
  deleteBannerRequest,
  trackClickRequest
} from "../api/banner.api";
import { Banner } from "../types/banner.types";

export const useBanners = (placement?: string) => {
  return useQuery({
    queryKey: ["banners", placement],
    queryFn: () => getBannersRequest(placement),
    select: (response: any): Banner[] => response?.data || [],
  });
};

export const useAdminBanners = () => {
  return useQuery({
    queryKey: ["banners", "admin"],
    queryFn: getAllBannersRequest,
    select: (response) => response?.data || [],
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBannerRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateBannerRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteBannerRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useTrackClick = () => {
  return useMutation({
    mutationFn: trackClickRequest,
  });
};
