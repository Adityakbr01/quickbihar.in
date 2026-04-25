import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  LayoutAnimation,
  UIManager,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useProductById, useSimilarProducts } from "../hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { socketClient } from "@/src/lib/socket";
import { SocketEvents } from "@/src/constants/socketEvents";
import { useRouter } from "expo-router";
import { IProduct } from "../types/product.types";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";

// --- Imports from modular structure ---
import { styles as s, SCREEN_WIDTH } from "./ProductDetail/styles";
import { MOCK_PRODUCT, MOCK_REVIEWS, TRUST_POLICIES } from "./ProductDetail/constants";
import { SectionDivider } from "./ProductDetail/components/SectionDivider";
import { ExpandableSection } from "./ProductDetail/components/ExpandableSection";
import { RatingBar } from "./ProductDetail/components/RatingBar";
import { SimilarProducts } from "./ProductDetail/components/SimilarProducts";
import SizeChartModal from "../components/modals/SizeChartModal";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useWishlistStore } from "../../wishlist/store/wishlistStore";
import { useCartStore } from "../../cart/store/cartStore";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import WishlistHeart from "@/src/components/common/WishlistHeart";



interface ProductDetailProps {
  id: string;
}

const ProductDetailScreen: React.FC<ProductDetailProps> = ({ id }) => {
  const router = useRouter();
  const theme = useTheme() as any;
  const { data: product, isLoading } = useProductById(id);
  const { data: similarProducts } = useSimilarProducts(id);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const wishlistItems = useWishlistStore(state => state.items);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const isWishlisted = wishlistItems.includes(id);

  const queryClient = useQueryClient();

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

  const isMock = id === "mock" || !product;
  const dp: Partial<IProduct> = isMock ? MOCK_PRODUCT : product;

  // ── Derived State ──
  const uniqueColors = useMemo(() => {
    if (!dp.variants) return [];
    return Array.from(new Set(dp.variants.map((v) => v.color.trim())));
  }, [dp.variants]);

  useMemo(() => {
    if (uniqueColors.length > 0 && !selectedColor)
      setSelectedColor(uniqueColors[0]);
  }, [uniqueColors, selectedColor]);

  const sizesForColor = useMemo(() => {
    if (!dp.variants || !selectedColor) return [];
    return dp.variants.filter((v) => v.color.trim() === selectedColor);
  }, [dp.variants, selectedColor]);

  const images = dp.images || [];
  const discount =
    dp.discountPercentage ||
    (dp.originalPrice && dp.price
      ? Math.floor((1 - dp.price / dp.originalPrice) * 100)
      : 0);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${dp.title} at ₹${dp.price} on QuickBihar! 🛍️`,
      });
    } catch { }
  }, [dp.title, dp.price]);

  const { addItem, isLoading: isAddingToCart } = useCartStore();

  const handleAddToBag = async () => {
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

    const variant = dp.variants?.find(
      (v) => v.color.trim() === selectedColor && v.size === selectedSize
    ) || dp.variants?.[0];

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
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add item to bag",
        props: { id: Date.now() }
      });
    }
  };

  // ── Loading State ──
  if (isLoading && !isMock) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[s.loadingText, { color: theme.secondaryText }]}>
          Loading product...
        </Text>
      </View>
    );
  }

  // Mock star distribution for rating bars
  const totalReviews = dp.ratings?.count || 0;
  const starDist = [
    { stars: 5, count: Math.round(totalReviews * 0.58) },
    { stars: 4, count: Math.round(totalReviews * 0.22) },
    { stars: 3, count: Math.round(totalReviews * 0.12) },
    { stars: 2, count: Math.round(totalReviews * 0.05) },
    { stars: 1, count: Math.round(totalReviews * 0.03) },
  ];

  return (
    <SafeViewWrapper>
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
            width={SCREEN_WIDTH}
            height={SCREEN_WIDTH * 1.2}
            data={images}
            scrollAnimationDuration={300}
            onSnapToItem={setCarouselIndex}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={s.galleryImage}
                resizeMode="cover"
              />
            )}
          />

          {/* Floating Navigation */}
          <View style={s.galleryNav}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[s.navBtn, { backgroundColor: theme.background + "E6" }]}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={s.navRight}>
              <WishlistHeart
                isWishlisted={isWishlisted}
                onToggle={() => toggleWishlist(id)}
                size={22}
                activeColor="#FF3B30"
                inactiveColor={theme.text}
                style={[
                  s.navBtn,
                  { backgroundColor: theme.background + "B3" },
                ]}
              />
              <TouchableOpacity
                onPress={handleShare}
                style={[
                  s.navBtn,
                  {
                    backgroundColor: theme.background + "B3",
                    marginLeft: 10,
                  },
                ]}
              >
                <Ionicons name="share-outline" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Counter Pill */}
          {images.length > 1 && (
            <View style={s.counterPill}>
              <Ionicons
                name="images-outline"
                size={12}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={s.counterText}>
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
          {dp.ratings && dp.ratings.count > 0 && (
            <Animated.View entering={FadeIn.delay(200)} style={s.ratingChip}>
              <View style={s.ratingChipInner}>
                <Text style={s.ratingChipScore}>{dp.ratings.average}</Text>
                <Ionicons name="star" size={11} color="#fff" />
              </View>
              <View style={s.ratingDividerLine} />
              <Text style={[s.ratingChipCount, { color: theme.secondaryText }]}>
                {dp.ratings.count} Ratings
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

        <SectionDivider theme={theme} />

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

        <SectionDivider theme={theme} />

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
                onPress={() => setShowSizeChart(true)}
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
                    >
                      {v.size}
                    </Text>
                    {/* OOS diagonal line */}
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

        <SectionDivider theme={theme} />

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
                  Get it by{" "}
                  {new Date(
                    Date.now() +
                    (dp.deliveryInfo?.estimatedDays || 3) * 86400000
                  ).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={[s.deliveryCardSub, { color: theme.secondaryText }]}>
                  Free delivery on orders above ₹499
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
                    Express Delivery Available
                  </Text>
                  <Text style={[s.deliveryCardSub, { color: theme.secondaryText }]}>
                    Get it within 24 hours
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
                label: (typeof dp.refundPolicy !== 'string' && dp.refundPolicy?.returnWindowDays)
                  ? `${dp.refundPolicy.returnWindowDays} Day\nReturns`
                  : (dp.deliveryInfo?.returnPolicy?.includes('7') ? "7 Day\nReturns" : "Easy\nReturns")
              },
              {
                icon: dp.deliveryInfo?.isCodAvailable ? "cash-outline" : "card-outline",
                label: dp.deliveryInfo?.isCodAvailable ? "Pay On\nDelivery" : "Secure\nPayment"
              },
              {
                icon: "shield-checkmark-outline",
                label: "Genuine\nProduct"
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

        <SectionDivider theme={theme} />

        {/* ═══════════════════════════════════════════
            PRODUCT DETAILS (Expandable Sections)
        ═══════════════════════════════════════════ */}
        <View
          style={[
            s.expandableSectionWrap,
            { backgroundColor: theme.background },
          ]}
        >
          <ExpandableSection
            title="Product Details"
            theme={theme}
            defaultOpen={true}
          >
            <Text style={[s.descriptionText, { color: theme.secondaryText }]}>
              {dp.description}
            </Text>
            {dp.details && (
              <View style={s.specsTable}>
                {[
                  { k: "Fit", v: dp.details.fit },
                  { k: "Pattern", v: dp.details.pattern },
                  { k: "Sleeve", v: dp.details.sleeve },
                  { k: "Wash Care", v: dp.details.washCare },
                ]
                  .filter((x) => x.v)
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
                {dp.details?.material && (
                  <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                    <Text style={[s.specKey, { color: theme.secondaryText }]}>Material</Text>
                    <Text style={[s.specVal, { color: theme.text }]}>{dp.details.material}</Text>
                  </View>
                )}
              </View>
            )}
          </ExpandableSection>

          <ExpandableSection title="Return & Exchange Policy" theme={theme}>
            <View style={s.returnPolicyContent}>
              {dp.refundPolicy && typeof dp.refundPolicy !== 'string' ? (
                <>
                  <View style={s.returnRow}>
                    <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    <Text style={[s.returnText, { color: theme.secondaryText, fontWeight: "700" }]}>
                      {dp.refundPolicy.returnWindowDays} Day {dp.refundPolicy.isReturnable ? "Return" : "Policy"} Window
                    </Text>
                  </View>
                  {dp.refundPolicy.description && (
                    <Text style={{ fontSize: 13, color: theme.tertiaryText, marginBottom: 8 }}>
                      {dp.refundPolicy.description}
                    </Text>
                  )}
                  {dp.refundPolicy.conditions && dp.refundPolicy.conditions.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 6 }}>POLICY CONDITIONS:</Text>
                      {dp.refundPolicy.conditions.map((c, i) => (
                        <View key={i} style={{ flexDirection: "row", marginBottom: 4, gap: 8 }}>
                          <Ionicons name="checkmark-done" size={14} color={theme.success} />
                          <Text style={{ fontSize: 12, color: theme.secondaryText }}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={s.returnRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                  <Text style={[s.returnText, { color: theme.secondaryText }]}>
                    {dp.deliveryInfo?.returnPolicy || "Standard return policy applies"}
                  </Text>
                </View>
              )}
            </View>
          </ExpandableSection>

          <ExpandableSection title="Compliance & Manufacturing" theme={theme}>
            <View style={s.specsTable}>
              <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                <Text style={[s.specKey, { color: theme.secondaryText }]}>Country of Origin</Text>
                <Text style={[s.specVal, { color: theme.text }]}>{dp.compliance?.countryOfOrigin || "India"}</Text>
              </View>
              {dp.compliance?.manufacturerDetail && (
                <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                  <Text style={[s.specKey, { color: theme.secondaryText }]}>Manufacturer</Text>
                  <Text style={[s.specVal, { color: theme.text }]}>{dp.compliance.manufacturerDetail}</Text>
                </View>
              )}
              {dp.compliance?.packerDetail && (
                <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                  <Text style={[s.specKey, { color: theme.secondaryText }]}>Packer</Text>
                  <Text style={[s.specVal, { color: theme.text }]}>{dp.compliance.packerDetail}</Text>
                </View>
              )}
              {dp.logistics?.warehouseName && (
                <View style={[s.specTableRow, { borderBottomColor: theme.border }]}>
                  <Text style={[s.specKey, { color: theme.secondaryText }]}>Dispatched From</Text>
                  <Text style={[s.specVal, { color: theme.text }]}>{dp.logistics.warehouseName}</Text>
                </View>
              )}
            </View>
          </ExpandableSection>
        </View>

        <SectionDivider theme={theme} />

        {/* ═══════════════════════════════════════════
            RATINGS & REVIEWS (Expandable)
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
            defaultOpen={false}
          >
            {/* Rating Overview */}
            <View style={s.ratingOverview}>
              <View style={s.ratingLeft}>
                <Text style={[s.bigRating, { color: theme.text }]}>
                  {dp.ratings?.average || 0}
                </Text>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={
                        star <= Math.floor(dp.ratings?.average || 0)
                          ? "star"
                          : star - 0.5 <= (dp.ratings?.average || 0)
                            ? "star-half"
                            : "star-outline"
                      }
                      size={14}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={[s.totalRatings, { color: theme.tertiaryText }]}>
                  {totalReviews} verified
                </Text>
              </View>
              <View style={s.ratingRight}>
                {starDist.map((d) => (
                  <RatingBar
                    key={d.stars}
                    stars={d.stars}
                    count={d.count}
                    total={totalReviews}
                    theme={theme}
                  />
                ))}
              </View>
            </View>

            {/* Review Cards */}
            <View style={s.reviewsList}>
              {MOCK_REVIEWS.map((review, idx) => (
                <View
                  key={review.id}
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
                      {review.title}
                    </Text>
                  </View>

                  {/* Comment */}
                  <Text style={[s.reviewBody, { color: theme.secondaryText }]}>
                    {review.comment}
                  </Text>

                  {/* Review Images */}
                  {review.images.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={s.reviewImagesRow}
                    >
                      {review.images.map((img, i) => (
                        <Image
                          key={i}
                          source={{ uri: img }}
                          style={[s.reviewThumb, { borderColor: theme.border }]}
                        />
                      ))}
                    </ScrollView>
                  )}

                  {/* Reviewer Info */}
                  <View style={s.reviewerRow}>
                    <Image
                      source={{ uri: review.avatar }}
                      style={s.reviewerImg}
                    />
                    <Text
                      style={[s.reviewerName, { color: theme.tertiaryText }]}
                    >
                      {review.user}
                    </Text>
                    <Text style={[s.reviewDot, { color: theme.border }]}>
                      •
                    </Text>
                    <Text
                      style={[s.reviewerDate, { color: theme.tertiaryText }]}
                    >
                      {review.date}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={s.helpfulBtn}>
                      <Ionicons
                        name="thumbs-up-outline"
                        size={14}
                        color={theme.secondaryText}
                      />
                      <Text
                        style={[s.helpfulText, { color: theme.secondaryText }]}
                      >
                        {review.helpful}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[s.viewAllBtn, { borderColor: theme.border }]}>
              <Text style={[s.viewAllText, { color: theme.primary }]}>
                View All {totalReviews} Reviews
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </TouchableOpacity>
          </ExpandableSection>
        </View>

        <SectionDivider theme={theme} />

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
          onPress={() => toggleWishlist(id)}
          style={[s.wishlistBtn, { borderColor: theme.border }]}
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
            WISHLIST
          </Text>
        </TouchableOpacity>
        {/* Add to Bag Button */}
        {(() => {
          const selectedVariant = dp.variants?.find(
            (v) => v.color.trim() === selectedColor && v.size === selectedSize
          );
          const isOutOfStock = !!((dp.totalStock ?? 0) <= 0 || (selectedSize && (selectedVariant?.stock ?? 0) <= 0));

          return (
            <TouchableOpacity
              onPress={handleAddToBag}
              disabled={isAddingToCart || isOutOfStock}
              style={[
                s.addToBagBtn,
                {
                  backgroundColor: isOutOfStock ? theme.secondaryText : theme.primary,
                  opacity: (isAddingToCart || isOutOfStock) ? 0.7 : 1
                }
              ]}
              activeOpacity={0.8}
            >
              {isAddingToCart ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name={isOutOfStock ? "close-circle-outline" : "bag-handle-outline"} size={20} color="#fff" />
                  <Text style={s.addToBagText}>
                    {isOutOfStock ? "OUT OF STOCK" : "ADD TO BAG"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })()}
      </Animated.View>

      <SizeChartModal
        visible={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        sizeChart={dp.sizeChartId && typeof dp.sizeChartId !== 'string' ? (dp.sizeChartId as any) : null}
        theme={theme}
      />
    </SafeViewWrapper>
  );
};

export default ProductDetailScreen;
