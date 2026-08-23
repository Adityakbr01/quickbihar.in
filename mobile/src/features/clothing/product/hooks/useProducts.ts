import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProductsAdminRequest,
  createProductRequest,
  updateProductRequest,
  deleteProductRequest,
  getProductByIdRequest,
  getSimilarProductsRequest,
  getProductReviewsRequest,
  createProductReviewRequest,
  voteHelpfulReviewRequest,
} from "../api/product.api";
import { IProduct, IReviewsResponse } from "../types/product.types";

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

/**
 * Hook for fetching real product reviews & rating distributions
 */
export const useProductReviews = (id: string, params?: { page?: number; limit?: number }) => {
  return useQuery<IReviewsResponse, Error>({
    queryKey: ["productReviews", id, params?.page || 1],
    queryFn: () => getProductReviewsRequest(id, params) as any,
    enabled: !!id && id !== 'mock',
  });
};

/**
 * Mutation for writing/updating a product review
 */
export const useCreateProductReview = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; title?: string; comment: string; images?: { url: string; fileId?: string }[] }) =>
      createProductReviewRequest(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productReviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
};

/**
 * Mutation for toggling helpful vote on a review
 */
export const useVoteHelpfulReview = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => voteHelpfulReviewRequest(productId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productReviews", productId] });
    },
  });
};


