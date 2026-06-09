import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { catalogManagementApi, QueryParams } from "../api/catalogManagement.api";

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
