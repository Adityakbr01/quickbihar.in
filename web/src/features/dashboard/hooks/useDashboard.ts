import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, Product } from "../api/dashboard.api";
import { toast } from "sonner";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: dashboardApi.getProducts,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create product");
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      dashboardApi.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update product");
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete product");
    },
  });
};
