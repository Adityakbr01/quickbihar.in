import React, { useEffect } from "react";
import { ChevronLeft, Heart, X } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goBack, goTo } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useWindowWidth } from "@/src/utils/responsive";
import { useWishlist } from "../hooks/useWishlist";
import { useWishlistStore } from "../store/wishlistStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { WishlistCardSkeleton } from "../components/WishlistCardSkeleton";

const WishlistScreen = () => {
  const theme = useTheme() as any;
  const windowWidth = useWindowWidth();
  const columnWidth = (windowWidth - 48) / 2;
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useWishlist();
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Wishlist needs an account — guests go to login first.
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const handleRemove = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleWishlist(productId);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    goBack(navigate, "/(tabs)/clothing/home");
  };

  const renderSkeletons = () => (
    <div className="overflow-auto">
      <div className="px-4 pt-4">
        <div className="flex flex-row flex-wrap justify-between">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <WishlistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: theme.background }}>
      {/* Top app bar (same language as Notifications) */}
      <div className="flex flex-row items-center gap-2 px-3 pt-2 pb-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <ChevronLeft size={22} color={theme.text} />
        </button>

        <div className="flex-1 px-1">
          <h2 className="text-[22px] font-extrabold tracking-tight" style={{ color: theme.text }}>
            My Wishlist
          </h2>
          <p className="mt-0.5 text-xs font-medium" style={{ color: theme.secondaryText }}>
            {items.length > 0
              ? `${items.length} item${items.length === 1 ? "" : "s"} saved`
              : "Items you love, saved for later"}
          </p>
        </div>

        <div className="w-10" />
      </div>

      {isLoading && items.length === 0 ? (
        renderSkeletons()
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10">
          <div
            className="mb-[18px] flex h-[110px] w-[110px] items-center justify-center rounded-full"
            style={{ backgroundColor: theme.primary + "15" }}
          >
            <Heart size={52} color={theme.primary} />
          </div>
          <p className="text-center text-xl font-extrabold tracking-tight" style={{ color: theme.text }}>
            Your Wishlist is Empty
          </p>
          <p
            className="mt-2 max-w-[320px] text-center text-sm leading-5"
            style={{ color: theme.secondaryText }}
          >
            Save items you love here and they&apos;ll be waiting for you when
            you&apos;re ready to buy.
          </p>
          <button
            type="button"
            onClick={() => goTo(navigate, "/")}
            className="mt-5 flex h-12 items-center justify-center rounded-3xl px-6"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="text-sm font-extrabold tracking-wide text-white">
              Continue Shopping
            </span>
          </button>
        </div>
      ) : (
        <div className="overflow-auto">
          <div className="px-4 pt-4">
            <div className="flex flex-row flex-wrap justify-between">
              {items.map((item: any) => {
                const product = item.product || item;
                const pId = String(product._id || product.id || "");
                // Canonical slug URL for navigation (store keys stay id-based for server sync).
                const navId = String(product.slug || product._id || product.id || "");
                if (!pId) return null;

                const imageUrl =
                  product.images?.[0]?.url ||
                  (typeof product.images?.[0] === "string"
                    ? product.images[0]
                    : null) ||
                  product.image ||
                  "https://via.placeholder.com/300x400";

                const rawDiscount =
                  product.discountPercentage ||
                  (product.originalPrice && product.price && product.originalPrice > product.price
                    ? ((product.originalPrice - product.price) / product.originalPrice) * 100
                    : 0);
                const discount = Math.round(Number(rawDiscount) || 0);

                const goToProduct = () =>
                  goTo(navigate, {
                    pathname: "/product/[id]",
                    params: { id: navId },
                  });

                return (
                  <div
                    key={pId}
                    role="link"
                    tabIndex={0}
                    aria-label={product.title || product.name || "Fashion Item"}
                    onClick={goToProduct}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") goToProduct();
                    }}
                    className="mb-5 cursor-pointer overflow-hidden rounded-xl border"
                    style={{
                      width: columnWidth,
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    }}
                  >
                    {/* Image Container with Top-Left Discount Badge & Top-Right Remove Button */}
                    <div
                      className="relative w-full"
                      style={{ height: columnWidth * 1.3, backgroundColor: theme.secondaryBackground }}
                    >
                      <img
                        src={imageUrl}
                        alt={product.title || product.name || "Fashion Item"}
                        className="h-full w-full object-cover"
                      />

                      {discount > 0 && (
                        <div
                          className="absolute top-2 left-2 z-10 rounded px-1.5 py-[3px] shadow"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <span className="text-[10px] font-extrabold tracking-wide text-white">
                            {discount}% OFF
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        aria-label="Remove from wishlist"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(pId);
                        }}
                        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow"
                      >
                        <X size={16} color="#000" />
                      </button>
                    </div>

                    <div className="p-2.5">
                      <p
                        className="mb-0.5 line-clamp-1 text-[11px] font-extrabold tracking-wider uppercase"
                        style={{ color: theme.text }}
                      >
                        {product.brand || "QuickBihar"}
                      </p>
                      <p className="mb-1.5 line-clamp-1 text-xs" style={{ color: theme.secondaryText }}>
                        {product.title || product.name || "Fashion Item"}
                      </p>
                      <div className="flex flex-row items-center gap-1.5">
                        <span className="text-sm font-extrabold" style={{ color: theme.text }}>
                          ₹{(product.price || 0).toLocaleString()}
                        </span>
                        {product.originalPrice &&
                        product.originalPrice > product.price ? (
                          <span
                            className="text-[11px] line-through"
                            style={{ color: theme.secondaryText }}
                          >
                            ₹{product.originalPrice.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistScreen;
