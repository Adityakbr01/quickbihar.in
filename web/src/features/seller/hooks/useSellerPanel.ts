import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sellerPanelApi } from "../api/sellerPanel.api";

export const useSellerSetupStatus = () =>
  useQuery({
    queryKey: ["seller-setup-status"],
    queryFn: sellerPanelApi.getSetupStatus,
  });

export const useRequestMallConnection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerPanelApi.requestMallConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-setup-status"] });
      toast.success("Mall connection request submitted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to request mall connection"),
  });
};

export const useRequestMallCreation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerPanelApi.requestMallCreation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-setup-status"] });
      toast.success("Mall creation request submitted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to request mall creation"),
  });
};

export const useAddPayoutMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerPanelApi.addPayoutMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-setup-status"] });
      toast.success("Payout method sent for admin verification");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save payout method"),
  });
};

export const useSetDefaultPayoutMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerPanelApi.setDefaultPayoutMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-setup-status"] });
      toast.success("Default payout method updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update default payout method"),
  });
};

export const useRequestSellerPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerPanelApi.requestPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-setup-status"] });
      toast.success("Payout request submitted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to request payout"),
  });
};
