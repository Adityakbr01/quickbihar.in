import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Share,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { useRouter, Link } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { IProduct } from "../types/product.types";
import Animated, {
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";

// --- Imports from modular structure ---
import { styles as s } from "./ProductDetail/styles";
import { ExpandableSection } from "./ProductDetail/components/ExpandableSection";
import { RatingBar } from "./ProductDetail/components/RatingBar";
import { SimilarProducts } from "./ProductDetail/components/SimilarProducts";
import ProductDetailSkeleton from "./ProductDetail/components/ProductDetailSkeleton";
import SizeChartModal from "../components/modals/SizeChartModal";
import { WriteReviewModal } from "../components/modals/WriteReviewModal";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { breadcrumbJsonLd, productJsonLd, productMeta } from "@/src/lib/seo";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import WishlistHeart from "@/src/components/common/WishlistHeart";

import { useSizeChart, useSizeCharts } from "@/src/features/clothing/sizeChart/hooks/useSizeCharts";

interface ProductDetailProps {
  id: string;
  /** Build-time manifest data for SSG — used for the initial SeoHead render
   * before useProductById resolves. Never affects interactive UI behaviour. */
  initialProduct?: Partial<IProduct>;
}

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1"];

const ProductDetailScreen: React.FC<ProductDetailProps> = ({ id, initialProduct }) => {
  const router = useRouter();
  const theme = useTheme() as any;
  const isDark = theme.text === "#ffffff" || theme.background === "#0f0f0f";
  const { data: product, isLoading } = useProductById(id);
  // Use manifest seed for the initial SSG pass; live query takes over post-hydration.
  // ponytail: single guard here rather than per-caller; initialProduct is SSG-only.
  const seoProduct = (product || initialProduct) as IProduct | undefined;
  const { data: similarProducts } = useSimilarProducts(id);
  const { data: reviewsData } = useProductReviews(id);

  const createReviewMutation = useCreateProductReview(id);
  const voteHelpfulMutation = useVoteHelpfulReview(id);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const wishlistItems = useWishlistStore(state => state.items);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const isWishlisted = wishlistItems.includes(id);

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
  const { width: windowWidth } = useWindowDimensions();
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
    try {
      await Share.share({
        message: `Check out ${dp.title} at ₹${dp.price} on QuickBihar! 🛍️`,
      });
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
    return cartItems.some((item) => item.sku === selectedVariant.sku);
  }, [isSelectionComplete, selectedVariant, cartItems]);

  const handleAddToBag = async () => {
    if (isInCart) {
      router.push("/clothing/cart");
      return;
    }

    if (!selectedSize && sizesForColor.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Select Size",
        text2: "Please select a size before adding to bag",
        props: { id: Date.now() }
      });
      return;
    }

    const variant = selectedVariant || dp.variants?.[0];
    const sku = variant?.sku || "default-sku";

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addItem(dp, sku, 1);
      Toast.show({
        type: "success",
        text1: "Added to Bag",
        text2: `${dp.title} has been added to your bag`,
        props: { id: Date.now() }
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add item to bag",
        props: { id: Date.now() }
      });
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await voteHelpfulMutation.mutateAsync(reviewId);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Vote Failed",
        text2: error?.response?.data?.message || "Please login to vote",
      });
    }
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

  // ── SEO (web head tags; null-render on native) ──
  // Computed ABOVE the loading guard so SeoHead renders at SSG time even when
  // product is undefined (initialProduct is the manifest seed at that point).
  const seoMeta = seoProduct ? productMeta(seoProduct) : null;
  const seoJsonLd = seoMeta ? [
    productJsonLd(seoProduct, seoMeta.canonical),
    breadcrumbJsonLd(seoMeta.canonical, [{ name: "Home", path: "/" }, { name: seoProduct?.title || "Product" }]),
  ] : [];

  // ── Loading State ──
  if (isLoading || !product) {
    return (
      <SafeViewWrapper>
        {seoMeta && <SeoHead meta={seoMeta} jsonLd={seoJsonLd} />}
        <ProductDetailSkeleton theme={theme} onBack={() => router.back()} />
      </SafeViewWrapper>
    );
  }

  return (
    <SafeViewWrapper>
      {seoMeta && <SeoHead meta={seoMeta} jsonLd={seoJsonLd} />}
      <ScrollView
        style={s.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ═══════════════════════════════════════════
            IMAGE GALLERY
        ═══════════════════════════════════════════ */}
        <View style={s.galleryContainer}>
          <Carousel
            loop={false}
            width={galleryWidth}
            height={galleryHeight}
            data={images}
            scrollAnimationDuration={300}
            onSnapToItem={setCarouselIndex}
            renderItem={({ item, index }) => (
              <ExpoImage
                source={{ uri: item.url }}
                style={s.galleryImage}
                contentFit="cover"
                alt={dp.title || "Product image"}
                priority={index === 0 ? "high" : "normal"}
              />
            )}
          />

          {/* Floating Navigation */}
          <View style={s.galleryNav}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                s.navBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(30, 30, 32, 0.85)"
                    : "rgba(255, 255, 255, 0.9)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? "#ffffff" : "#111827"}
              />
            </TouchableOpacity>
            <View style={s.navRight}>
              <WishlistHeart
                isWishlisted={isWishlisted}
                onToggle={() => toggleWishlist(id, product)}
                size={20}
                activeColor="#FF3B30"
                inactiveColor={isDark ? "#ffffff" : "#111827"}
                style={[
                  s.navBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(30, 30, 32, 0.85)"
                      : "rgba(255, 255, 255, 0.9)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              />
              <TouchableOpacity
                onPress={handleShare}
                style={[
                  s.navBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(30, 30, 32, 0.85)"
                      : "rgba(255, 255, 255, 0.9)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="share-outline"
                  size={19}
                  color={isDark ? "#ffffff" : "#111827"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Counter Pill */}
          {images.length > 1 && (
            <View
              style={[
                s.counterPill,
                {
                  backgroundColor: isDark
                    ? "rgba(30, 30, 32, 0.85)"
                    : "rgba(255, 255, 255, 0.9)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              <Ionicons
                name="images-outline"
                size={12}
                color={isDark ? "#fff" : "#111827"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  s.counterText,
                  { color: isDark ? "#fff" : "#111827" },
                ]}
              >
                {carouselIndex + 1}/{images.length}
              </Text>
            </View>
          )}

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.thumbStrip}
              contentContainerStyle={s.thumbStripContent}
            >
              {images.map((img, i) => (
                <TouchableOpacity key={i} activeOpacity={0.8}>
                  <Image
                    source={{ uri: img.url }}
                    style={[
                      s.thumbImage,
                      {
                        borderColor:
                          i === carouselIndex ? theme.primary : theme.border,
                        borderWidth: i === carouselIndex ? 2 : 1,
                        opacity: i === carouselIndex ? 1 : 0.6,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ═══════════════════════════════════════════
            PRODUCT INFO
        ═══════════════════════════════════════════ */}
        <View style={[s.infoSection, { backgroundColor: theme.background }]}>
          {/* Breadcrumb trail (visible match for BreadcrumbList JSON-LD) */}
          <View
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
            accessibilityRole="list"
          >
            <Link href="/" style={{ color: theme.secondaryText, fontSize: 12 }}>
              Home
            </Link>
            <Text style={{ color: theme.secondaryText, fontSize: 12 }}>{"  ›  "}</Text>
            <Text numberOfLines={1} style={{ color: theme.secondaryText, fontSize: 12, flex: 1 }}>
              {dp.title}
            </Text>
          </View>
          {/* Brand */}
          <Animated.Text
            entering={FadeIn.delay(100)}
            style={[s.brandName, { color: theme.text }]}
          >
            {dp.brand || "Brand"}
          </Animated.Text>

          {/* Title */}
          <Animated.Text
            entering={FadeIn.delay(150)}
            style={[s.productTitle, { color: theme.secondaryText }]}
          >
            {dp.title}
          </Animated.Text>

          {/* Rating Chip */}
          {totalReviews > 0 && (
            <Animated.View entering={FadeIn.delay(200)} style={s.ratingChip}>
              <View style={s.ratingChipInner}>
                <Text style={s.ratingChipScore}>{averageRating}</Text>
                <Ionicons name="star" size={11} color="#fff" />
              </View>
              <View style={s.ratingDividerLine} />
              <Text style={[s.ratingChipCount, { color: theme.secondaryText }]}>
                {totalReviews} Ratings
              </Text>
            </Animated.View>
          )}

          {/* Pricing Block */}
          <Animated.View entering={FadeIn.delay(250)} style={s.priceBlock}>
            <Text style={[s.currentPrice, { color: theme.text }]}>
              ₹{(dp.isGstApplicable ? dp.price! * (1 + dp.gstPercentage! / 100) : dp.price!)?.toLocaleString()}
            </Text>
            {dp.originalPrice && dp.originalPrice > dp.price! && (
              <>
                <Text style={[s.mrp, { color: theme.tertiaryText }]}>
                  MRP{" "}
                  <Text style={s.mrpStrike}>
                    ₹{dp.originalPrice.toLocaleString()}
                  </Text>
                </Text>
                <View style={s.discountChip}>
                  <Text style={s.discountChipText}>{Math.round(discount)}% OFF</Text>
                </View>
              </>
            )}
          </Animated.View>
          <Text style={[s.taxInfo, { color: theme.success || "#34C759" }]}>
            {dp.isGstApplicable ? `Price inclusive of ${dp.gstPercentage}% GST` : "inclusive of all taxes"}
          </Text>
        </View>

        {/* ═══════════════════════════════════════════
            COLOR SELECTION
        ═══════════════════════════════════════════ */}
        {uniqueColors.length > 0 && (
          <View
            style={[s.selectionSection, { backgroundColor: theme.background }]}
          >
            <Text style={[s.selectionLabel, { color: theme.text }]}>
              COLOR:{" "}
              <Text style={{ fontWeight: "400", color: theme.secondaryText }}>
                {selectedColor}
              </Text>
            </Text>
            <View style={s.colorRow}>
              {uniqueColors.map((color) => {
                const active = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    onPress={() => {
                      setSelectedColor(color);
                      setSelectedSize(null);
                    }}
                    style={[
                      s.colorOption,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active
                          ? theme.primary + "0D"
                          : theme.background,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.colorOptionText,
                        { color: active ? theme.primary : theme.text },
                      ]}
                    >
                      {color}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════
            SIZE SELECTION
        ═══════════════════════════════════════════ */}
        {sizesForColor.length > 0 && (
          <View
            style={[s.selectionSection, { backgroundColor: theme.background }]}
          >
            <View style={s.sizeHeader}>
              <Text style={[s.selectionLabel, { color: theme.text }]}>
                SELECT SIZE
              </Text>
              <TouchableOpacity
                style={s.sizeGuideBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSizeChart(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="resize-outline"
                  size={14}
                  color={theme.primary}
                />
                <Text style={[s.sizeGuideText, { color: theme.primary }]}>
                  SIZE GUIDE
                </Text>
              </TouchableOpacity>
            </View>
            <View style={s.sizeRow}>
              {sizesForColor.map((v) => {
                const active = selectedSize === v.size;
                const oos = v.stock === 0;
                return (
                  <TouchableOpacity
                    key={v.sku}
                    disabled={oos}
                    onPress={() => setSelectedSize(v.size)}
                    style={[
                      s.sizeCircle,
                      {
                        borderColor: active
                          ? theme.primary
                          : oos
                            ? theme.border
                            : theme.border,
                        backgroundColor: active
                          ? theme.primary
                          : theme.background,
                      },
                      oos && s.sizeCircleOOS,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.sizeText,
                        {
                          color: active
                            ? "#fff"
                            : oos
                              ? theme.tertiaryText
                              : theme.text,
                        },
                        oos && s.sizeTextOOS,
                      ]}
                      numberOfLines={1}
                    >
                      {v.size}
                    </Text>
                    {oos && (
                      <View
                        style={[
                          s.oosLine,
                          { backgroundColor: theme.tertiaryText },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedSize &&
              sizesForColor.find((v) => v.size === selectedSize)?.stock! <=
              5 && (
                <Animated.View entering={FadeIn} style={s.lowStockRow}>
                  <Ionicons name="flash" size={14} color={theme.warning} />
                  <Text style={[s.lowStockText, { color: theme.warning }]}>
                    Only{" "}
                    {
                      sizesForColor.find((v) => v.size === selectedSize)
                        ?.stock
                    }{" "}
                    left! Order soon
                  </Text>
                </Animated.View>
              )}
          </View>
        )}

        {/* ═══════════════════════════════════════════
            DELIVERY INFO
        ═══════════════════════════════════════════ */}
        <View
          style={[s.deliverySection, { backgroundColor: theme.background }]}
        >
          <Text style={[s.selectionLabel, { color: theme.text }]}>
            DELIVERY OPTIONS
          </Text>
          <View style={s.deliveryCards}>
            <View
              style={[
                s.deliveryCard,
                {
                  backgroundColor: theme.tertiaryBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="cube-outline" size={22} color={theme.primary} />
              <View style={s.deliveryCardText}>
                <Text style={[s.deliveryCardTitle, { color: theme.text }]}>
                  Get it by {deliveryDateLabel}
                </Text>
                <Text style={[s.deliveryCardSub, { color: theme.secondaryText }]}>
                  Express hyperlocal delivery by QuickBihar
                </Text>
              </View>
            </View>
            {dp.deliveryInfo?.isExpressAvailable && (
              <View
                style={[
                  s.deliveryCard,
                  {
                    backgroundColor: theme.tertiaryBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Ionicons name="flash-outline" size={22} color="#F59E0B" />
                <View style={s.deliveryCardText}>
                  <Text style={[s.deliveryCardTitle, { color: theme.text }]}>
                    Express Fast-Track Dispatch
                  </Text>
                  <Text style={[s.deliveryCardSub, { color: theme.secondaryText }]}>
                    Get it within 24–48 hours
                  </Text>
                </View>
              </View>
            )}
          </View>
          {/* Policies Icons Row */}
          <View style={s.policiesRow}>
            {[
              {
                icon: "refresh-outline",
                label: isReturnable ? `${returnDays} Day\nReturns` : "Non\nReturnable",
              },
              {
                icon: dp.deliveryInfo?.isCodAvailable ? "cash-outline" : "card-outline",
                label: dp.deliveryInfo?.isCodAvailable ? "Pay On\nDelivery" : "Secure\nPayment"
              },
              {
                icon: "shield-checkmark-outline",
                label: "100% Genuine\nProduct"
              },
              {
                icon: "storefront-outline",
                label: "Verified\nLocal Store"
              },
            ].map((p, i) => (
              <View key={i} style={s.policyItem}>
                <View
                  style={[
                    s.policyIcon,
                    { backgroundColor: theme.tertiaryBackground },
                  ]}
                >
                  <Ionicons name={p.icon as any} size={20} color={theme.primary} />
                </View>
                <Text style={[s.policyLabel, { color: theme.secondaryText }]}>
                  {p.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            1. PRODUCT DETAILS (Expandable Section)
        ═══════════════════════════════════════════ */}
        <View
          style={[
            s.expandableSectionWrap,
            { backgroundColor: theme.background },
          ]}
        >
          <ExpandableSection
            title="Product Details & Specifications"
            theme={theme}
            defaultOpen={true}
          >
            {dp.description ? (
              <Text style={[s.descriptionText, { color: theme.secondaryText }]}>
                {dp.description}
              </Text>
            ) : null}

            {/* Complete Dynamic Specifications Table */}
            <View style={s.specsTable}>
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
                  <View
                    key={i}
                    style={[
                      s.specTableRow,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <Text style={[s.specKey, { color: theme.secondaryText }]}>
                      {spec.k}
                    </Text>
                    <Text style={[s.specVal, { color: theme.text }]}>
                      {spec.v}
                    </Text>
                  </View>
                ))}
            </View>

            {/* Food Specifications if present */}
            {dp.foodDetails && (
              <View style={[s.specsTable, { marginTop: 10 }]}>
                {[
                  { k: "Food Type", v: dp.foodDetails.vegNonVeg },
                  { k: "Shelf Life", v: dp.foodDetails.shelfLife },
                  { k: "Serving Size", v: dp.foodDetails.servingSize },
                  { k: "Calories", v: dp.foodDetails.calories ? `${dp.foodDetails.calories} kcal` : undefined },
                  { k: "Ingredients", v: dp.foodDetails.ingredients?.join(", ") },
                ]
                  .filter((x) => Boolean(x.v))
                  .map((spec, i) => (
                    <View key={i} style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                      <Text style={[s.specKey, { color: theme.secondaryText }]}>{spec.k}</Text>
                      <Text style={[s.specVal, { color: theme.text }]}>{spec.v}</Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Jewelry Specifications if present */}
            {dp.jeweleryDetails && (
              <View style={[s.specsTable, { marginTop: 10 }]}>
                {[
                  { k: "Metal Type", v: dp.jeweleryDetails.metalType },
                  { k: "Purity", v: dp.jeweleryDetails.purity },
                  { k: "BIS Hallmark", v: dp.jeweleryDetails.hallmark ? "Certified Hallmark" : undefined },
                  { k: "Gemstone", v: dp.jeweleryDetails.gemstone },
                  { k: "Weight", v: dp.jeweleryDetails.weightGrams ? `${dp.jeweleryDetails.weightGrams} gm` : undefined },
                ]
                  .filter((x) => Boolean(x.v))
                  .map((spec, i) => (
                    <View key={i} style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                      <Text style={[s.specKey, { color: theme.secondaryText }]}>{spec.k}</Text>
                      <Text style={[s.specVal, { color: theme.text }]}>{spec.v}</Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Verified Seller & Store Source */}
            <View style={[s.storeCard, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border }]}>
              <View style={s.storeCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.storeName, { color: theme.text }]}>
                    {storeObj?.name || (typeof sellerObj === "object" && sellerObj?.businessName) || "QuickBihar Verified Partner Store"}
                  </Text>
                  <Text style={[s.storeLocation, { color: theme.secondaryText }]}>
                    {storeObj?.city ? `${storeObj.city}, ${storeObj.state || 'Bihar'}` : "Bihar, India"}
                  </Text>
                </View>
                <View style={[s.storeBadge, { backgroundColor: "#E8F5E9" }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                  <Text style={[s.storeBadgeText, { color: "#2E7D32" }]}>
                    {storeObj?.rating ? `${storeObj.rating} ★ Verified` : "Verified Partner"}
                  </Text>
                </View>
              </View>
            </View>
          </ExpandableSection>

          {/* ═══════════════════════════════════════════
              2. RETURN & EXCHANGE POLICY
          ═══════════════════════════════════════════ */}
          <ExpandableSection title="Return & Exchange Policy" theme={theme} defaultOpen={false}>
            <View style={s.returnPolicyContent}>
              {!isReturnable ? (
                <View style={[s.nonReturnableBanner, { backgroundColor: "#FFEBEE" }]}>
                  <Ionicons name="alert-circle" size={20} color="#D32F2F" />
                  <Text style={[s.nonReturnableText, { color: "#C62828" }]}>
                    Non-Returnable: Due to hygiene, safety, or perishable standards, this item cannot be returned once delivered.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={s.returnRow}>
                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                    <Text style={[s.returnText, { color: theme.text, fontWeight: "700" }]}>
                      {returnDays} Days Easy Return & Exchange
                    </Text>
                  </View>

                  <View style={s.returnRow}>
                    <Ionicons name="cube-outline" size={20} color={theme.success || "#34C759"} />
                    <Text style={[s.returnText, { color: theme.secondaryText }]}>
                      Free doorstep return pickup by QuickBihar rider
                    </Text>
                  </View>

                  <View style={s.returnRow}>
                    <Ionicons name="card-outline" size={20} color={theme.primary} />
                    <Text style={[s.returnText, { color: theme.secondaryText }]}>
                      100% instant refund directly credited to your original payment source (UPI / Bank / Card) upon return pickup
                    </Text>
                  </View>

                  {/* Conditions Checklist */}
                  <View style={{ marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: theme.tertiaryBackground }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 8 }}>
                      RETURN & EXCHANGE CONDITIONS:
                    </Text>
                    {[
                      "Item must be unused, unwashed, and in its original undamaged condition",
                      "All brand tags, price tags, and barcodes must be attached and intact",
                      "Item must be returned in its original brand box/packaging",
                      "Doorstep quality check (QC) is verified instantly by the delivery partner",
                    ].map((condition, idx) => (
                      <View key={idx} style={{ flexDirection: "row", marginBottom: 6, gap: 8 }}>
                        <Ionicons name="checkmark-circle" size={15} color={theme.success || "#34C759"} />
                        <Text style={{ fontSize: 12, color: theme.secondaryText, flex: 1, lineHeight: 16 }}>
                          {condition}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </ExpandableSection>

          {/* ═══════════════════════════════════════════
              3. COMPLIANCE AND MANUFACTURING
          ═══════════════════════════════════════════ */}
          <ExpandableSection title="Compliance & Manufacturing" theme={theme} defaultOpen={false}>
            <View style={s.specsTable}>
              <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                <Text style={[s.specKey, { color: theme.secondaryText }]}>Country of Origin</Text>
                <Text style={[s.specVal, { color: theme.text }]}>{dp.compliance?.countryOfOrigin || "India 🇮🇳"}</Text>
              </View>
              <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                <Text style={[s.specKey, { color: theme.secondaryText }]}>Manufacturer</Text>
                <Text style={[s.specVal, { color: theme.text }]}>
                  {dp.compliance?.manufacturerDetail || (storeObj?.name ? `${storeObj.name}, ${storeObj.city || ''} ${storeObj.state || 'Bihar'}` : "QuickBihar Verified Partner, Bihar")}
                </Text>
              </View>
              <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                <Text style={[s.specKey, { color: theme.secondaryText }]}>Packer</Text>
                <Text style={[s.specVal, { color: theme.text }]}>
                  {dp.compliance?.packerDetail || dp.compliance?.manufacturerDetail || "QuickBihar Logistics Hub, Bihar"}
                </Text>
              </View>
              {dp.compliance?.importerDetail && (
                <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                  <Text style={[s.specKey, { color: theme.secondaryText }]}>Importer</Text>
                  <Text style={[s.specVal, { color: theme.text }]}>{dp.compliance.importerDetail}</Text>
                </View>
              )}
              <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                <Text style={[s.specKey, { color: theme.secondaryText }]}>Generic / Commodity Name</Text>
                <Text style={[s.specVal, { color: theme.text }]}>{dp.compliance?.genericName || dp.subCategory || dp.category || "Apparel / Consumer Goods"}</Text>
              </View>
              <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                <Text style={[s.specKey, { color: theme.secondaryText }]}>Dispatched From</Text>
                <Text style={[s.specVal, { color: theme.text }]}>{dp.logistics?.warehouseName || storeObj?.name || "QuickBihar Express Hub, Bihar"}</Text>
              </View>
              <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                <Text style={[s.specKey, { color: theme.secondaryText }]}>Tax Transparency</Text>
                <Text style={[s.specVal, { color: theme.text }]}>
                  {dp.isGstApplicable ? `Includes ${dp.gstPercentage}% GST (Tax invoice included with shipment)` : "Price inclusive of all taxes"}
                </Text>
              </View>
            </View>

            {/* Consumer Grievance & Customer Care */}
            <View style={{ marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: theme.tertiaryBackground, gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text }}>
                CUSTOMER CARE & GRIEVANCE REDRESSAL:
              </Text>
              <Text style={{ fontSize: 12, color: theme.secondaryText }}>
                Email: <Text style={{ color: theme.primary, fontWeight: "600" }}>support@quickbihar.com</Text>
              </Text>
              <Text style={{ fontSize: 12, color: theme.secondaryText }}>
                Helpline: <Text style={{ color: theme.text, fontWeight: "600" }}>+91 95077 12255</Text> (Mon-Sun, 8 AM - 10 PM)
              </Text>
            </View>
          </ExpandableSection>
        </View>

        {/* ═══════════════════════════════════════════
            4. RATINGS & REVIEWS (Expandable & Interactive)
        ═══════════════════════════════════════════ */}
        <View
          style={[
            s.expandableSectionWrap,
            { backgroundColor: theme.background },
          ]}
        >
          <ExpandableSection
            title={`Ratings & Reviews (${totalReviews})`}
            theme={theme}
            defaultOpen={true}
          >
            {/* Rating Overview */}
            <View style={s.ratingOverview}>
              <View style={s.ratingLeft}>
                <Text style={[s.bigRating, { color: theme.text }]}>
                  {averageRating > 0 ? averageRating : "0.0"}
                </Text>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={
                        star <= Math.floor(averageRating)
                          ? "star"
                          : star - 0.5 <= averageRating
                            ? "star-half"
                            : "star-outline"
                      }
                      size={14}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={[s.totalRatings, { color: theme.tertiaryText }]}>
                  {totalReviews} verified ratings
                </Text>
              </View>
              <View style={s.ratingRight}>
                {starDist.map((d) => (
                  <RatingBar
                    key={d.stars}
                    stars={d.stars}
                    count={d.count}
                    total={totalReviews || 1}
                    theme={theme}
                  />
                ))}
              </View>
            </View>

            {/* Write Review Action Row */}
            <View style={[s.writeReviewRow, { borderTopColor: theme.border }]}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>
                Have you used this product?
              </Text>
              <TouchableOpacity
                style={[s.writeReviewBtn, { borderColor: theme.primary, backgroundColor: theme.primary + "10" }]}
                onPress={() => setShowReviewModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="star" size={14} color={theme.primary} />
                <Text style={[s.writeReviewBtnText, { color: theme.primary }]}>
                  Rate & Review
                </Text>
              </TouchableOpacity>
            </View>

            {/* Review Cards List */}
            {reviewsList.length === 0 ? (
              <View style={s.emptyReviewsWrap}>
                <Ionicons name="chatbox-ellipses-outline" size={38} color={theme.tertiaryText} />
                <Text style={[s.emptyReviewsTitle, { color: theme.text }]}>No Reviews Yet</Text>
                <Text style={[s.emptyReviewsSub, { color: theme.secondaryText }]}>
                  Be the first to share your thoughts and help other shoppers make the right choice!
                </Text>
              </View>
            ) : (
              <View style={s.reviewsList}>
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
                    <View
                      key={review._id || review.id || idx}
                      style={[s.reviewCard, { borderBottomColor: theme.border }]}
                    >
                      {/* Star + Title row */}
                      <View style={s.reviewTopRow}>
                        <View
                          style={[
                            s.miniRatingPill,
                            {
                              backgroundColor:
                                review.rating >= 4
                                  ? "#34C759"
                                  : review.rating >= 3
                                    ? "#F59E0B"
                                    : "#FF3B30",
                            },
                          ]}
                        >
                          <Text style={s.miniRatingText}>{review.rating}</Text>
                          <Ionicons name="star" size={10} color="#fff" />
                        </View>
                        <Text
                          style={[s.reviewTitle, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {review.title || "Customer Review"}
                        </Text>
                      </View>

                      {/* Comment */}
                      <Text style={[s.reviewBody, { color: theme.secondaryText }]}>
                        {review.comment}
                      </Text>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={s.reviewImagesRow}
                        >
                          {review.images.map((img: any, i: number) => {
                            const imgUrl = typeof img === "string" ? img : img.url;
                            return (
                              <Image
                                key={i}
                                source={{ uri: imgUrl }}
                                style={[s.reviewThumb, { borderColor: theme.border }]}
                              />
                            );
                          })}
                        </ScrollView>
                      )}

                      {/* Reviewer Info */}
                      <View style={s.reviewerRow}>
                        <View style={[s.avatarFallback, { backgroundColor: avatarColor }]}>
                          <Text style={s.avatarFallbackText}>{initial}</Text>
                        </View>
                        <Text
                          style={[s.reviewerName, { color: theme.text }]}
                        >
                          {userName}
                        </Text>
                        {(review.isVerifiedBuyer) && (
                          <View style={s.verifiedBadge}>
                            <Ionicons name="checkmark" size={11} color="#2E7D32" />
                            <Text style={s.verifiedBadgeText}>Verified</Text>
                          </View>
                        )}
                        <Text style={[s.reviewDot, { color: theme.tertiaryText }]}>
                          •
                        </Text>
                        <Text
                          style={[s.reviewerDate, { color: theme.tertiaryText }]}
                        >
                          {formattedDate}
                        </Text>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity
                          style={[
                            s.helpfulBtn,
                            {
                              borderColor: review.hasVotedHelpful ? theme.primary : theme.border,
                              backgroundColor: review.hasVotedHelpful ? theme.primary + "15" : "transparent",
                            },
                          ]}
                          onPress={() => review._id && handleHelpfulVote(review._id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={review.hasVotedHelpful ? "thumbs-up" : "thumbs-up-outline"}
                            size={13}
                            color={review.hasVotedHelpful ? theme.primary : theme.secondaryText}
                          />
                          <Text
                            style={[
                              s.helpfulText,
                              { color: review.hasVotedHelpful ? theme.primary : theme.secondaryText },
                            ]}
                          >
                            {review.helpfulCount ?? review.helpful ?? 0}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ExpandableSection>
        </View>

        {/* ═══════════════════════════════════════════
            SIMILAR PRODUCTS
        ═══════════════════════════════════════════ */}
        {similarProducts && similarProducts.length > 0 && (
          <SimilarProducts products={similarProducts} theme={theme} />
        )}

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════
          BOTTOM ACTION BAR
      ═══════════════════════════════════════════ */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[
          s.bottomBar,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleWishlist(id, product);
          }}
          style={[
            s.wishlistBtn,
            {
              borderColor: isWishlisted ? (isDark ? "rgba(255, 59, 48, 0.4)" : "#FFD2D0") : theme.border,
              backgroundColor: isWishlisted ? (isDark ? "rgba(255, 59, 48, 0.12)" : "#FFF5F5") : "transparent",
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={22}
            color={isWishlisted ? "#FF3B30" : theme.text}
          />
          <Text
            style={[
              s.wishlistBtnText,
              {
                color: isWishlisted ? "#FF3B30" : theme.text,
              },
            ]}
          >
            {isWishlisted ? "WISHLISTED" : "WISHLIST"}
          </Text>
        </TouchableOpacity>
        {/* Add to Bag Button */}
        {(() => {
          const isOutOfStock = !!((dp.totalStock ?? 0) <= 0 || (selectedSize && (selectedVariant?.stock ?? 0) <= 0));
          const buttonDisabled = isAddingToCart || (!isSelectionComplete) || (isOutOfStock && !isInCart);

          // Determine button text and icon
          let buttonText = "ADD TO BAG";
          let buttonIcon = "bag-handle-outline";

          if (isInCart) {
            buttonText = "GO TO CART";
            buttonIcon = "arrow-forward-outline";
          } else if (isOutOfStock) {
            buttonText = "OUT OF STOCK";
            buttonIcon = "close-circle-outline";
          } else if (!isSelectionComplete) {
            if (hasColors && !selectedColor) {
              buttonText = "SELECT COLOR";
              buttonIcon = "color-palette-outline";
            } else if (hasSizes && !selectedSize) {
              buttonText = "SELECT SIZE";
              buttonIcon = "resize-outline";
            }
          }

          return (
            <TouchableOpacity
              onPress={handleAddToBag}
              disabled={buttonDisabled}
              style={[
                s.addToBagBtn,
                {
                  backgroundColor: isInCart
                    ? theme.primary
                    : buttonDisabled
                      ? theme.secondaryText || "#9ca3af"
                      : theme.primary,
                  opacity: isAddingToCart ? 0.7 : 1
                }
              ]}
              activeOpacity={0.8}
            >
              {isAddingToCart ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={buttonIcon as any}
                    size={20}
                    color="#fff"
                  />
                  <Text style={s.addToBagText}>
                    {buttonText}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })()}
      </Animated.View>

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
    </SafeViewWrapper>
  );
};

export default ProductDetailScreen;
