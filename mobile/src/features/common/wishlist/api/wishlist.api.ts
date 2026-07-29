import axiosInstance from "@/src/api/axiosInstance";

/**
 * Fetch the current user's entire wishlist
 */
export const getMyWishlistRequest = async () => {
  const response = await axiosInstance.get(`/wishlist`);
  return response.data.data;
};

/**
 * Toggle a product in the wishlist
 */
export const toggleWishlistRequest = async (productId: string) => {
  const response = await axiosInstance.post(`/wishlist/toggle`, { productId });
  return response.data;
};

/**
 * Sync local wishlist IDs with the server
 */
export const syncWishlistRequest = async (productIds: string[]) => {
  if (!productIds || productIds.length === 0) return { syncCount: 0 };
  const response = await axiosInstance.post(`/wishlist/sync`, { productIds });
  return response.data.data;
};
