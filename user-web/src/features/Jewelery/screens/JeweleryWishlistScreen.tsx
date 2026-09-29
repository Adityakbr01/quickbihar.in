import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React, { useEffect, useMemo } from "react";

import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { useJeweleryProduct } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { toJeweleryProduct } from "@/src/features/Jewelery/api/jewelery.api";
import { useWishlistStore, selectWishlistIds } from "@/src/features/common/wishlist/store/wishlistStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

function WishlistRow({ id, cached }: { id: string; cached?: any }) {
  const { data } = useJeweleryProduct(cached ? undefined : id);
  const product = useMemo(
    () => (cached ? toJeweleryProduct(cached) : data),
    [cached, data]
  );
  if (!product) return null;
  return <ProductCard product={product} />;
}

export default function JeweleryWishlistScreen() {
  const navigate = useNavigate();
  const colors = useColors();
  // Stable primitive store subscriptions — compute wishlistIds with useMemo
  // rather than returning a fresh array from the selector on every render.
  const items = useWishlistStore((s) => s.items);
  const modules = useWishlistStore((s) => s.modules);
  const cachedProducts = useWishlistStore((s) => s.cachedProducts);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  // Wishlist needs an account — guests go to login first.
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const wishlistIds = useMemo(
    () => selectWishlistIds({ items, modules, cachedProducts }, "jewelery"),
    [items, modules, cachedProducts]
  );

  const topPad = 16;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      <div
        className="flex flex-row items-center justify-between border-b px-5 pb-3.5"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
        }}
      >
        <h1
          className="text-[22px] tracking-[3px]"
          style={{ color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" }}
        >
          Wishlist
        </h1>
        <span
          className="text-xs"
          style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
        >
          {wishlistIds.length} piece{wishlistIds.length !== 1 ? "s" : ""}
        </span>
      </div>

      {wishlistIds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3.5 p-10">
          <Heart size={40} color={colors.midGray} />
          <span
            className="text-center text-[22px] leading-[30px]"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_500Medium_Italic",
            }}
          >
            Save for later, dream about now.
          </span>
          <span
            className="text-center text-sm leading-[22px]"
            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
          >
            Tap the heart icon on any piece to save it here.
          </span>
          <button
            type="button"
            className="mt-2 cursor-pointer rounded-[1px] border px-6 py-3"
            style={{ borderColor: colors.gold, borderWidth: 1 }}
            onClick={() => goTo(navigate, "/jewelery/collections" as any)}
          >
            <span
              className="text-xs tracking-[1px]"
              style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
            >
              Browse Collections →
            </span>
          </button>
        </div>
      ) : (
        <div className="overflow-y-auto p-4">
          <div className="flex flex-row flex-wrap justify-between gap-2">
            {wishlistIds.map((id) => (
              <WishlistRow key={id} id={id} cached={cachedProducts[id]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
