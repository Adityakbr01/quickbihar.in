import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Banknote, Box, Calendar, Check, CircleAlert, CircleCheck, CircleX, CreditCard, Expand, Heart, Images, MessageCircle, Palette, RefreshCw, Share2, ShieldCheck, ShoppingBag, Star, StarHalf, Store, ThumbsUp, Zap } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  useProductById,
  useSimilarProducts,
  useProductReviews,
  useCreateProductReview,
  useVoteHelpfulReview,
} from "../hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { socketClient } from "@/src/lib/socket";
import { SocketEvents } from "@/src/constants/socketEvents";
import { Link, useNavigate } from "react-router-dom";

import { IProduct } from "../types/product.types";
import Carousel from "@/src/components/common/EmblaCarousel";

// --- Imports from modular structure ---
import { ExpandableSection } from "./ProductDetail/components/ExpandableSection";
import { RatingBar } from "./ProductDetail/components/RatingBar";
import { SimilarProducts } from "./ProductDetail/components/SimilarProducts";
import ProductDetailSkeleton from "./ProductDetail/components/ProductDetailSkeleton";
import SizeChartModal from "../components/modals/SizeChartModal";
import { WriteReviewModal } from "../components/modals/WriteReviewModal";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import * as Haptics from "@/lib/haptics";
import WishlistHeart from "@/src/components/common/WishlistHeart";
import { goBack, goTo, replaceTo } from "@/src/utils/navigation";

import { useSizeChart, useSizeCharts } from "@/src/features/clothing/sizeChart/hooks/useSizeCharts";
import { useStickyBarBottomOffset } from "@/src/utils/responsive";

interface ProductDetailProps {
  id: string;
}

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1"];

const ProductDetailScreen: React.FC<ProductDetailProps> = ({ id }) => {
  const navigate = useNavigate();
  const theme = useTheme() as any;
  const isDark = theme.text === "#ffffff" || theme.background === "#0f0f0f";
  const { data: product, isLoading } = useProductById(id);
  const { data: similarProducts } = useSimilarProducts(id);
  const { data: reviewsData } = useProductReviews(id);

  // Jewelery products have a dedicated luxury detail screen — redirect
  // rather than rendering an incomplete clothing view.
  useEffect(() => {
    if (product) {
      const prodAny = product as any;
      const isJewelery =
        prodAny.vertical === "JEWELERY" ||
        String(prodAny.vertical || "").toLowerCase() === "jewelery" ||
        String(prodAny.vertical || "").toLowerCase() === "jewellery" ||
        prodAny.module === "jewelery" ||
        prodAny.module === "jewellery" ||
        Boolean(prodAny.jeweleryDetails);

      if (isJewelery) {
        replaceTo(navigate, {
          pathname: "/jewelery/product/[id]" as any,
          params: { id: prodAny.slug || prodAny._id || id },
        });
      }
    }
  }, [product, id, navigate]);

  const createReviewMutation = useCreateProductReview(id);
  const voteHelpfulMutation = useVoteHelpfulReview(id);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const wishlistItems = useWishlistStore(state => state.items);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  // Store keys are product _ids while the route carries the slug —
  // always compare/toggle by _id once the product has loaded.
  const wishlistId = (product as any)?._id || id;
  const isWishlisted = wishlistItems.includes(wishlistId);
  const { isAuthenticated } = useAuthStore();
  // Mobile web tab bar is fixed-position and overlays the viewport bottom —
  // lift the sticky action bar above it (0 on desktop, no visual diff).
  const stickyBarOffset = useStickyBarBottomOffset();

  const queryClient = useQueryClient();

  const dp: Partial<IProduct> = product || {};

  // ── Backend Size Chart Resolution ──
  const sizeChartIdString = typeof dp.sizeChartId === "string" ? dp.sizeChartId : undefined;
  const { data: fetchedSizeChart } = useSizeChart(sizeChartIdString || "");
  const { data: allBackendSizeCharts } = useSizeCharts();

  const activeSizeChart = useMemo(() => {
    // 1. Populated size chart object on product directly from backend
    if (dp.sizeChartId && typeof dp.sizeChartId === "object" && (dp.sizeChartId as any).data) {
      return dp.sizeChartId as any;
    }
    // 2. Fetched by ID from backend /api/v1/size-charts/:id
    if (fetchedSizeChart && fetchedSizeChart.data) {
      return fetchedSizeChart;
    }
    // 3. Matched from backend charts by category / subCategory
    if (allBackendSizeCharts && allBackendSizeCharts.length > 0) {
      const categoryMatch = allBackendSizeCharts.find((c: any) =>
        c.category?.toLowerCase() === dp.subCategory?.toLowerCase() ||
        c.category?.toLowerCase() === dp.category?.toLowerCase() ||
        c.name?.toLowerCase().includes(dp.category?.toLowerCase() || "")
      );
      if (categoryMatch) return categoryMatch;
      const globalChart = allBackendSizeCharts.find((c: any) => c.category?.toLowerCase() === "clothing" || c.scope === "GLOBAL");
      if (globalChart) return globalChart;
    }
    return null;
  }, [dp.sizeChartId, fetchedSizeChart, allBackendSizeCharts, dp.category, dp.subCategory]);

  useEffect(() => {
    // Listen for stock updates for this specific product
    socketClient.on(SocketEvents.STOCK_UPDATE, (data) => {
      if (data.productId === id) {
        console.log(`[ProductDetail] Real-time stock update for SKU ${data.sku}: ${data.newStock}`);

        // Optimistically update the React Query cache
        queryClient.setQueryData(["product", id], (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          const updatedVariants = oldData.data.variants.map((v: any) =>
            v.sku === data.sku ? { ...v, stock: data.newStock } : v
          );

          return {
            ...oldData,
            data: {
              ...oldData.data,
              variants: updatedVariants
            }
          };
        });
      }
    });

    return () => {
      socketClient.off(SocketEvents.STOCK_UPDATE);
    };
  }, [id, queryClient]);

  // ── Derived State ──
  const uniqueColors = useMemo(() => {
    if (!dp.variants) return [];
    return Array.from(new Set(dp.variants.map((v) => (v?.color ? String(v.color).trim() : "")).filter(Boolean)));
  }, [dp.variants]);

  // Default to the first color once variants load (intentional prop→state sync).
  useEffect(() => {
    if (uniqueColors.length > 0 && !selectedColor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueColors, selectedColor]);

  const sizesForColor = useMemo(() => {
    if (!dp.variants || !selectedColor) return [];
    return dp.variants.filter((v) => (v?.color ? String(v.color).trim() : "") === selectedColor);
  }, [dp.variants, selectedColor]);

  const images = dp.images || [];
  const discount =
    dp.discountPercentage
      ? Math.round(Number(dp.discountPercentage))
      : (dp.originalPrice && dp.price
        ? Math.round((1 - dp.price / dp.originalPrice) * 100)
        : 0);

  // Responsive gallery: fills screen width, caps height on tablets/desktop.
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const galleryWidth = windowWidth;
  const galleryHeight = Math.min(windowWidth * 1.2, 560);

  // Delivery estimate — memoized so render stays pure for React Compiler.
  const deliveryDateLabel = useMemo(() => {
    const days = dp.deliveryInfo?.estimatedDays || 3;
    // eslint-disable-next-line react-hooks/purity
    return new Date(Date.now() + days * 86400000).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [dp.deliveryInfo?.estimatedDays]);

  const handleShare = useCallback(async () => {
    const text = `Check out ${dp.title} at ₹${dp.price} on QuickBihar! 🛍️`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch { }
  }, [dp.title, dp.price]);

  const addItem = useCartStore((state) => state.addItem);
  const isAddingToCart = useCartStore((state) => state.isLoading);
  const cartItems = useCartStore((state) => state.items);

  const selectedVariant = useMemo(() => {
    return dp.variants?.find(
      (v) =>
        (!selectedColor || (v?.color ? String(v.color).trim() : "") === selectedColor) &&
        (!selectedSize || String(v?.size || "") === String(selectedSize))
    );
  }, [dp.variants, selectedColor, selectedSize]);

  const hasSizes = sizesForColor.length > 0;
  const hasColors = uniqueColors.length > 0;
  const isSelectionComplete =
    (!hasSizes || selectedSize !== null) && (!hasColors || selectedColor !== null);

  const isInCart = useMemo(() => {
    if (!isSelectionComplete || !selectedVariant) return false;
    return cartItems.some((item) => item.sku === selectedVariant.sku && (item.module ?? "clothing") === "clothing");
  }, [isSelectionComplete, selectedVariant, cartItems]);

  const handleAddToBag = async () => {
    if (isInCart) {
      goTo(navigate, "/clothing/cart");
      return;
    }

    if (!selectedSize && sizesForColor.length > 0) {
      // Haptic-only validation — the size selector is right here on
      // screen, no popup needed.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const variant = selectedVariant || dp.variants?.[0];
    const sku = variant?.sku || "default-sku";

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addItem(dp, sku, 1, "clothing");
    } catch {
      // silent — haptics already signalled error
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      goTo(navigate, "/auth" as any);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await voteHelpfulMutation.mutateAsync(reviewId);
    } catch {
      // silent
    }
  };

  const handleRateAndReview = () => {
    if (!isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      goTo(navigate, "/auth" as any);
      return;
    }
    setShowReviewModal(true);
  };

  // ── Ratings & Reviews Derived State ──
  const totalReviews = reviewsData?.stats?.totalReviews ?? (dp.ratings?.count || 0);
  const averageRating = reviewsData?.stats?.averageRating ?? (dp.ratings?.average || 0);
  const distribution = reviewsData?.stats?.distribution || {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  const starDist = [
    { stars: 5, count: distribution[5] || 0 },
    { stars: 4, count: distribution[4] || 0 },
    { stars: 3, count: distribution[3] || 0 },
    { stars: 2, count: distribution[2] || 0 },
    { stars: 1, count: distribution[1] || 0 },
  ];

  const reviewsList = reviewsData?.reviews || [];

  // ── Return Policy Derived State ──
  const refundPolicyObj = (dp.policyRefs?.returnPolicy || dp.refundPolicy) as any;
  const isReturnable = typeof refundPolicyObj === "object"
    ? (refundPolicyObj?.isReturnable ?? true)
    : !dp.deliveryInfo?.returnPolicy?.toLowerCase()?.includes("non-returnable");

  const returnDays = typeof refundPolicyObj === "object" && refundPolicyObj?.returnWindowDays
    ? refundPolicyObj.returnWindowDays
    : (dp.deliveryInfo?.returnPolicy?.includes("10") ? 10 : 7);

  // ── Store / Seller Info ──
  const storeObj = typeof dp.storeId === "object" ? dp.storeId : null;
  const sellerObj = typeof dp.sellerId === "object" ? dp.sellerId : null;

  // ── Loading State ──
  if (isLoading || !product) {
    return (
      <ProductDetailSkeleton theme={theme} onBack={() => goBack(navigate)} />
    );
  }

  return (
    <>
      <div className="flex-1">
        {/* ═══════════════════════════════════════════
            IMAGE GALLERY
        ═══════════════════════════════════════════ */}
        <div className="relative">
          <Carousel
            loop={false}
            width={galleryWidth}
            height={galleryHeight}
            data={images}
            scrollAnimationDuration={300}
            onSnapToItem={setCarouselIndex}
            renderItem={({ item, index }) => (
              <img
                key={index}
                src={item.url}
                alt={dp.title || "Product image"}
                className="h-full w-full object-cover"
              />
            )}
          />

          {/* Floating Navigation */}
          <div className="absolute top-3.5 right-4 left-4 z-10 flex flex-row items-center justify-between">
            <button
              type="button"
              onClick={() => goBack(navigate)}
              aria-label="Go back"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
              style={{
                backgroundColor: isDark ? "rgba(30, 30, 32, 0.85)" : "rgba(255, 255, 255, 0.9)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              }}
            >
              <ArrowLeft size={20} color={isDark ? "#ffffff" : "#111827"} />
            </button>
            <div className="flex flex-row items-center gap-2.5">
              <WishlistHeart
                isWishlisted={isWishlisted}
                onToggle={() => toggleWishlist(wishlistId, product)}
                size={20}
                activeColor="#FF3B30"
                inactiveColor={isDark ? "#ffffff" : "#111827"}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(30, 30, 32, 0.85)" : "rgba(255, 255, 255, 0.9)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
                }}
              />
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share product"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
                style={{
                  backgroundColor: isDark ? "rgba(30, 30, 32, 0.85)" : "rgba(255, 255, 255, 0.9)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
                }}
              >
                <Share2 size={19} color={isDark ? "#ffffff" : "#111827"} />
              </button>
            </div>
          </div>

          {/* Image Counter Pill */}
          {images.length > 1 && (
            <div
              className="absolute right-4 bottom-[60px] flex flex-row items-center rounded-[14px] border px-2.5 py-1.5"
              style={{
                backgroundColor: isDark ? "rgba(30, 30, 32, 0.85)" : "rgba(255, 255, 255, 0.9)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              }}
            >
              <Images size={12} color={isDark ? "#fff" : "#111827"} className="mr-1" />
              <span className="text-[11px] font-bold" style={{ color: isDark ? "#fff" : "#111827" }}>
                {carouselIndex + 1}/{images.length}
              </span>
            </div>
          )}

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute right-0 bottom-2.5 left-0">
              <div className="flex flex-row gap-2 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={`${dp.title} thumbnail ${i + 1}`}
                    className="h-10 w-10 rounded-md object-cover"
                    style={{
                      borderColor: i === carouselIndex ? theme.primary : theme.border,
                      borderWidth: i === carouselIndex ? 2 : 1,
                      borderStyle: "solid",
                      opacity: i === carouselIndex ? 1 : 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            PRODUCT INFO
        ═══════════════════════════════════════════ */}
        <div className="px-4 pt-4 pb-3" style={{ backgroundColor: theme.background }}>
          {/* Breadcrumb trail (visible match for BreadcrumbList JSON-LD) */}
          <nav className="mb-2 flex flex-row items-center" aria-label="Breadcrumb">
            <Link to="/" className="text-xs" style={{ color: theme.secondaryText }}>
              Home
            </Link>
            <span className="text-xs" style={{ color: theme.secondaryText }}>{"  ›  "}</span>
            <span className="flex-1 truncate text-xs" style={{ color: theme.secondaryText }}>
              {dp.title}
            </span>
          </nav>
          {/* Brand */}
          <p className="mb-1 text-[15px] font-extrabold tracking-wide" style={{ color: theme.text }}>
            {dp.brand || "Brand"}
          </p>

          {/* Title */}
          <h1 className="mb-2.5 text-sm leading-5 font-normal" style={{ color: theme.secondaryText }}>
            {dp.title}
          </h1>

          {/* Rating Chip */}
          {totalReviews > 0 && (
            <div className="mb-3.5 flex flex-row items-center">
              <span className="flex flex-row items-center gap-1 rounded bg-[#34C759] px-1.5 py-0.5">
                <span className="text-xs font-extrabold text-white">{averageRating}</span>
                <Star size={11} color="#fff" fill="#fff" />
              </span>
              <span className="mx-2 h-3.5 w-px bg-gray-300" />
              <span className="text-[13px] font-medium" style={{ color: theme.secondaryText }}>
                {totalReviews} Ratings
              </span>
            </div>
          )}

          {/* Pricing Block */}
          <div className="flex flex-row items-baseline gap-2">
            <span className="text-[22px] font-extrabold" style={{ color: theme.text }}>
              ₹{(dp.isGstApplicable ? dp.price! * (1 + dp.gstPercentage! / 100) : dp.price!)?.toLocaleString()}
            </span>
            {dp.originalPrice && dp.originalPrice > dp.price! && (
              <>
                <span className="text-[13px] font-medium" style={{ color: theme.tertiaryText }}>
                  MRP{" "}
                  <span className="line-through">
                    ₹{dp.originalPrice.toLocaleString()}
                  </span>
                </span>
                <span className="rounded bg-[#FF6B35] px-2 py-0.5 text-[11px] font-extrabold text-white">
                  {Math.round(discount)}% OFF
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs font-medium" style={{ color: theme.success || "#34C759" }}>
            {dp.isGstApplicable ? `Price inclusive of ${dp.gstPercentage}% GST` : "inclusive of all taxes"}
          </p>
        </div>

        {/* ═══════════════════════════════════════════
            COLOR SELECTION
        ═══════════════════════════════════════════ */}
        {uniqueColors.length > 0 && (
          <div className="px-4 py-4" style={{ backgroundColor: theme.background }}>
            <p className="mb-3.5 text-[13px] font-bold tracking-[0.8px]" style={{ color: theme.text }}>
              COLOR:{" "}
              <span style={{ fontWeight: "400", color: theme.secondaryText }}>
                {selectedColor}
              </span>
            </p>
            <div className="flex flex-row flex-wrap gap-2.5">
              {uniqueColors.map((color) => {
                const active = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedSize(null);
                    }}
                    className="cursor-pointer rounded-full border-[1.5px] px-5 py-2"
                    style={{
                      borderColor: active ? theme.primary : theme.border,
                      backgroundColor: active ? theme.primary + "0D" : theme.background,
                    }}
                  >
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: active ? theme.primary : theme.text }}
                    >
                      {color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            SIZE SELECTION
        ═══════════════════════════════════════════ */}
        {sizesForColor.length > 0 && (
          <div className="px-4 py-4" style={{ backgroundColor: theme.background }}>
            <div className="mb-3.5 flex flex-row items-center justify-between">
              <p className="text-[13px] font-bold tracking-[0.8px]" style={{ color: theme.text }}>
                SELECT SIZE
              </p>
              <button
                type="button"
                onClick={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSizeChart(true);
                }}
                className="flex cursor-pointer flex-row items-center gap-1"
              >
                <Expand size={14} color={theme.primary} />
                <span className="text-xs font-bold tracking-wide" style={{ color: theme.primary }}>
                  SIZE GUIDE
                </span>
              </button>
            </div>
            <div className="flex flex-row flex-wrap gap-3">
              {sizesForColor.map((v) => {
                const active = selectedSize === v.size;
                const oos = v.stock === 0;
                return (
                  <button
                    key={v.sku}
                    type="button"
                    disabled={oos}
                    onClick={() => setSelectedSize(v.size)}
                    className="relative flex h-12 min-w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-[1.5px] px-3.5"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: active ? theme.primary : theme.background,
                      borderStyle: oos ? "dashed" : "solid",
                    }}
                  >
                    <span
                      className="block truncate text-center text-[13px] font-bold"
                      style={{
                        color: active ? "#fff" : oos ? theme.tertiaryText : theme.text,
                        textDecoration: oos ? "line-through" : undefined,
                      }}
                    >
                      {v.size}
                    </span>
                    {oos && (
                      <span
                        className="absolute h-px w-[140%] -rotate-45"
                        style={{ backgroundColor: theme.tertiaryText }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedSize &&
              sizesForColor.find((v) => v.size === selectedSize)?.stock! <=
              5 && (
                <div className="mt-3 flex flex-row items-center gap-1.5">
                  <Zap size={14} color={theme.warning} />
                  <span className="text-xs font-semibold" style={{ color: theme.warning }}>
                    Only{" "}
                    {
                      sizesForColor.find((v) => v.size === selectedSize)
                        ?.stock
                    }{" "}
                    left! Order soon
                  </span>
                </div>
              )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            DELIVERY INFO
        ═══════════════════════════════════════════ */}
        <div className="px-4 py-4" style={{ backgroundColor: theme.background }}>
          <p className="mb-3.5 text-[13px] font-bold tracking-[0.8px]" style={{ color: theme.text }}>
            DELIVERY OPTIONS
          </p>
          <div className="mb-5 flex flex-col gap-2.5">
            <div
              className="flex flex-row items-center gap-3 rounded-xl border p-3.5"
              style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
            >
              <Box size={22} color={theme.primary} />
              <div className="flex-1">
                <p className="mb-0.5 text-[13px] font-bold" style={{ color: theme.text }}>
                  Get it by {deliveryDateLabel}
                </p>
                <p className="text-xs" style={{ color: theme.secondaryText }}>
                  Express hyperlocal delivery by QuickBihar
                </p>
              </div>
            </div>
            {dp.deliveryInfo?.isExpressAvailable && (
              <div
                className="flex flex-row items-center gap-3 rounded-xl border p-3.5"
                style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
              >
                <Zap size={22} color="#F59E0B" />
                <div className="flex-1">
                  <p className="mb-0.5 text-[13px] font-bold" style={{ color: theme.text }}>
                    Express Fast-Track Dispatch
                  </p>
                  <p className="text-xs" style={{ color: theme.secondaryText }}>
                    Get it within 24–48 hours
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Policies Icons Row */}
          <div className="flex flex-row justify-around pt-2">
            {[
              {
                icon: RefreshCw,
                label: isReturnable ? `${returnDays} Day\nReturns` : "Non\nReturnable",
              },
              {
                icon: dp.deliveryInfo?.isCodAvailable ? Banknote : CreditCard,
                label: dp.deliveryInfo?.isCodAvailable ? "Pay On\nDelivery" : "Secure\nPayment"
              },
              {
                icon: ShieldCheck,
                label: "100% Genuine\nProduct"
              },
              {
                icon: Store,
                label: "Verified\nLocal Store"
              },
            ].map((p, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.tertiaryBackground }}
                >
                  <p.icon size={20} color={theme.primary} />
                </span>
                <span className="text-center text-[10px] leading-[14px] font-semibold whitespace-pre-line" style={{ color: theme.secondaryText }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            1. PRODUCT DETAILS (Expandable Section)
        ═══════════════════════════════════════════ */}
        <div className="px-4" style={{ backgroundColor: theme.background }}>
          <ExpandableSection
            title="Product Details & Specifications"
            theme={theme}
            defaultOpen={true}
          >
            {dp.description ? (
              <p className="mb-4 text-[13px] leading-5" style={{ color: theme.secondaryText }}>
                {dp.description}
              </p>
            ) : null}

            {/* Complete Dynamic Specifications Table */}
            <div className="mt-1">
              {[
                { k: "Brand", v: dp.brand },
                { k: "Category", v: dp.category },
                { k: "Sub-Category", v: dp.subCategory },
                { k: "Gender", v: dp.gender },
                { k: "Material / Fabric", v: dp.details?.material },
                { k: "Fit", v: dp.details?.fit },
                { k: "Pattern", v: dp.details?.pattern },
                { k: "Sleeve Length", v: dp.details?.sleeve },
                { k: "Collar / Neckline", v: dp.details?.collar },
                { k: "Wash & Care", v: dp.details?.washCare },
                { k: "Occasion", v: dp.details?.occasion },
                { k: "Fabric Care", v: dp.details?.fabricCare },
                { k: "Style / SKU Code", v: selectedVariant?.sku || dp.details?.sku || dp.variants?.[0]?.sku },
                { k: "Tags", v: dp.tags?.join(", ") },
              ]
                .filter((x) => Boolean(x.v))
                .map((spec, i) => (
                  <div
                    key={i}
                    className="flex flex-row border-b py-2.5"
                    style={{ borderBottomColor: theme.border }}
                  >
                    <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>
                      {spec.k}
                    </span>
                    <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>
                      {spec.v}
                    </span>
                  </div>
                ))}
            </div>

            {/* Food Specifications if present */}
            {dp.foodDetails && (
              <div className="mt-2.5">
                {[
                  { k: "Food Type", v: dp.foodDetails.vegNonVeg },
                  { k: "Shelf Life", v: dp.foodDetails.shelfLife },
                  { k: "Serving Size", v: dp.foodDetails.servingSize },
                  { k: "Calories", v: dp.foodDetails.calories ? `${dp.foodDetails.calories} kcal` : undefined },
                  { k: "Ingredients", v: dp.foodDetails.ingredients?.join(", ") },
                ]
                  .filter((x) => Boolean(x.v))
                  .map((spec, i) => (
                    <div key={i} className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                      <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>{spec.k}</span>
                      <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>{spec.v}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Jewelry Specifications if present */}
            {dp.jeweleryDetails && (
              <div className="mt-2.5">
                {[
                  { k: "Metal Type", v: dp.jeweleryDetails.metalType },
                  { k: "Purity", v: dp.jeweleryDetails.purity },
                  { k: "BIS Hallmark", v: dp.jeweleryDetails.hallmark ? "Certified Hallmark" : undefined },
                  { k: "Gemstone", v: dp.jeweleryDetails.gemstone },
                  { k: "Weight", v: dp.jeweleryDetails.weightGrams ? `${dp.jeweleryDetails.weightGrams} gm` : undefined },
                ]
                  .filter((x) => Boolean(x.v))
                  .map((spec, i) => (
                    <div key={i} className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                      <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>{spec.k}</span>
                      <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>{spec.v}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Verified Seller & Store Source */}
            <div
              className="mt-4 flex flex-col gap-1.5 rounded-[10px] border p-3.5"
              style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
            >
              <div className="flex flex-row items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: theme.text }}>
                    {storeObj?.name || (typeof sellerObj === "object" && sellerObj?.businessName) || "QuickBihar Verified Partner Store"}
                  </p>
                  <p className="text-xs" style={{ color: theme.secondaryText }}>
                    {storeObj?.city ? `${storeObj.city}, ${storeObj.state || 'Bihar'}` : "Bihar, India"}
                  </p>
                </div>
                <span className="flex flex-row items-center gap-1 rounded bg-[#E8F5E9] px-1.5 py-0.5">
                  <CircleCheck size={14} color="#2E7D32" />
                  <span className="text-[10px] font-bold" style={{ color: "#2E7D32" }}>
                    {storeObj?.rating ? `${storeObj.rating} ★ Verified` : "Verified Partner"}
                  </span>
                </span>
              </div>
            </div>
          </ExpandableSection>

          {/* ═══════════════════════════════════════════
              2. RETURN & EXCHANGE POLICY
          ═══════════════════════════════════════════ */}
          <ExpandableSection title="Return & Exchange Policy" theme={theme} defaultOpen={false}>
            <div className="flex flex-col gap-2.5">
              {!isReturnable ? (
                <div className="mb-2.5 flex flex-row items-center gap-2.5 rounded-lg bg-[#FFEBEE] p-3">
                  <CircleAlert size={20} color="#D32F2F" />
                  <p className="flex-1 text-xs leading-[17px] font-semibold" style={{ color: "#C62828" }}>
                    Non-Returnable: Due to hygiene, safety, or perishable standards, this item cannot be returned once delivered.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-row items-center gap-2.5">
                    <Calendar size={20} color={theme.primary} />
                    <span className="text-[13px] font-bold" style={{ color: theme.text }}>
                      {returnDays} Days Easy Return & Exchange
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-2.5">
                    <Box size={20} color={theme.success || "#34C759"} />
                    <span className="text-[13px]" style={{ color: theme.secondaryText }}>
                      Free doorstep return pickup by QuickBihar rider
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-2.5">
                    <CreditCard size={20} color={theme.primary} />
                    <span className="text-[13px]" style={{ color: theme.secondaryText }}>
                      100% instant refund directly credited to your original payment source (UPI / Bank / Card) upon return pickup
                    </span>
                  </div>

                  {/* Conditions Checklist */}
                  <div className="mt-2 rounded-lg p-3" style={{ backgroundColor: theme.tertiaryBackground }}>
                    <p className="mb-2 text-xs font-bold" style={{ color: theme.text }}>
                      RETURN & EXCHANGE CONDITIONS:
                    </p>
                    {[
                      "Item must be unused, unwashed, and in its original undamaged condition",
                      "All brand tags, price tags, and barcodes must be attached and intact",
                      "Item must be returned in its original brand box/packaging",
                      "Doorstep quality check (QC) is verified instantly by the delivery partner",
                    ].map((condition, idx) => (
                      <div key={idx} className="mb-1.5 flex flex-row gap-2">
                        <CircleCheck size={15} color={theme.success || "#34C759"} />
                        <span className="flex-1 text-xs leading-4" style={{ color: theme.secondaryText }}>
                          {condition}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ExpandableSection>

          {/* ═══════════════════════════════════════════
              3. COMPLIANCE AND MANUFACTURING
          ═══════════════════════════════════════════ */}
          <ExpandableSection title="Compliance & Manufacturing" theme={theme} defaultOpen={false}>
            <div className="mt-1">
              <div className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>Country of Origin</span>
                <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>{dp.compliance?.countryOfOrigin || "India 🇮🇳"}</span>
              </div>
              <div className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>Manufacturer</span>
                <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>
                  {dp.compliance?.manufacturerDetail || (storeObj?.name ? `${storeObj.name}, ${storeObj.city || ''} ${storeObj.state || 'Bihar'}` : "QuickBihar Verified Partner, Bihar")}
                </span>
              </div>
              <div className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>Packer</span>
                <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>
                  {dp.compliance?.packerDetail || dp.compliance?.manufacturerDetail || "QuickBihar Logistics Hub, Bihar"}
                </span>
              </div>
              {dp.compliance?.importerDetail && (
                <div className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                  <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>Importer</span>
                  <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>{dp.compliance.importerDetail}</span>
                </div>
              )}
              <div className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>Generic / Commodity Name</span>
                <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>{dp.compliance?.genericName || dp.subCategory || dp.category || "Apparel / Consumer Goods"}</span>
              </div>
              <div className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>Dispatched From</span>
                <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>{dp.logistics?.warehouseName || storeObj?.name || "QuickBihar Express Hub, Bihar"}</span>
              </div>
              <div className="flex flex-row border-b py-2.5" style={{ borderBottomColor: theme.border }}>
                <span className="flex-[0.4] text-[13px] font-medium" style={{ color: theme.secondaryText }}>Tax Transparency</span>
                <span className="flex-[0.6] text-[13px] font-semibold" style={{ color: theme.text }}>
                  {dp.isGstApplicable ? `Includes ${dp.gstPercentage}% GST (Tax invoice included with shipment)` : "Price inclusive of all taxes"}
                </span>
              </div>
            </div>

            {/* Consumer Grievance & Customer Care */}
            <div className="mt-3 flex flex-col gap-1 rounded-lg p-3" style={{ backgroundColor: theme.tertiaryBackground }}>
              <p className="text-xs font-bold" style={{ color: theme.text }}>
                CUSTOMER CARE & GRIEVANCE REDRESSAL:
              </p>
              <p className="text-xs" style={{ color: theme.secondaryText }}>
                Email: <span className="font-semibold" style={{ color: theme.primary }}>support@quickbihar.com</span>
              </p>
              <p className="text-xs" style={{ color: theme.secondaryText }}>
                Helpline: <span className="font-semibold" style={{ color: theme.text }}>+91 95077 12255</span> (Mon-Sun, 8 AM - 10 PM)
              </p>
            </div>
          </ExpandableSection>
        </div>

        {/* ═══════════════════════════════════════════
            4. RATINGS & REVIEWS (Expandable & Interactive)
        ═══════════════════════════════════════════ */}
        <div className="px-4 py-4" style={{ backgroundColor: theme.background }}>
          <ExpandableSection
            title={`Ratings & Reviews (${totalReviews})`}
            theme={theme}
            defaultOpen={true}
          >
            {/* Rating Overview */}
            <div className="mb-6 flex flex-row">
              <div className="flex flex-col items-center border-r pr-5" style={{ borderRightColor: "#E5E7EB" }}>
                <p className="text-[38px] leading-[44px] font-extrabold" style={{ color: theme.text }}>
                  {averageRating > 0 ? averageRating : "0.0"}
                </p>
                <div className="mt-1 mb-1 flex flex-row gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    star <= Math.floor(averageRating) ? (
                      <Star key={star} size={14} color="#F59E0B" fill="#F59E0B" />
                    ) : star - 0.5 <= averageRating ? (
                      <StarHalf key={star} size={14} color="#F59E0B" />
                    ) : (
                      <Star key={star} size={14} color="#F59E0B" />
                    )
                  ))}
                </div>
                <p className="text-[11px] font-medium" style={{ color: theme.tertiaryText }}>
                  {totalReviews} verified ratings
                </p>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 pl-4">
                {starDist.map((d) => (
                  <RatingBar
                    key={d.stars}
                    stars={d.stars}
                    count={d.count}
                    total={totalReviews || 1}
                    theme={theme}
                  />
                ))}
              </div>
            </div>

            {/* Write Review Action Row */}
            <div
              className="mt-2 mb-3 flex flex-row items-center justify-between border-t py-3"
              style={{ borderTopColor: theme.border }}
            >
              <span className="text-[13px] font-semibold" style={{ color: theme.text }}>
                Have you used this product?
              </span>
              <button
                type="button"
                onClick={handleRateAndReview}
                className="flex cursor-pointer flex-row items-center gap-1.5 rounded-md border px-3.5 py-2"
                style={{ borderColor: theme.primary, backgroundColor: theme.primary + "10" }}
              >
                <Star size={14} color={theme.primary} fill={theme.primary} />
                <span className="text-xs font-bold" style={{ color: theme.primary }}>
                  Rate & Review
                </span>
              </button>
            </div>

            {/* Review Cards List */}
            {reviewsList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <MessageCircle size={38} color={theme.tertiaryText} />
                <p className="text-[15px] font-bold" style={{ color: theme.text }}>No Reviews Yet</p>
                <p className="px-5 text-center text-xs leading-[18px]" style={{ color: theme.secondaryText }}>
                  Be the first to share your thoughts and help other shoppers make the right choice!
                </p>
              </div>
            ) : (
              <div>
                {reviewsList.map((review: any, idx: number) => {
                  const userName = review.user?.fullName || review.user || "Customer";
                  const initial = userName.charAt(0).toUpperCase();
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const formattedDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : review.date || "Verified Purchase";

                  return (
                    <div
                      key={review._id || review.id || idx}
                      className="border-b py-4"
                      style={{ borderBottomColor: theme.border }}
                    >
                      {/* Star + Title row */}
                      <div className="mb-2 flex flex-row items-center gap-2.5">
                        <span
                          className="flex flex-row items-center gap-1 rounded px-1.5 py-0.5"
                          style={{
                            backgroundColor:
                              review.rating >= 4
                                ? "#34C759"
                                : review.rating >= 3
                                  ? "#F59E0B"
                                  : "#FF3B30",
                          }}
                        >
                          <span className="text-[11px] font-extrabold text-white">{review.rating}</span>
                          <Star size={10} color="#fff" fill="#fff" />
                        </span>
                        <span className="block flex-1 truncate text-sm font-semibold" style={{ color: theme.text }}>
                          {review.title || "Customer Review"}
                        </span>
                      </div>

                      {/* Comment */}
                      <p className="mb-2 text-[13px] leading-[19px]" style={{ color: theme.secondaryText }}>
                        {review.comment}
                      </p>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="mb-2.5 flex flex-row gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                          {review.images.map((img: any, i: number) => {
                            const imgUrl = typeof img === "string" ? img : img.url;
                            return (
                              <img
                                key={i}
                                src={imgUrl}
                                alt={`Review photo ${i + 1}`}
                                className="mr-2 h-16 w-16 rounded-lg border object-cover"
                                style={{ borderColor: theme.border }}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* Reviewer Info */}
                      <div className="flex flex-row items-center gap-1.5">
                        <span
                          className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {initial}
                        </span>
                        <span className="text-[13px] font-semibold" style={{ color: theme.text }}>
                          {userName}
                        </span>
                        {(review.isVerifiedBuyer) && (
                          <span className="flex flex-row items-center gap-1 rounded bg-[#E8F5E9] px-1.5 py-0.5">
                            <Check size={11} color="#2E7D32" />
                            <span className="text-[10px] font-bold" style={{ color: "#2E7D32" }}>Verified</span>
                          </span>
                        )}
                        <span className="text-[8px]" style={{ color: theme.tertiaryText }}>
                          •
                        </span>
                        <span className="text-[11px]" style={{ color: theme.tertiaryText }}>
                          {formattedDate}
                        </span>
                        <span className="flex-1" />
                        <button
                          type="button"
                          onClick={() => review._id && handleHelpfulVote(review._id)}
                          className="flex cursor-pointer flex-row items-center gap-1 rounded border px-2 py-1"
                          style={{
                            borderColor: review.hasVotedHelpful ? theme.primary : theme.border,
                            backgroundColor: review.hasVotedHelpful ? theme.primary + "15" : "transparent",
                          }}
                        >
                          {review.hasVotedHelpful ? (
                            <ThumbsUp size={13} color={theme.primary} />
                          ) : (
                            <ThumbsUp size={13} color={theme.secondaryText} />
                          )}
                          <span
                            className="text-xs font-semibold"
                            style={{ color: review.hasVotedHelpful ? theme.primary : theme.secondaryText }}
                          >
                            {review.helpfulCount ?? review.helpful ?? 0}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ExpandableSection>
        </div>

        {/* ═══════════════════════════════════════════
            SIMILAR PRODUCTS
        ═══════════════════════════════════════════ */}
        {similarProducts && similarProducts.length > 0 && (
          <SimilarProducts products={similarProducts} theme={theme} />
        )}

        {/* Bottom spacer — clears the fixed action bar + tab bar */}
        <div style={{ height: 100 + stickyBarOffset }} />
      </div>

      {/* ═══════════════════════════════════════════
          BOTTOM ACTION BAR — viewport-fixed on web so it is always
          visible. Bottom offset lifts it above the fixed tab bar
          on mobile web.
      ═══════════════════════════════════════════ */}
      <div
        className="fixed right-0 left-0 z-[60] flex flex-row gap-3 border-t px-4 pt-3 pb-3"
        style={{
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          bottom: stickyBarOffset,
          width: "100%",
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              navigate("/auth");
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleWishlist(wishlistId, product);
          }}
          className="flex h-12 min-w-0 flex-1 cursor-pointer flex-row items-center justify-center gap-2 rounded-md border"
          style={{
            borderColor: isWishlisted ? (isDark ? "rgba(255, 59, 48, 0.4)" : "#FFD2D0") : theme.border,
            backgroundColor: isWishlisted ? (isDark ? "rgba(255, 59, 48, 0.12)" : "#FFF5F5") : "transparent",
          }}
        >
          {isWishlisted ? (
            <Heart size={22} color="#FF3B30" fill="#FF3B30" />
          ) : (
            <Heart size={22} color={theme.text} />
          )}
          <span
            className="text-[13px] font-bold tracking-wide"
            style={{ color: isWishlisted ? "#FF3B30" : theme.text }}
          >
            {isWishlisted ? "WISHLISTED" : "WISHLIST"}
          </span>
        </button>
        {/* Add to Bag Button */}
        {(() => {
          const isOutOfStock = !!((dp.totalStock ?? 0) <= 0 || (selectedSize && (selectedVariant?.stock ?? 0) <= 0));
          const buttonDisabled = isAddingToCart || (!isSelectionComplete) || (isOutOfStock && !isInCart);

          // Determine button text and icon
          let buttonText = "ADD TO BAG";
          let ButtonIcon: LucideIcon = ShoppingBag;

          if (isInCart) {
            buttonText = "GO TO CART";
            ButtonIcon = ArrowRight;
          } else if (isOutOfStock) {
            buttonText = "OUT OF STOCK";
            ButtonIcon = CircleX;
          } else if (!isSelectionComplete) {
            if (hasColors && !selectedColor) {
              buttonText = "SELECT COLOR";
              ButtonIcon = Palette;
            } else if (hasSizes && !selectedSize) {
              buttonText = "SELECT SIZE";
              ButtonIcon = Expand;
            }
          }

          return (
            <button
              type="button"
              onClick={handleAddToBag}
              disabled={buttonDisabled}
              className="flex h-12 min-w-0 flex-[1.5] cursor-pointer flex-row items-center justify-center gap-2 rounded-md"
              style={{
                backgroundColor: isInCart
                  ? theme.primary
                  : buttonDisabled
                    ? theme.secondaryText || "#9ca3af"
                    : theme.primary,
                opacity: isAddingToCart ? 0.7 : 1
              }}
            >
              {isAddingToCart ? (
                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  <ButtonIcon size={20} color="#fff" />
                  <span className="text-sm font-extrabold tracking-wide text-white">
                    {buttonText}
                  </span>
                </>
              )}
            </button>
          );
        })()}
      </div>

      {/* Modals */}
      <SizeChartModal
        visible={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        sizeChart={activeSizeChart}
        selectedSize={selectedSize}
        category={dp.category || dp.subCategory}
        theme={theme}
      />

      <WriteReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={async (reviewData) => {
          await createReviewMutation.mutateAsync(reviewData);
        }}
        productTitle={dp.title}
        theme={theme}
      />
    </>
  );
};

export default ProductDetailScreen;
