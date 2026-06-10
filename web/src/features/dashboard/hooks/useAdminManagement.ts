import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminManagementApi, AdminListParams } from "../api/adminManagement.api";

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

export const useSellerSubmissions = (params: {
  type?: "products" | "coupons" | "banners" | "sizeCharts" | "categoryRequests";
  status?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "PENDING" | "ALL";
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: ["admin-seller-submissions", params],
    queryFn: () => adminManagementApi.getSellerSubmissions(params),
  });

export const useReviewSellerSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.reviewSellerSubmission,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-seller-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      toast.success(variables.status === "APPROVED" ? "Seller submission approved" : "Seller submission rejected");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to review seller submission"),
  });
};

const invalidateAdmin = (queryClient: ReturnType<typeof useQueryClient>, key: string) => {
  queryClient.invalidateQueries({ queryKey: [key] });
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["admin-management-catalog"] });
};

export const useCMSPages = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-cms-pages", params],
    queryFn: () => adminManagementApi.getCMSPages(params),
  });

export const useCreateCMSPage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createCMSPage,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-cms-pages");
      toast.success("CMS page created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create CMS page"),
  });
};

export const useUpdateCMSPage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateCMSPage,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-cms-pages");
      toast.success("CMS page updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update CMS page"),
  });
};

export const useDeleteCMSPage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteCMSPage,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-cms-pages");
      toast.success("CMS page deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete CMS page"),
  });
};

export const useFAQs = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-faqs", params],
    queryFn: () => adminManagementApi.getFAQs(params),
  });

export const useCreateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createFAQ,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-faqs");
      toast.success("FAQ created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create FAQ"),
  });
};

export const useUpdateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateFAQ,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-faqs");
      toast.success("FAQ updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update FAQ"),
  });
};

export const useDeleteFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteFAQ,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-faqs");
      toast.success("FAQ deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete FAQ"),
  });
};

export const useBlogPosts = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-blog-posts", params],
    queryFn: () => adminManagementApi.getBlogPosts(params),
  });

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createBlogPost,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-blog-posts");
      toast.success("Blog post created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create blog post"),
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateBlogPost,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-blog-posts");
      toast.success("Blog post updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update blog post"),
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteBlogPost,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-blog-posts");
      toast.success("Blog post deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete blog post"),
  });
};

export const useAnnouncements = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-announcements", params],
    queryFn: () => adminManagementApi.getAnnouncements(params),
  });

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createAnnouncement,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-announcements");
      toast.success("Announcement created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create announcement"),
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateAnnouncement,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-announcements");
      toast.success("Announcement updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update announcement"),
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteAnnouncement,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-announcements");
      toast.success("Announcement deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete announcement"),
  });
};

export const useFlashSales = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-flash-sales", params],
    queryFn: () => adminManagementApi.getFlashSales(params),
  });

export const useCreateFlashSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createFlashSale,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-flash-sales");
      toast.success("Flash sale created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create flash sale"),
  });
};

export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateFlashSale,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-flash-sales");
      toast.success("Flash sale updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update flash sale"),
  });
};

export const useDeleteFlashSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteFlashSale,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-flash-sales");
      toast.success("Flash sale deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete flash sale"),
  });
};

export const useUpdateProductFeature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateProductFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Product merchandising updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update product"),
  });
};

export const useWarehouses = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-warehouses", params],
    queryFn: () => adminManagementApi.getWarehouses(params),
  });

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createWarehouse,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-warehouses");
      toast.success("Warehouse created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create warehouse"),
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateWarehouse,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-warehouses");
      toast.success("Warehouse updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update warehouse"),
  });
};

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteWarehouse,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-warehouses");
      toast.success("Warehouse deactivated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to deactivate warehouse"),
  });
};

export const useShippingProviders = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-shipping-providers", params],
    queryFn: () => adminManagementApi.getShippingProviders(params),
  });

export const useCreateShippingProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createShippingProvider,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-shipping-providers");
      toast.success("Shipping provider created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create shipping provider"),
  });
};

export const useUpdateShippingProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateShippingProvider,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-shipping-providers");
      toast.success("Shipping provider updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update shipping provider"),
  });
};

export const useDeleteShippingProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteShippingProvider,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-shipping-providers");
      toast.success("Shipping provider deactivated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to deactivate shipping provider"),
  });
};

export const useInventory = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-inventory", params],
    queryFn: () => adminManagementApi.getInventory(params),
  });

export const useUpdateInventoryStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateInventoryStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Stock updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update stock"),
  });
};

export const useAdminReports = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-reports", params],
    queryFn: () => adminManagementApi.getReports(params),
  });

export const useActivityLogs = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-activity-logs", params],
    queryFn: () => adminManagementApi.getActivityLogs(params),
  });

export const useAuditLogs = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-audit-logs", params],
    queryFn: () => adminManagementApi.getAuditLogs(params),
  });

export const useSystemConfig = () =>
  useQuery({
    queryKey: ["admin-system-config"],
    queryFn: adminManagementApi.getSystemConfig,
  });

export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-system-config"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      toast.success("System configuration saved");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save system configuration"),
  });
};

export const useBackups = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-backups", params],
    queryFn: () => adminManagementApi.getBackups(params),
  });

export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-backups"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      toast.success("Backup created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create backup"),
  });
};

export const useDryRunRestore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.dryRunRestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-backups"] });
      toast.success("Dry run completed");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to run restore dry run"),
  });
};

export const useRestoreBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.restoreBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-backups"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      toast.success("Backup restored");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to restore backup"),
  });
};

export const useAdminPolicies = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-policies", params],
    queryFn: () => adminManagementApi.getPolicies(params),
  });

export const useCreatePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createPolicy,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-policies");
      toast.success("Policy created successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create policy"),
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updatePolicy,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-policies");
      toast.success("Policy updated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update policy"),
  });
};

export const useDeletePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deletePolicy,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-policies");
      toast.success("Policy deleted successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete policy"),
  });
};

export const useAdminSellers = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin-sellers", params],
    queryFn: () => adminManagementApi.getSellers(params),
  });

export const useAdminSeller = (id: string) =>
  useQuery({
    queryKey: ["admin-seller", id],
    queryFn: () => adminManagementApi.getSeller(id),
    enabled: !!id,
  });

export const useCreateSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.createSeller,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-sellers");
      toast.success("Seller account created successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create seller account"),
  });
};

export const useUpdateSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.updateSeller,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-sellers");
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      toast.success("Seller account updated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update seller account"),
  });
};

export const useDeleteSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.deleteSeller,
    onSuccess: () => {
      invalidateAdmin(queryClient, "admin-sellers");
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      toast.success("Seller account deactivated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to deactivate seller account"),
  });
};

export const useAdminSubOrders = (params: AdminListParams & { sellerId?: string; riderId?: string }) =>
  useQuery({
    queryKey: ["admin-sub-orders", params],
    queryFn: () => adminManagementApi.getAdminSubOrders(params),
  });

export const useAdminAssignRider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.adminAssignRider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Rider manually assigned successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to assign rider"),
  });
};

export const useAdminSettleCod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminManagementApi.adminSettleCod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("COD liability settled successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to settle COD liability"),
  });
};
