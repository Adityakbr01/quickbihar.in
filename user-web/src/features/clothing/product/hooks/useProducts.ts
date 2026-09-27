import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductByIdRequest,
  getProductBySlugRequest,
  getSimilarProductsRequest,
  getProductReviewsRequest,
  createProductReviewRequest,
  voteHelpfulReviewRequest,
} from "../api/product.api";
import { IProduct, IReview, IReviewsResponse } from "../types/product.types";

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
 * Hook for fetching a single product by slug (canonical SEO lookup, plan §26 A1).
 */
export const useProductBySlug = (slug: string) => {
  return useQuery<IProduct, Error>({
    queryKey: ["product", "slug", slug],
    queryFn: () => getProductBySlugRequest(slug),
    enabled: !!slug && slug !== 'mock',
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
 * Mutation for writing/updating a product review with instant optimistic cache update
 */
export const useCreateProductReview = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; title?: string; comment: string; images?: { url: string; fileId?: string }[] }) =>
      createProductReviewRequest(productId, data),
    onMutate: async (newReview) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["productReviews", productId] });
      await queryClient.cancelQueries({ queryKey: ["product", productId] });

      const prevReviews = queryClient.getQueryData(["productReviews", productId, 1]);
      const prevProduct = queryClient.getQueryData(["product", productId]);

      // Optimistically update productReviews cache
      queryClient.setQueriesData({ queryKey: ["productReviews", productId] }, (old: any) => {
        const optimisticReview: IReview = {
          _id: "temp-" + Date.now(),
          productId,
          rating: newReview.rating,
          title: newReview.title || "Customer Review",
          comment: newReview.comment,
          images: newReview.images || [],
          isVerifiedBuyer: true,
          user: {
            fullName: "You",
          },
          helpfulCount: 0,
          hasVotedHelpful: false,
          createdAt: new Date().toISOString(),
        };

        if (!old) {
          return {
            reviews: [optimisticReview],
            stats: {
              averageRating: newReview.rating,
              totalReviews: 1,
              distribution: {
                5: newReview.rating === 5 ? 1 : 0,
                4: newReview.rating === 4 ? 1 : 0,
                3: newReview.rating === 3 ? 1 : 0,
                2: newReview.rating === 2 ? 1 : 0,
                1: newReview.rating === 1 ? 1 : 0,
              },
              positivePercentage: newReview.rating >= 4 ? 100 : 0,
            },
            pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
          };
        }

        const existingReviews = old.reviews || [];
        const stats = old.stats || {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          positivePercentage: 100,
        };

        const total = (stats.totalReviews || 0) + 1;
        const currentSum = (stats.averageRating || 0) * (stats.totalReviews || 0);
        const newAverage = Number(((currentSum + newReview.rating) / total).toFixed(1));
        const ratingKey = Math.min(5, Math.max(1, Math.round(newReview.rating)));

        const newDistribution = {
          ...stats.distribution,
          [ratingKey]: (stats.distribution?.[ratingKey] || 0) + 1,
        };

        return {
          ...old,
          reviews: [optimisticReview, ...existingReviews],
          stats: {
            ...stats,
            averageRating: newAverage,
            totalReviews: total,
            distribution: newDistribution,
          },
          pagination: {
            ...old.pagination,
            totalCount: total,
          },
        };
      });

      // Optimistically update product detail ratings count/average
      queryClient.setQueryData(["product", productId], (oldProd: any) => {
        if (!oldProd) return oldProd;
        const count = (oldProd.ratings?.count || 0) + 1;
        const avg = Number((((oldProd.ratings?.average || 0) * (oldProd.ratings?.count || 0) + newReview.rating) / count).toFixed(1));
        return {
          ...oldProd,
          ratings: {
            average: avg,
            count: count,
          },
        };
      });

      return { prevReviews, prevProduct };
    },
    onError: (_err, _newReview, context) => {
      if (context?.prevReviews) {
        queryClient.setQueryData(["productReviews", productId, 1], context.prevReviews);
      }
      if (context?.prevProduct) {
        queryClient.setQueryData(["product", productId], context.prevProduct);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["productReviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
};

/**
 * Mutation for toggling helpful vote on a review with instant optimistic cache update
 */
export const useVoteHelpfulReview = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => voteHelpfulReviewRequest(productId, reviewId),
    onMutate: async (reviewId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["productReviews", productId] });

      const prevReviews = queryClient.getQueryData(["productReviews", productId, 1]);

      // Optimistically update all review queries matching this product
      queryClient.setQueriesData({ queryKey: ["productReviews", productId] }, (old: any) => {
        if (!old || !old.reviews) return old;
        return {
          ...old,
          reviews: old.reviews.map((rev: any) => {
            const currentId = rev._id || rev.id;
            if (currentId === reviewId) {
              const currentlyHelpful = !!rev.hasVotedHelpful;
              const currentCount = Number(rev.helpfulCount ?? rev.helpful ?? 0);
              const newCount = currentlyHelpful ? Math.max(0, currentCount - 1) : currentCount + 1;
              return {
                ...rev,
                hasVotedHelpful: !currentlyHelpful,
                helpfulCount: newCount,
                helpful: newCount,
              };
            }
            return rev;
          }),
        };
      });

      return { prevReviews };
    },
    onError: (_err, _reviewId, context) => {
      if (context?.prevReviews) {
        queryClient.setQueryData(["productReviews", productId, 1], context.prevReviews);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["productReviews", productId] });
    },
  });
};
