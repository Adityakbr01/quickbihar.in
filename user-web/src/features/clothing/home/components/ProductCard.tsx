import React from "react";
import { ArrowRight, CircleX, ShoppingBag, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "@/src/features/clothing/product/types/product.types";
import { Product as MockProduct } from "../lib/mockData";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import * as Haptics from "@/lib/haptics";
import WishlistHeart from "@/src/components/common/WishlistHeart";
import { VariantSelectorBottomSheet } from "../../product/components/modals/VariantSelectorBottomSheet";
import { formatPrice } from "@/src/utils/formatPrice";
import { cn } from "@/src/lib/utils";

interface ProductCardProps {
  item: IProduct | MockProduct;
  /** Desktop grid cell width — fills parent; mobile keeps legacy 240px. */
  desktopWidth?: number;
}

export const ProductCard = ({ item, desktopWidth }: ProductCardProps) => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const id = (item as IProduct)._id || 'mock';
  const isWishlisted = useWishlistStore((state) => state.items.includes(id));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);

  const [isSheetVisible, setIsSheetVisible] = React.useState(false);

  const variants = (item as IProduct).variants || [];
  const isSelectionApplicable = variants.length > 0;
  const sku = variants[0]?.sku || (item as MockProduct).id || 'default-sku';

  const isInCart = useCartStore(
    React.useCallback(
      (state) => {
        if (isSelectionApplicable) return false;
        return state.items.some((cartItem) => cartItem.sku === sku && (cartItem.module ?? "clothing") === "clothing");
      },
      [sku, isSelectionApplicable]
    )
  );

  const handleAddToCart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isInCart) {
      goTo(navigate, "/clothing/cart");
      return;
    }
    if (isSelectionApplicable) {
      setIsSheetVisible(true);
      return;
    }

    try {
      await addItem(item, sku, 1, "clothing");
    } catch {
      // silent — haptics already fired
    }
  };

  // Helper to handle both Mock and Real Data mapping.
  // Computed during render (no manual memo) so React Compiler can optimize it.
  const p = item as IProduct;
  const numPrice = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || 0));
  const numOrig = typeof p.originalPrice === 'number' ? p.originalPrice : parseFloat(String(p.originalPrice || 0));
  const hasDiscount = numOrig > numPrice;

  const discount = (() => {
    if (p.discountPercentage && Number(p.discountPercentage) > 0) {
      return `${Math.round(Number(p.discountPercentage))}% OFF`;
    }
    if (hasDiscount && numOrig > 0) {
      const pct = Math.round(((numOrig - numPrice) / numOrig) * 100);
      if (pct > 0) return `${pct}% OFF`;
    }
    if (p.discountLabel) {
      const num = parseFloat(p.discountLabel);
      if (!isNaN(num) && num > 0 && !p.discountLabel.includes("%")) {
        return `${Math.round(num)}% OFF`;
      }
      return p.discountLabel;
    }
    return null;
  })();

  const resolvedTitle = p.title || (item as MockProduct).name || "Fashion Product";
  const productData = {
    title: resolvedTitle,
    name: resolvedTitle,
    image: p.images?.[0]?.url || (item as MockProduct).image || "",
    price: numPrice > 0 ? formatPrice(numPrice) : (typeof item.price === 'string' ? item.price : "₹0"),
    originalPrice: hasDiscount ? formatPrice(numOrig) : null,
    hasDiscount,
    discount,
    rating: Number(p.ratings?.average) || 0,
    reviews: Number(p.ratings?.count) || 0,
  };

  const outOfStock = (item as IProduct).totalStock <= 0;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={productData.title}
      title={`View ${productData.title} on QuickBihar`}
      onClick={() => {
        // Canonical slug URL for navigation (wishlist/cart keys above stay id-based).
        goTo(navigate, { pathname: "/product/[id]", params: { id: (item as IProduct).slug || id } });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          goTo(navigate, { pathname: "/product/[id]", params: { id: (item as IProduct).slug || id } });
        }
      }}
      className="w-full cursor-pointer overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: theme.background,
        borderColor: theme.border,
        ...(desktopWidth ? { width: "100%" } : null),
      }}
    >
      {/* Image & Overlays */}
      <div className="relative h-[200px] w-full">
        <img
          src={productData.image}
          alt={`${productData.title} - Shop Online in Bihar`}
          title={`${productData.title} | QuickBihar`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />

        {productData.discount ? (
          <div className="absolute top-2 left-2 z-10 rounded-md bg-red-500 px-1.5 py-0.5">
            <span className="text-[10px] font-extrabold tracking-wide text-white">{productData.discount}</span>
          </div>
        ) : null}

        {/* Favorite absolute button */}
        <WishlistHeart
          isWishlisted={isWishlisted}
          onToggle={() => toggleWishlist(id, item)}
          size={16}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.9)',
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {productData.reviews > 0 && productData.rating > 0 ? (
          <div className="absolute bottom-2.5 left-2 z-[5] flex flex-row items-center gap-1 rounded-lg border border-white/20 bg-slate-900/90 px-2 py-1 shadow">
            <Star size={11} color="#f59e0b" fill="#f59e0b" />
            <span className="text-[11px] font-bold text-white">
              {productData.rating.toFixed(1)}{" "}
              <span className="text-[10px] font-medium text-white/75">
                | {productData.reviews}
              </span>
            </span>
          </div>
        ) : null}

        {/* Add to Cart absolute button (like DealProductCard) */}
        <button
          type="button"
          disabled={outOfStock}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          className="absolute right-2.5 bottom-2.5 flex flex-row items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 shadow"
          style={{
            opacity: outOfStock ? 0.5 : 1,
            ...(outOfStock ? { backgroundColor: theme.secondaryText } : null),
            ...(isInCart ? { backgroundColor: theme.primary } : null),
          }}
        >
          {outOfStock ? (
            <CircleX size={14} color="#fff" />
          ) : isInCart ? (
            <ArrowRight size={14} color="#fff" />
          ) : (
            <ShoppingBag size={14} color="#fff" />
          )}
          <span className="text-xs font-bold text-white">
            {outOfStock ? "Out of Stock" : isInCart ? "Go to Cart" : "Add"}
          </span>
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <p
          className={cn("mb-1 line-clamp-2 h-9 text-[13px] leading-[18px] font-semibold")}
          style={{ color: theme.text }}
        >
          {productData.name}
        </p>

        <div className="mb-2 flex flex-row flex-wrap items-center gap-1.5">
          <span className="text-base font-extrabold" style={{ color: theme.text }}>
            {productData.price}
          </span>
          {productData.hasDiscount && productData.originalPrice ? (
            <span className="text-xs line-through" style={{ color: theme.secondaryText }}>
              {productData.originalPrice}
            </span>
          ) : null}
        </div>
      </div>

      {isSheetVisible && (
        <VariantSelectorBottomSheet
          visible={isSheetVisible}
          onClose={() => setIsSheetVisible(false)}
          product={item}
          theme={theme}
        />
      )}
    </div>
  );
};
