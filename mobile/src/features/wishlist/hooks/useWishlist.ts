import { useQuery } from "@tanstack/react-query";
import { getMyWishlistRequest } from "../api/wishlist.api";
import { useAuthStore } from "../../auth/store/authStore";
import { useWishlistStore } from "../store/wishlistStore";

export const useWishlist = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const localItems = useWishlistStore(state => state.items);

  return useQuery({
    queryKey: ["wishlist", isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) {
        // For guest users, we would theoretically fetch the full product objects 
        // for the IDs in localItems. For now, since we only have IDs, 
        // we might just return the IDs or a placeholder.
        // Usually, the app would need to fetch product details by multi-ID.
        // However, for this implementation, we'll assume the Wishlist Screen 
        // mostly works for logged in users, or we'd need a multi-fetch API.
        return localItems.map(id => ({ _id: id, isMock: true })); 
      }
      return getMyWishlistRequest();
    },
    enabled: true,
  });
};
