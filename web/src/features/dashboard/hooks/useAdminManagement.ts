import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminManagementApi } from "../api/adminManagement.api";

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminManagementApi.getDashboard,
  });

export const useManagementCatalog = () =>
  useQuery({
    queryKey: ["admin-management-catalog"],
    queryFn: adminManagementApi.getManagementCatalog,
  });

export const useAppConfig = () =>
  useQuery({
    queryKey: ["app-config"],
    queryFn: adminManagementApi.getAppConfig,
  });

export const useManagedPeople = (params: { role?: string; status?: string; search?: string }) =>
  useQuery({
    queryKey: ["admin-people", params],
    queryFn: () => adminManagementApi.getPeople(params),
  });

export const usePayouts = () =>
  useQuery({
    queryKey: ["admin-payouts"],
    queryFn: adminManagementApi.getPayouts,
  });

export const usePayoutMethods = (params: { status?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" } = {}) =>
  useQuery({
    queryKey: ["admin-payout-methods", params],
    queryFn: () => adminManagementApi.getPayoutMethods(params),
  });

export const useMalls = () =>
  useQuery({
    queryKey: ["admin-malls"],
    queryFn: adminManagementApi.getMalls,
  });

export const useMallRequests = () =>
  useQuery({
    queryKey: ["admin-mall-requests"],
    queryFn: adminManagementApi.getMallRequests,
  });

export const useMallCreationRequests = () =>
  useQuery({
    queryKey: ["admin-mall-creation-requests"],
    queryFn: adminManagementApi.getMallCreationRequests,
  });

export const useSetBlocked = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.setBlocked,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(variables.isBlocked ? "User blocked" : "User unblocked");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update user"),
  });
};

export const useUpdateAppConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateAppConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-config"] });
      toast.success("Store configuration saved");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save store configuration"),
  });
};

export const useUpdatePartnerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updatePartnerStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Partner status updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update partner"),
  });
};

export const useSendInvite = () =>
  useMutation({
    mutationFn: adminManagementApi.sendInvite,
    onSuccess: () => toast.success("Invite sent"),
    onError: (error: Error) => toast.error(error.message || "Failed to send invite"),
  });

export const useCreatePayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Payout recorded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to record payout"),
  });
};

export const useUpdatePayoutStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updatePayoutStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Payout status updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update payout"),
  });
};

export const useReviewPayoutMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.reviewPayoutMethod,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-methods"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(variables.status === "VERIFIED" ? "Payout method verified" : "Payout method rejected");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to review payout method"),
  });
};

export const useCreateMall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createMall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-malls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Mall created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create mall"),
  });
};

export const useUpdateMall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateMall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-malls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      toast.success("Mall updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update mall"),
  });
};

export const useReviewMallCreation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.reviewMallCreation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mall-creation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-malls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(variables.status === "APPROVED" ? "Mall request approved" : "Mall request rejected");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to review mall request"),
  });
};

export const useDeactivateMall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deactivateMall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-malls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Mall deactivated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to deactivate mall"),
  });
};

export const useAssignSellerMall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.assignSellerMall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-malls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Seller mall assignment updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to assign seller"),
  });
};

export const useReviewMallRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.reviewMallRequest,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mall-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-malls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(variables.status === "APPROVED" ? "Mall request approved" : "Mall request rejected");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to review mall request"),
  });
};
