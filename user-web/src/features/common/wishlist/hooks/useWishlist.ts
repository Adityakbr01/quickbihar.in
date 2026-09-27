import { useQuery } from "@tanstack/react-query";
import { getMyWishlistRequest } from "../api/wishlist.api";
import { useWishlistStore } from "../store/wishlistStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { getProductByIdRequest } from "@/src/features/clothing/product/api/product.api";

export const useWishlist = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const localItems = useWishlistStore((state) => state.items);
  const cachedProducts = useWishlistStore((state) => state.cachedProducts);

  return useQuery({
    queryKey: ["wishlist", isAuthenticated, localItems],
    queryFn: async () => {
      const serverProductMap = new Map<string, any>();
      const serverIds: string[] = [];

      if (isAuthenticated) {
        try {
          const serverWishlist = await getMyWishlistRequest();
          if (Array.isArray(serverWishlist)) {
            serverWishlist.forEach((item: any) => {
              const prod = item.product || item;
              const pId = String(prod?._id || prod?.id || item.productId || "");
              if (pId && prod && (prod.title || prod.name)) {
                serverProductMap.set(pId, prod);
                serverIds.push(pId);
              }
            });
          }
        } catch (err) {
          console.error("Error fetching server wishlist:", err);
        }
      }

      // Combine all known IDs from server and local storage
      const allIds = Array.from(
        new Set(
          [...serverIds, ...localItems]
            .map((id) => String(id || "").trim())
            .filter((id) => Boolean(id) && id !== "mock")
        )
      );

      if (allIds.length === 0) return [];

      // Update store IDs + modules if server had additional items
      if (
        serverIds.length > 0 &&
        serverIds.some((sId) => !localItems.includes(sId))
      ) {
        useWishlistStore.setState((s) => {
          const modules = { ...s.modules };
          serverProductMap.forEach((prod, pId) => {
            if (prod?.vertical === "JEWELERY") modules[pId] = "jewelery";
            else if (modules[pId] !== "jewelery") modules[pId] = "clothing";
          });
          return {
            items: Array.from(new Set([...s.items, ...serverIds])),
            modules,
          };
        });
      }

      // Resolve complete product data for every ID
      const resolvedProducts = await Promise.all(
        allIds.map(async (id) => {
          // 1. From server response
          if (serverProductMap.has(id)) {
            return serverProductMap.get(id);
          }

          // 2. From local cached products
          const cached = cachedProducts[id];
          if (cached && (cached.title || cached.name)) {
            return cached;
          }

          // 3. Fallback: fetch individual product
          try {
            const fetched = await getProductByIdRequest(id);
            if (fetched && (fetched._id || (fetched as any).id)) {
              return fetched;
            }
          } catch {
            return null;
          }
          return null;
        })
      );

      const validProducts = resolvedProducts.filter(Boolean);

      // Clothing wishlist shows clothing products only — jewelery pieces
      // belong to the jewelery wishlist even though the id list is shared.
      const clothingProducts = validProducts.filter(
        (p: any) => p?.vertical !== "JEWELERY",
      );

      // Cache newly resolved products without re-mutating if identical
      let hasNew = false;
      const newCache = { ...cachedProducts };
      validProducts.forEach((p: any) => {
        const pId = String(p._id || p.id);
        if (pId && !cachedProducts[pId]) {
          newCache[pId] = p;
          hasNew = true;
        }
      });
      if (hasNew) {
        useWishlistStore.setState({ cachedProducts: newCache });
      }

      return clothingProducts;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};
