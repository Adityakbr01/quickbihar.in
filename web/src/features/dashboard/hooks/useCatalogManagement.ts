import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { catalogManagementApi, type AdminBanner, type DeliveryRiderQuery, type QueryParams } from "../api/catalogManagement.api";

export const useAdminOrders = (params: QueryParams) =>
  useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => catalogManagementApi.getOrders(params),
  });

export const useAdminCoupons = (params: QueryParams) =>
  useQuery({
    queryKey: ["admin-coupons", params],
    queryFn: () => catalogManagementApi.getCoupons(params),
  });

export const useAdminProducts = (params: QueryParams) =>
  useQuery({
    queryKey: ["admin-products", params],
    queryFn: () => catalogManagementApi.getProducts(params),
  });

export const useAdminCategories = (params: QueryParams) =>
  useQuery({
    queryKey: ["admin-categories", params],
    queryFn: () => catalogManagementApi.getCategories(params),
  });

export const useAdminSellerSizeCharts = (sellerId: string) =>
  useQuery({
    queryKey: ["admin-seller-size-charts", sellerId],
    queryFn: () => catalogManagementApi.getSellerSizeCharts(sellerId),
    enabled: Boolean(sellerId),
  });

export const useAdminRefundPolicies = () =>
  useQuery({
    queryKey: ["admin-refund-policies"],
    queryFn: catalogManagementApi.getRefundPolicies,
  });

export const useAdminProductWarehouses = () =>
  useQuery({
    queryKey: ["admin-product-warehouses"],
    queryFn: catalogManagementApi.getWarehouses,
  });

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update order"),
  });
};

export const useDeliveryRiders = (params: DeliveryRiderQuery = {}) =>
  useQuery({
    queryKey: ["admin-delivery-riders", params],
    queryFn: () => catalogManagementApi.getDeliveryRiders(params),
  });

export const useAssignDeliveryPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.assignDeliveryPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-riders"] });
      toast.success("Delivery partner assigned");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to assign delivery partner"),
  });
};

export const useUnassignDeliveryPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.unassignDeliveryPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-riders"] });
      toast.success("Delivery partner unassigned");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to unassign delivery partner"),
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create coupon"),
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.updateCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update coupon"),
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete coupon"),
  });
};

export const useCreateCatalogProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create product"),
  });
};

export const useUpdateCatalogProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update product"),
  });
};

export const useDeleteCatalogProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete product"),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create category"),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update category"),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete category"),
  });
};

export const useAdminSizeCharts = () =>
  useQuery({
    queryKey: ["admin-size-charts"],
    queryFn: catalogManagementApi.getSizeCharts,
  });

export const useCreateAdminSizeChart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.createSizeChart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-size-charts"] });
      toast.success("Size chart created successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create size chart"),
  });
};

export const useUpdateAdminSizeChart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.updateSizeChart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-size-charts"] });
      toast.success("Size chart updated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update size chart"),
  });
};

export const useDeleteAdminSizeChart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.deleteSizeChart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-size-charts"] });
      toast.success("Size chart deleted successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete size chart"),
  });
};

export const useAdminBanners = () =>
  useQuery({
    queryKey: ["admin-banners"],
    queryFn: catalogManagementApi.getAdminBanners,
  });

export const useCreateAdminBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.createAdminBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner created successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create banner"),
  });
};

export const useUpdateAdminBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.updateAdminBanner,
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-banners"] });
      const previous = queryClient.getQueryData<AdminBanner[]>(["admin-banners"]);
      queryClient.setQueryData<AdminBanner[]>(["admin-banners"], (old) =>
        old?.map((b) => (b._id === id ? { ...b, ...payload } : b))
      );
      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-banners"], context.previous);
      }
      toast.error(error.message || "Failed to update banner");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner updated successfully");
    },
  });
};

export const useDeleteAdminBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogManagementApi.deleteAdminBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner deleted successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete banner"),
  });
};
