import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProductsAdminRequest,
  createProductRequest,
  updateProductRequest,
  deleteProductRequest,
} from "../api/product.api";
import { IProduct } from "../types/product.types";

/**
 * Hook for admin products list
 */
export const useAdminProducts = () => {
  return useQuery<IProduct[], Error>({
    queryKey: ["products", "admin"],
    queryFn: getAllProductsAdminRequest,
  });
};

/**
 * Mutation for creating a product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Mutation for updating a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Mutation for deleting a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
