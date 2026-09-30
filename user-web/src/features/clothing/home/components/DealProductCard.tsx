import WishlistHeart from "@/src/components/common/WishlistHeart";
import { IProduct } from "@/src/features/clothing/product/types/product.types";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ArrowRight, Bike, ShoppingBag, Star } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import LazyLottie from "@/src/components/common/LazyLottie";
import React from "react";

import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
import { DealProduct as MockProduct } from "../lib/dealsConfig";
import { VariantSelectorBottomSheet } from "../../product/components/modals/VariantSelectorBottomSheet";

const cyclerLottie = "/lottie/Cycler.json";
import { cn } from "@/src/lib/utils";

interface DealProductCardProps {
  product: IProduct | MockProduct;
  width: number;
}

export const DealProductCard = ({ product, width }: DealProductCardProps) => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const addItem = useCartStore(state => state.addItem);
  const cartItems = useCartStore(state => state.items);

  const id = (product as IProduct)._id || 'mock';
  const isWishlisted = useWishlistStore(state => state.items.includes(id));
  const toggleWishlist = useWishlistStore(state => state.toggleItem);

  const [isSheetVisible, setIsSheetVisible] = React.useState(false);

  const productVariants = (product as IProduct).variants;
  const variants = React.useMemo(
    () => productVariants || [],
    [productVariants],
  );

  const isSelectionApplicable = variants.length > 0;
  const sku = variants[0]?.sku || (product as MockProduct).id || 'default-sku';

  const isInCart = React.useMemo(() => {
    if (isSelectionApplicable) return false;
    return cartItems.some(cartItem => cartItem.sku === sku && (cartItem.module ?? "clothing") === "clothing");
  }, [cartItems, sku, isSelectionApplicable]);

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
      await addItem(product, sku, 1, "clothing");
    } catch {
      // silent — haptics already fired
    }
  };

  // Helper to handle both Mock and Real Data mapping
  const computedDiscount = React.useMemo(() => {
    const p = product as IProduct;
    if (p.discountPercentage && Number(p.discountPercentage) > 0) {
      return `${Math.round(Number(p.discountPercentage))}% OFF`;
    }
    if (typeof p.originalPrice === 'number' && typeof p.price === 'number' && p.originalPrice > p.price) {
      const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      if (pct > 0) return `${pct}% OFF`;
    }
    if (p.discountLabel) {
      const num = parseFloat(p.discountLabel);
      if (!isNaN(num) && num > 0 && !p.discountLabel.includes("%")) {
        return `${Math.round(num)}% OFF`;
      }
      return p.discountLabel;
    }
    return (product as MockProduct).discount || null;
  }, [product]);

  const p = product as IProduct;
  // Narrow phones (≤320px ⇒ card <150px): shrink overlays so the
  // rating pill and Add button never overlap.
  const isNarrowCard = width < 150;
  const isWideCard = width > 240;
  const productData = {
    title: p.title || (product as MockProduct).title || "",
    image: p.images?.[0]?.url || (product as MockProduct).image || "",
    price: typeof product.price === 'number' ? `₹${product.price.toLocaleString()}` : product.price,
    originalPrice: typeof product.originalPrice === 'number' ? `₹${product.originalPrice.toLocaleString()}` : product.originalPrice,
    discount: computedDiscount,
    rating: Number(p.ratings?.average) || 0,
    reviews: Number(p.ratings?.count) || 0,
    subtitle: p.brand ? `${p.brand}${p.category ? ` • ${p.category}` : ""}` : p.category || "",
    tag: p.isTrending ? "Trending" : p.isNewArrival ? "New" : null,
    delivery: p.deliveryInfo?.isExpressAvailable
      ? "Express Delivery"
      : p.deliveryInfo?.estimatedDays
      ? `${p.deliveryInfo.estimatedDays} Days Delivery`
      : null,
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={productData.title}
      title={`Shop ${productData.title} on QuickBihar`}
      onClick={() => {
        const pid = (product as IProduct).slug || (product as IProduct)._id || 'mock';
        goTo(navigate, { pathname: "/product/[id]", params: { id: pid } });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          const pid = (product as IProduct).slug || (product as IProduct)._id || 'mock';
          goTo(navigate, { pathname: "/product/[id]", params: { id: pid } });
        }
      }}
      className={cn("cursor-pointer overflow-hidden rounded-2xl border", isWideCard && "rounded-[18px] shadow-xl")}
      style={{
        backgroundColor: theme.background,
        borderColor: theme.border,
        width,
      }}
    >
      {/* Image & Overlays */}
      <div className="relative w-full" style={{ height: isWideCard ? Math.min(300, Math.round(width * 0.92)) : 180 }}>
        <img
          src={productData.image}
          alt={`${productData.title} - Fashion Deal in Bihar`}
          title={`${productData.title} - QuickBihar Deals`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />

        {/* Top-Left Discount Badge */}
        {productData.discount ? (
          <div className="absolute top-2 left-2 z-10 rounded-md bg-red-500 px-1.5 py-0.5">
            <span className="text-[10px] font-extrabold tracking-wide text-white">{productData.discount}</span>
          </div>
        ) : null}

        {productData.tag ? (
          <div
            className="absolute left-2 z-[9] rounded-md bg-black/75 px-1.5 py-1"
            style={productData.discount ? { top: 34 } : { top: 8 }}
          >
            <span className="text-[9px] font-extrabold text-white uppercase">{productData.tag}</span>
          </div>
        ) : null}

        {/* Favorite absolute button */}
        <WishlistHeart
          isWishlisted={isWishlisted}
          onToggle={() => toggleWishlist(id, product)}
          size={16}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: 6,
            borderRadius: 20
          }}
        />

        {/* Real Rating Pill (Only shown if product has real ratings) */}
        {productData.reviews > 0 && productData.rating > 0 ? (
          <div
            className="absolute bottom-2.5 left-2 z-[5] flex flex-row items-center gap-1 rounded-lg border border-white/20 bg-slate-900/90 py-1 shadow"
            style={{ paddingLeft: 7, paddingRight: isNarrowCard ? 5 : 7 }}
          >
            <Star size={10} color="#f59e0b" fill="#f59e0b" />
            <span className="text-[11px] font-bold text-white">
              {productData.rating.toFixed(1)}
              {!isNarrowCard && (
                <span className="text-[10px] font-medium text-white/75">
                  {" "}| {productData.reviews}
                </span>
              )}
            </span>
          </div>
        ) : null}

        {/* Add to Cart absolute button */}
        {(product as IProduct).totalStock > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="absolute right-1 bottom-2.5 flex flex-row items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 shadow"
            style={{
              ...(isInCart ? { backgroundColor: theme.primary } : null),
              ...(isNarrowCard ? { paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6, right: 6 } : null),
            }}
          >
            {isInCart ? (
              <ArrowRight size={14} color="#fff" />
            ) : (
              <ShoppingBag size={14} color="#fff" />
            )}
            <span className="text-xs font-bold text-white">
              {isInCart ? "Go to Cart" : "Add"}
            </span>
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <p className="mb-1 line-clamp-1 text-[13px] leading-[18px] font-semibold" style={{ color: theme.text }}>
          {productData.title}
        </p>

        {productData.subtitle ? (
          <p className="mb-2 line-clamp-1 text-[11px] font-medium" style={{ color: theme.secondaryText }}>
            {productData.subtitle}
          </p>
        ) : null}

        <div className="mb-2 flex flex-row flex-wrap items-center gap-1.5">
          <span className="text-base font-extrabold" style={{ color: theme.text }}>
            {productData.price}
          </span>
          {productData.originalPrice && productData.originalPrice !== productData.price ? (
            <span className="text-xs line-through" style={{ color: theme.secondaryText }}>
              {productData.originalPrice}
            </span>
          ) : null}
        </div>

        {productData.delivery ? (
          <div className="flex flex-row items-center gap-1">
            {productData.delivery.toLowerCase().includes("express") ? (
              <LazyLottie
                source={cyclerLottie}
                autoPlay
                loop
                style={{ width: 22, height: 22, marginLeft: -4, marginRight: -2 }}
                resizeMode="contain"
              />
            ) : (
              <Bike size={14} color={theme.success || "#10b981"} />
            )}
            <span className="text-[10px] font-bold" style={{ color: theme.success || "#10b981" }}>
              {productData.delivery}
            </span>
          </div>
        ) : null}
      </div>

      {isSheetVisible && (
        <VariantSelectorBottomSheet
          visible={isSheetVisible}
          onClose={() => setIsSheetVisible(false)}
          product={product}
          theme={theme}
        />
      )}
    </div>
  );
};
