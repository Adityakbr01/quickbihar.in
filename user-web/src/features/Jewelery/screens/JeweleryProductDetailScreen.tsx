import { ArrowLeft, ArrowRight, Award, Camera, Check, CircleCheck, Gift, Heart, PenLine, RefreshCw, ShoppingBag, Star, ThumbsUp, Truck } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo, useRouteParams } from "@/src/utils/navigation";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";
import { goBack } from "@/src/utils/navigation";

import { APP_CURRENCY, JEWELERY_MODULE_CONFIG } from "@/src/constants";
import { ImageCarousel } from "@/src/features/Jewelery/components/ImageCarousel";
import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import type { Product as JeweleryProduct } from "@/src/features/Jewelery/data/products";
import { useJeweleryProduct, useSimilarJewelery } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useStickyBarBottomOffset } from "@/src/utils/responsive";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import {
  useCreateProductReview,
  useProductReviews,
  useVoteHelpfulReview,
} from "@/src/features/clothing/product/hooks/useProducts";
import { WriteReviewModal } from "@/src/features/clothing/product/components/modals/WriteReviewModal";
import { useModuleTheme } from "@/src/theme/useModuleTheme";

function Stars({ rating, count }: { rating: number; count: number }) {
  const colors = useColors();
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} color={s <= Math.round(rating) ? colors.gold : colors.midGray} />
      ))}
      <Text style={[
          styles.ratingText,
          { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
        ]}
      >
        {rating} ({count} reviews)
      </Text>
    </View>
  );
}

export default function JeweleryProductDetailScreen() {
  const navigate = useNavigate();
  const { id } = useRouteParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToCart, toggleWishlist, isWishlisted, cartItems } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  // Mobile web tab bar is fixed-position and overlays the viewport bottom —
  // lift the sticky bar above it (0 on desktop/native, no visual diff).
  const stickyBarOffset = useStickyBarBottomOffset();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: product, isLoading } = useJeweleryProduct(id);
  const { data: related = [] } = useSimilarJewelery(id, 4);

  // Reviews run on the server product id through the same review
  // pipeline as clothing (fetch/create/helpful-vote).
  const rawReviewId = (product?._raw as any)?._id;
  const reviewProductId = String(rawReviewId || product?.id || "");
  const { data: reviewsData } = useProductReviews(reviewProductId);
  const createReviewMutation = useCreateProductReview(reviewProductId);
  const voteHelpfulMutation = useVoteHelpfulReview(reviewProductId);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const modalTheme = useModuleTheme("jewelery");

  const totalReviews =
    reviewsData?.stats?.totalReviews ?? product?.reviewCount ?? 0;
  const averageRating =
    reviewsData?.stats?.averageRating ?? product?.rating ?? 0;
  const distribution = reviewsData?.stats?.distribution || {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };
  const reviewsList = reviewsData?.reviews || [];

  const handleHelpfulVote = async (reviewId: string) => {
    if (!useAuthStore.getState().isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      goTo(navigate, "/jewelery/auth/sign-in" as any);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await voteHelpfulMutation.mutateAsync(reviewId);
    } catch {
      // silent — error haptic already fired
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRateAndReview = () => {
    if (!useAuthStore.getState().isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      goTo(navigate, "/jewelery/auth/sign-in" as any);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReviewModal(true);
  };

  const isInCart = Boolean(
    product && cartItems.some((item) => item.product.id === product.id)
  );

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.ivory, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.root, { backgroundColor: colors.ivory }]}>
        <Text style={[styles.notFound, { color: colors.warmGray }]}>
          Product not found
        </Text>
      </View>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const tryOnConfig = product.tryOn;
  const canTryOn = Boolean(tryOnConfig?.modelUrl);

  const handleAddToCart = async () => {
    // Haptics come from the bridge (success/error) — don't pre-fire here.
    const ok = await addToCart(product);
    if (!ok) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleTryOn = () => {
    if (!tryOnConfig) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tryOnParams: Record<string, string> = {
      productId: product.id,
      jewelryType: tryOnConfig.jewelryType,
      modelUrl: tryOnConfig.modelUrl,
      variants: JSON.stringify(tryOnConfig.variants ?? []),
      productName: product.name,
    };
    const defaultVariantId = tryOnConfig.variants?.[0]?.id;
    if (defaultVariantId) tryOnParams.variantId = defaultVariantId;
    goTo(navigate, { pathname: "/jewelery/try-on" as any, params: tryOnParams });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      {/* Back button overlay */}
      <View style={[
          styles.backBtn,
          { top: (Platform.OS === "web" ? 16 : insets.top) + 10 },
        ]}
      >
        <Pressable onPress={() => goBack(navigate)}
          style={[
            styles.backBtnInner,
            { backgroundColor: colors.card, borderColor: colors.midGray, borderWidth: 0.5 },
          ]}
          hitSlop={8}
        >
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleWishlist(product);
          }}
          style={[
            styles.backBtnInner,
            { backgroundColor: colors.card, borderColor: colors.midGray, borderWidth: 0.5 },
          ]}
          hitSlop={8}
        >
          <Heart size={18} color={wishlisted ? colors.gold : colors.ink} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <ImageCarousel images={product.images} />

        {/* Content */}
        <View style={[styles.content, { backgroundColor: colors.ivory }]}>
          {/* Breadcrumb — real collection only, never a hardcoded category */}
          {product.collection ? (
            <Text style={[
                styles.breadcrumb,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              {product.collection}
            </Text>
          ) : null}

          {/* Name & rating */}
          <Text style={[
              styles.productName,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_500Medium_Italic",
              },
            ]}
          >
            {product.name}
          </Text>
          {totalReviews > 0 ? (
            <Stars rating={averageRating} count={totalReviews} />
          ) : (
            <Pressable onPress={handleRateAndReview}
              style={[
                styles.firstReviewTeaser,
                { borderColor: colors.gold, backgroundColor: colors.champagne },
              ]}
            >
              <Star size={14} color={colors.gold} />
              <Text style={[
                  styles.firstReviewText,
                  { color: colors.ink, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Be the first to review this piece
              </Text>
            </Pressable>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[
                styles.price,
                { color: colors.ink, fontFamily: "DMSans_500Medium" },
              ]}
            >
              {APP_CURRENCY}{product.price.toLocaleString("en-IN")}
            </Text>
            {product.originalPrice && (
              <Text style={[
                  styles.originalPrice,
                  {
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  },
                ]}
              >
                {APP_CURRENCY}{product.originalPrice.toLocaleString("en-IN")}
              </Text>
            )}
          </View>

          {/* Description */}
          <Text style={[
              styles.description,
              {
                color: colors.warmGray,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            {product.description}
          </Text>

          {/* Occasions */}
          <View style={styles.occasionRow}>
            {product.occasions.map((o) => (
              <View key={o}
                style={[
                  styles.occasionTag,
                  {
                    backgroundColor: colors.champagne,
                    borderColor: colors.midGray,
                  },
                ]}
              >
                <Text style={[
                    styles.occasionTagText,
                    { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                  ]}
                >
                  {o}
                </Text>
              </View>
            ))}
          </View>

          {/* Delivery & trust */}
          <View style={[
              styles.trustSection,
              { backgroundColor: colors.pearl, borderColor: colors.midGray },
            ]}
          >
            {[
              { icon: Truck, text: "Ships in 3–5 days" },
              { icon: RefreshCw, text: `Free returns ${JEWELERY_MODULE_CONFIG.returnPolicyDays} days` },
              // Hallmark is a real-data claim — only shown when the piece
              // actually carries a hallmark/BIS mark.
              ...(product.hallmarked
                ? [{ icon: Award, text: "Hallmark certified" }]
                : []),
              { icon: Gift, text: "Gift box included" },
            ].map((t) => (
              <View key={t.text} style={styles.trustItem}>
                <t.icon size={13} color={colors.gold} />
                <Text style={[
                    styles.trustText,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  {t.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Craftsmanship */}
          <View style={[styles.craftSection, { borderTopColor: colors.midGray }]}
          >
            <Text style={[
                styles.craftLabel,
                { color: colors.gold, fontFamily: "DMSans_500Medium" },
              ]}
            >
              CRAFTSMANSHIP DETAILS
            </Text>
            <View style={styles.specGrid}>
              {[
                product.metal ? { key: "Metal", val: product.metal } : null,
                product.stone ? { key: "Stone", val: product.stone } : null,
                product.weight ? { key: "Weight", val: product.weight } : null,
                // No fallback purity claim — the row only renders for real data.
                product.purity ? { key: "Purity", val: product.purity } : null,
              ]
                .filter(Boolean)
                .map((spec) => (
                  <View key={spec!.key} style={styles.specItem}>
                    <Text style={[
                        styles.specKey,
                        {
                          color: colors.warmGray,
                          fontFamily: "DMSans_400Regular",
                        },
                      ]}
                    >
                      {spec!.key}
                    </Text>
                    <Text style={[
                        styles.specVal,
                        { color: colors.ink, fontFamily: "DMSans_500Medium" },
                      ]}
                    >
                      {spec!.val}
                    </Text>
                  </View>
                ))}
            </View>
            {product.craftDetail ? (
              <Text style={[
                  styles.craftDetail,
                  {
                    color: colors.warmGray,
                    fontFamily: "CormorantGaramond_400Regular_Italic",
                  },
                ]}
              >
                {product.craftDetail}
              </Text>
            ) : null}
          </View>

          {/* Ratings & Reviews — same review pipeline as clothing,
              dressed in the jewellery theme */}
          <View style={[styles.reviewsSection, { borderTopColor: colors.midGray }]}
          >
            <Text style={[
                styles.reviewsLabel,
                { color: colors.gold, fontFamily: "DMSans_500Medium" },
              ]}
            >
              RATINGS & REVIEWS
              {totalReviews > 0 ? ` (${totalReviews})` : ""}
            </Text>

            {totalReviews > 0 ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <Text style={[
                      styles.bigRating,
                      {
                        color: colors.ink,
                        fontFamily: "CormorantGaramond_600SemiBold",
                      },
                    ]}
                  >
                    {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                  </Text>
                  <Stars rating={averageRating} count={totalReviews} />
                  <Text style={[
                      styles.summaryCount,
                      {
                        color: colors.warmGray,
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                  >
                    {totalReviews} verified rating
                    {totalReviews === 1 ? "" : "s"}
                  </Text>
                </View>
                <View style={styles.distCol}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = (distribution as any)[star] || 0;
                    const pct =
                      totalReviews > 0
                        ? Math.round((count / totalReviews) * 100)
                        : 0;
                    return (
                      <View key={star} style={styles.distRow}>
                        <Text style={[
                            styles.distStar,
                            {
                              color: colors.warmGray,
                              fontFamily: "DMSans_500Medium",
                            },
                          ]}
                        >
                          {star}★
                        </Text>
                        <View style={[
                            styles.distTrack,
                            { backgroundColor: colors.pearl },
                          ]}
                        >
                          <View style={[
                              styles.distFill,
                              {
                                backgroundColor: colors.gold,
                                width: `${pct}%` as any,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[
                            styles.distCount,
                            {
                              color: colors.warmGray,
                              fontFamily: "DMSans_400Regular",
                            },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <Pressable onPress={handleRateAndReview}
              style={[
                styles.rateBtn,
                {
                  borderColor: colors.gold,
                  backgroundColor: colors.champagne,
                },
              ]}
            >
              <PenLine size={14} color={colors.gold} />
              <Text style={[
                  styles.rateBtnText,
                  { color: colors.gold, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Rate & Review
              </Text>
            </Pressable>

            {reviewsList.length === 0 ? (
              <View style={styles.emptyReviewsWrap}>
                <Text style={[
                    styles.emptyReviewsTitle,
                    {
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_500Medium_Italic",
                    },
                  ]}
                >
                  No reviews yet
                </Text>
                <Text style={[
                    styles.emptyReviewsSub,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  Bought this piece? Share your experience with other shoppers.
                </Text>
              </View>
            ) : (
              <View>
                {reviewsList.map((review: any, idx: number) => {
                  const userName =
                    review.user?.fullName || review.user || "Customer";
                  const formattedDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Verified Purchase";
                  const voted = Boolean(review.hasVotedHelpful);
                  const pillBg =
                    review.rating >= 4
                      ? colors.emerald
                      : review.rating >= 3
                        ? colors.gold
                        : colors.maroon;
                  return (
                    <View key={review._id || review.id || idx}
                      style={[
                        styles.reviewCard,
                        { borderBottomColor: colors.midGray },
                      ]}
                    >
                      <View style={styles.reviewTopRow}>
                        <View style={[styles.ratingPill, { backgroundColor: pillBg }]}
                        >
                          <Text style={[styles.ratingPillText, { color: colors.onBrand }]}>
                            {review.rating} ★
                          </Text>
                        </View>
                        <Text style={[
                            styles.reviewTitle,
                            {
                              color: colors.ink,
                              fontFamily: "DMSans_500Medium",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {review.title || "Customer Review"}
                        </Text>
                      </View>
                      <Text style={[
                          styles.reviewBody,
                          {
                            color: colors.warmGray,
                            fontFamily: "DMSans_400Regular",
                          },
                        ]}
                      >
                        {review.comment}
                      </Text>
                      <View style={styles.reviewerRow}>
                        <Text style={[
                            styles.reviewerName,
                            {
                              color: colors.ink,
                              fontFamily: "DMSans_500Medium",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {userName}
                        </Text>
                        {review.isVerifiedBuyer ? (
                          <View style={styles.verifiedRow}>
                            <CircleCheck size={12} color={colors.gold} />
                            <Text style={[
                                styles.verifiedText,
                                {
                                  color: colors.gold,
                                  fontFamily: "DMSans_500Medium",
                                },
                              ]}
                            >
                              Verified Buyer
                            </Text>
                          </View>
                        ) : null}
                        <Text style={[
                            styles.reviewerDate,
                            {
                              color: colors.warmGray,
                              fontFamily: "DMSans_400Regular",
                            },
                          ]}
                        >
                          · {formattedDate}
                        </Text>
                        <View style={{ flex: 1 }} />
                        <Pressable onPress={() =>
                            review._id && handleHelpfulVote(review._id)
                          }
                          hitSlop={8}
                          style={[
                            styles.helpfulBtn,
                            {
                              borderColor: voted
                                ? colors.gold
                                : colors.midGray,
                              backgroundColor: voted
                                ? colors.champagne
                                : "transparent",
                            },
                          ]}
                        >
                          <ThumbsUp size={12} color={voted ? colors.gold : colors.warmGray} />
                          <Text style={[
                              styles.helpfulText,
                              {
                                color: voted
                                  ? colors.gold
                                  : colors.warmGray,
                                fontFamily: "DMSans_500Medium",
                              },
                            ]}
                          >
                            {review.helpfulCount ?? review.helpful ?? 0}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Related products */}
          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[
                  styles.relatedLabel,
                  { color: colors.gold, fontFamily: "DMSans_500Medium" },
                ]}
              >
                YOU MAY ALSO LOVE
              </Text>
              <Text style={[
                  styles.relatedTitle,
                  {
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_500Medium_Italic",
                  },
                ]}
              >
                Complete the Look
              </Text>
              <View style={styles.relatedGrid}>
                {related.map((p: JeweleryProduct) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 100 + stickyBarOffset }} />
        </View>
      </ScrollView>

      {/* Sticky bottom bar — viewport-fixed on web so it is always
          visible (the page scrolls at document level, so in-flow would
          park it at the end of the content). Native keeps it in-flow
          below its bounded ScrollView. */}
      <View style={[
          styles.stickyBar,
          {
            backgroundColor: colors.ivory,
            borderTopColor: colors.midGray,
            // Web: the bar is fixed above the 60px tab bar, so no safe-area
            // padding needed — the old bottomPad+12 left a cream gap.
            // Native keeps the inset for the home indicator.
            paddingBottom: Platform.OS === "web" ? 12 : bottomPad + 12,
            ...(Platform.OS === "web"
              ? ({
                  position: "fixed",
                  bottom: stickyBarOffset,
                  left: 0,
                  right: 0,
                  zIndex: 60,
                } as any)
              : null),
          },
        ]}
      >
        <Pressable style={[styles.wishlistStickyBtn, { borderColor: colors.midGray }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleWishlist(product);
          }}
        >
          <Heart size={18} color={wishlisted ? colors.gold : colors.ink} />
        </Pressable>
        {canTryOn && (
          <Pressable onPress={handleTryOn}
            style={({ pressed }) => [
              styles.tryOnBtn,
              {
                borderColor: colors.gold,
                backgroundColor: pressed ? colors.champagne : "transparent",
              },
            ]}
          >
            <Camera size={16} color={colors.gold} />
            <Text style={[
                styles.tryOnText,
                { color: colors.gold, fontFamily: "DMSans_500Medium" },
              ]}
            >
              Try Live
            </Text>
          </Pressable>
        )}
        <Pressable onPress={
            isInCart
              ? () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  goTo(navigate, "/jewelery/(tabs)/cart" as any);
                }
              : handleAddToCart
          }
          style={({ pressed }) => [
            styles.addToCartBtn,
            {
              backgroundColor: isInCart
                ? pressed
                  ? colors.goldLight
                  : colors.emerald
                : addedToCart
                  ? colors.emerald
                  : pressed
                    ? colors.goldLight
                    : colors.gold,
            },
          ]}
        >
          {isInCart ? (
            <ArrowRight size={16} color={colors.onBrand} />
          ) : addedToCart ? (
            <Check size={16} color={colors.onBrand} />
          ) : (
            <ShoppingBag size={16} color={colors.onBrand} />
          )}
          <Text style={[
              styles.addToCartText,
              { color: colors.onBrand, fontFamily: "DMSans_500Medium" },
            ]}
          >
            {isInCart
              ? "Go to Cart →"
              : addedToCart
                ? "Added to Bag"
                : "Add to Bag"}
          </Text>
        </Pressable>
      </View>

      {/* Write-a-review sheet — same review pipeline as clothing,
          rendered in the jewellery palette */}
      <WriteReviewModal visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={async (reviewData) => {
          await createReviewMutation.mutateAsync(reviewData);
        }}
        productTitle={product.name}
        authRoute="/jewelery/auth/sign-in"
        theme={modalTheme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  notFound: { textAlign: "center", marginTop: 100, fontSize: 16 },
  backBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 14,
  },
  breadcrumb: { fontSize: 10, letterSpacing: 0.5 },
  productName: {
    fontSize: 30,
    lineHeight: 36,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: { fontSize: 11, marginLeft: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  price: { fontSize: 24 },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  description: { fontSize: 16, lineHeight: 26 },
  occasionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  occasionTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  occasionTagText: { fontSize: 10, letterSpacing: 0.3 },
  trustSection: {
    borderWidth: 0.5,
    borderRadius: 2,
    padding: 14,
    gap: 10,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  trustText: { fontSize: 12 },
  craftSection: {
    borderTopWidth: 0.5,
    paddingTop: 16,
    gap: 12,
  },
  craftLabel: { fontSize: 9, letterSpacing: 2 },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  specItem: { width: "47%" },
  specKey: { fontSize: 10, letterSpacing: 0.5 },
  specVal: { fontSize: 13, marginTop: 2 },
  craftDetail: { fontSize: 14, lineHeight: 22 },
  firstReviewTeaser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderRadius: 2,
  },
  firstReviewText: { fontSize: 13 },
  reviewsSection: {
    borderTopWidth: 0.5,
    paddingTop: 16,
    gap: 14,
  },
  reviewsLabel: { fontSize: 9, letterSpacing: 2 },
  summaryRow: { flexDirection: "row", gap: 20 },
  summaryLeft: { alignItems: "center", gap: 4, minWidth: 110 },
  bigRating: { fontSize: 38, lineHeight: 44 },
  summaryCount: { fontSize: 11, textAlign: "center" },
  distCol: { flex: 1, gap: 6, justifyContent: "center" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  distStar: { fontSize: 11, width: 22 },
  distTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  distFill: { height: 6, borderRadius: 3 },
  distCount: { fontSize: 11, width: 20, textAlign: "right" },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderWidth: 1,
    borderRadius: 2,
  },
  rateBtnText: { fontSize: 13, letterSpacing: 1 },
  emptyReviewsWrap: { alignItems: "center", gap: 6, paddingVertical: 8 },
  emptyReviewsTitle: { fontSize: 18 },
  emptyReviewsSub: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  reviewCard: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  reviewTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  ratingPillText: { fontSize: 11, fontWeight: "800" },
  reviewTitle: { fontSize: 13, flex: 1 },
  reviewBody: { fontSize: 13, lineHeight: 19 },
  reviewerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewerName: { fontSize: 12, maxWidth: 140 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: { fontSize: 11 },
  reviewerDate: { fontSize: 11 },
  helpfulBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderRadius: 2,
  },
  helpfulText: { fontSize: 11 },
  relatedSection: { gap: 10 },
  relatedLabel: { fontSize: 9, letterSpacing: 2 },
  relatedTitle: { fontSize: 22, lineHeight: 28 },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  stickyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
    borderTopWidth: 0.5,
    width: "100%",
  },
  wishlistStickyBtn: {
    width: 48,
    height: 52,
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tryOnBtn: {
    height: 52,
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  tryOnText: { fontSize: 12, letterSpacing: 1.1 },
  addToCartBtn: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 2,
  },
  addToCartText: { fontSize: 13, letterSpacing: 1.5 },
});
