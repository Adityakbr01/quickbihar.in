import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProductsAdminRequest,
  createProductRequest,
  updateProductRequest,
  deleteProductRequest,
  getProductByIdRequest,
  getSimilarProductsRequest,
} from "../api/product.api";
import { IProduct } from "../types/product.types";

/**
 * Hook for admin products list
 */
export const useAdminProducts = () => {
  return useQuery<{ data: IProduct[]; total: number }, Error>({
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

/**
 * Hook for fetching a single product by ID
 */
export const useProductById = (id: string) => {
  return useQuery<IProduct, Error>({
    queryKey: ["product", id],
    queryFn: () => getProductByIdRequest(id),
    enabled: !!id && id !== 'mock', // Don't fetch if id is missing or mock
  });
};

/**
 * Hook for fetching similar products by product ID
 */
export const useSimilarProducts = (id: string) => {
  return useQuery<IProduct[], Error>({
    queryKey: ["similarProducts", id],
    queryFn: () => getSimilarProductsRequest(id),
    enabled: !!id && id !== 'mock',
  });
};


