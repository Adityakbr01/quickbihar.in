import { ArrowLeft, ArrowRight, Award, Camera, Check, CircleCheck, Gift, Heart, PenLine, RefreshCw, ShoppingBag, Star, ThumbsUp, Truck } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo, useRouteParams } from "@/src/utils/navigation";
import React, { useState } from "react";
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
    <div className="flex flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} color={s <= Math.round(rating) ? colors.gold : colors.midGray} />
      ))}
      <span
        className="ml-1 text-[11px]"
        style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
      >
        {rating} ({count} reviews)
      </span>
    </div>
  );
}

export default function JeweleryProductDetailScreen() {
  const navigate = useNavigate();
  const { id } = useRouteParams<{ id: string }>();
  const colors = useColors();
  const { addToCart, toggleWishlist, isWishlisted, cartItems } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  // Mobile web tab bar is fixed-position and overlays the viewport bottom —
  // lift the sticky bar above it (0 on desktop, no visual diff).
  const stickyBarOffset = useStickyBarBottomOffset();

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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: colors.ivory }}
      >
        <span
          className="h-6 w-6 animate-spin rounded-full border-2"
          style={{ borderColor: `${colors.gold}30`, borderTopColor: colors.gold }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: colors.ivory }}>
        <p className="mt-[100px] text-center text-[16px]" style={{ color: colors.warmGray }}>
          Product not found
        </p>
      </div>
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
    <div className="flex min-h-screen flex-col overflow-hidden" style={{ backgroundColor: colors.ivory }}>
      {/* Back button overlay */}
      <div
        className="absolute right-4 left-4 z-10 flex flex-row justify-between"
        style={{ top: 16 + 10 }}
      >
        <button
          type="button"
          onClick={() => goBack(navigate)}
          aria-label="Go back"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
          style={{ backgroundColor: colors.card, borderColor: colors.midGray, borderWidth: 1 }}
        >
          <ArrowLeft size={18} color={colors.ink} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!useAuthStore.getState().isAuthenticated) {
              navigate("/auth");
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleWishlist(product);
          }}
          aria-label="Toggle wishlist"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
          style={{ backgroundColor: colors.card, borderColor: colors.midGray, borderWidth: 1 }}
        >
          <Heart size={18} color={wishlisted ? colors.gold : colors.ink} />
        </button>
      </div>

      <div className="overflow-auto">
        {/* Image carousel */}
        <ImageCarousel images={product.images} />

        {/* Content */}
        <div className="flex flex-col gap-[14px] p-5" style={{ backgroundColor: colors.ivory }}>
          {/* Breadcrumb — real collection only, never a hardcoded category */}
          {product.collection ? (
            <p
              className="text-[10px] tracking-[0.5px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              {product.collection}
            </p>
          ) : null}

          {/* Name & rating */}
          <h1
            className="text-[30px] leading-9"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_500Medium_Italic",
            }}
          >
            {product.name}
          </h1>
          {totalReviews > 0 ? (
            <Stars rating={averageRating} count={totalReviews} />
          ) : (
            <button
              type="button"
              onClick={handleRateAndReview}
              className="mt-[10px] flex cursor-pointer flex-row items-center gap-2 rounded-[2px] border px-[14px] py-[10px] text-left"
              style={{ borderColor: colors.gold, backgroundColor: colors.champagne, borderWidth: 1 }}
            >
              <Star size={14} color={colors.gold} />
              <span
                className="text-[13px]"
                style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
              >
                Be the first to review this piece
              </span>
            </button>
          )}

          {/* Price */}
          <div className="flex flex-row items-center gap-[10px]">
            <span
              className="text-[24px]"
              style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
            >
              {APP_CURRENCY}{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span
                className="text-[14px] line-through"
                style={{
                  color: colors.warmGray,
                  fontFamily: "DMSans_400Regular",
                }}
              >
                {APP_CURRENCY}{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Description */}
          <p
            className="text-[16px] leading-[26px]"
            style={{
              color: colors.warmGray,
              fontFamily: "CormorantGaramond_400Regular_Italic",
            }}
          >
            {product.description}
          </p>

          {/* Occasions */}
          <div className="flex flex-row flex-wrap gap-1.5">
            {product.occasions.map((o) => (
              <div key={o}
                className="rounded-full border px-[10px] py-1"
                style={{
                  backgroundColor: colors.champagne,
                  borderColor: colors.midGray,
                  borderWidth: 1,
                }}
              >
                <span
                  className="text-[10px] tracking-[0.3px]"
                  style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                >
                  {o}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery & trust */}
          <div
            className="flex flex-col gap-[10px] rounded-[2px] border p-[14px]"
            style={{ backgroundColor: colors.pearl, borderColor: colors.midGray, borderWidth: 1 }}
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
              <div key={t.text} className="flex flex-row items-center gap-[10px]">
                <t.icon size={13} color={colors.gold} />
                <span
                  className="text-[12px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  {t.text}
                </span>
              </div>
            ))}
          </div>

          {/* Craftsmanship */}
          <div
            className="flex flex-col gap-3 border-t pt-4"
            style={{ borderTopColor: colors.midGray, borderTopWidth: 1 }}
          >
            <p
              className="text-[9px] tracking-[2px]"
              style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
            >
              CRAFTSMANSHIP DETAILS
            </p>
            <div className="flex flex-row flex-wrap gap-3">
              {[
                product.metal ? { key: "Metal", val: product.metal } : null,
                product.stone ? { key: "Stone", val: product.stone } : null,
                product.weight ? { key: "Weight", val: product.weight } : null,
                // No fallback purity claim — the row only renders for real data.
                product.purity ? { key: "Purity", val: product.purity } : null,
              ]
                .filter(Boolean)
                .map((spec) => (
                  <div key={spec!.key} className="w-[47%]">
                    <p
                      className="text-[10px] tracking-[0.5px]"
                      style={{
                        color: colors.warmGray,
                        fontFamily: "DMSans_400Regular",
                      }}
                    >
                      {spec!.key}
                    </p>
                    <p
                      className="mt-[2px] text-[13px]"
                      style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                    >
                      {spec!.val}
                    </p>
                  </div>
                ))}
            </div>
            {product.craftDetail ? (
              <p
                className="text-[14px] leading-[22px]"
                style={{
                  color: colors.warmGray,
                  fontFamily: "CormorantGaramond_400Regular_Italic",
                }}
              >
                {product.craftDetail}
              </p>
            ) : null}
          </div>

          {/* Ratings & Reviews — same review pipeline as clothing,
              dressed in the jewellery theme */}
          <div
            className="flex flex-col gap-[14px] border-t pt-4"
            style={{ borderTopColor: colors.midGray, borderTopWidth: 1 }}
          >
            <p
              className="text-[9px] tracking-[2px]"
              style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
            >
              RATINGS & REVIEWS
              {totalReviews > 0 ? ` (${totalReviews})` : ""}
            </p>

            {totalReviews > 0 ? (
              <div className="flex flex-row gap-5">
                <div className="flex min-w-[110px] flex-col items-center gap-1">
                  <span
                    className="text-[38px] leading-[44px]"
                    style={{
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_600SemiBold",
                    }}
                  >
                    {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                  </span>
                  <Stars rating={averageRating} count={totalReviews} />
                  <span
                    className="text-center text-[11px]"
                    style={{
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    }}
                  >
                    {totalReviews} verified rating
                    {totalReviews === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = (distribution as any)[star] || 0;
                    const pct =
                      totalReviews > 0
                        ? Math.round((count / totalReviews) * 100)
                        : 0;
                    return (
                      <div key={star} className="flex flex-row items-center gap-2">
                        <span
                          className="w-[22px] text-[11px]"
                          style={{
                            color: colors.warmGray,
                            fontFamily: "DMSans_500Medium",
                          }}
                        >
                          {star}★
                        </span>
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full"
                          style={{ backgroundColor: colors.pearl }}
                        >
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              backgroundColor: colors.gold,
                              width: `${pct}%`,
                            }}
                          />
                        </div>
                        <span
                          className="w-5 text-right text-[11px]"
                          style={{
                            color: colors.warmGray,
                            fontFamily: "DMSans_400Regular",
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleRateAndReview}
              className="flex cursor-pointer flex-row items-center justify-center gap-2 rounded-[2px] border py-[13px]"
              style={{
                borderColor: colors.gold,
                backgroundColor: colors.champagne,
              }}
            >
              <PenLine size={14} color={colors.gold} />
              <span
                className="text-[13px] tracking-[1px]"
                style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
              >
                Rate & Review
              </span>
            </button>

            {reviewsList.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-2">
                <p
                  className="text-[18px]"
                  style={{
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_500Medium_Italic",
                  }}
                >
                  No reviews yet
                </p>
                <p
                  className="text-center text-[12px] leading-[18px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  Bought this piece? Share your experience with other shoppers.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
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
                    <div key={review._id || review.id || idx}
                      className="flex flex-col gap-2 border-b py-[14px]"
                      style={{ borderBottomColor: colors.midGray, borderBottomWidth: 1 }}
                    >
                      <div className="flex flex-row items-center gap-2">
                        <div className="rounded-[2px] px-2 py-[3px]"
                          style={{ backgroundColor: pillBg }}
                        >
                          <span className="text-[11px] font-extrabold" style={{ color: colors.onBrand }}>
                            {review.rating} ★
                          </span>
                        </div>
                        <span
                          className="flex-1 truncate text-[13px]"
                          style={{
                            color: colors.ink,
                            fontFamily: "DMSans_500Medium",
                          }}
                        >
                          {review.title || "Customer Review"}
                        </span>
                      </div>
                      <p
                        className="text-[13px] leading-[19px]"
                        style={{
                          color: colors.warmGray,
                          fontFamily: "DMSans_400Regular",
                        }}
                      >
                        {review.comment}
                      </p>
                      <div className="flex flex-row items-center gap-1.5">
                        <span
                          className="max-w-[140px] truncate text-[12px]"
                          style={{
                            color: colors.ink,
                            fontFamily: "DMSans_500Medium",
                          }}
                        >
                          {userName}
                        </span>
                        {review.isVerifiedBuyer ? (
                          <span className="flex flex-row items-center gap-[3px]">
                            <CircleCheck size={12} color={colors.gold} />
                            <span
                              className="text-[11px]"
                              style={{
                                color: colors.gold,
                                fontFamily: "DMSans_500Medium",
                              }}
                            >
                              Verified Buyer
                            </span>
                          </span>
                        ) : null}
                        <span
                          className="text-[11px]"
                          style={{
                            color: colors.warmGray,
                            fontFamily: "DMSans_400Regular",
                          }}
                        >
                          · {formattedDate}
                        </span>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={() =>
                            review._id && handleHelpfulVote(review._id)
                          }
                          className="flex cursor-pointer flex-row items-center gap-[5px] rounded-[2px] border px-[10px] py-1.5"
                          style={{
                            borderColor: voted
                              ? colors.gold
                              : colors.midGray,
                            borderWidth: 1,
                            backgroundColor: voted
                              ? colors.champagne
                              : "transparent",
                          }}
                        >
                          <ThumbsUp size={12} color={voted ? colors.gold : colors.warmGray} />
                          <span
                            className="text-[11px]"
                            style={{
                              color: voted
                                ? colors.gold
                                : colors.warmGray,
                              fontFamily: "DMSans_500Medium",
                            }}
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
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="flex flex-col gap-[10px]">
              <p
                className="text-[9px] tracking-[2px]"
                style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
              >
                YOU MAY ALSO LOVE
              </p>
              <h2
                className="text-[22px] leading-7"
                style={{
                  color: colors.ink,
                  fontFamily: "CormorantGaramond_500Medium_Italic",
                }}
              >
                Complete the Look
              </h2>
              <div className="flex flex-row flex-wrap justify-between gap-2">
                {related.map((p: JeweleryProduct) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          <div style={{ height: 100 + stickyBarOffset }} />
        </div>
      </div>

      {/* Sticky bottom bar — viewport-fixed on web so it is always
          visible (the page scrolls at document level, so in-flow would
          park it at the end of the content). */}
      <div
        className="fixed right-0 left-0 z-[60] flex w-full flex-row items-center gap-3 border-t px-5 pt-[14px]"
        style={{
          backgroundColor: colors.ivory,
          borderTopColor: colors.midGray,
          borderTopWidth: 1,
          paddingBottom: 12,
          bottom: stickyBarOffset,
        }}
      >
        <button
          type="button"
          aria-label="Toggle wishlist"
          onClick={() => {
            if (!useAuthStore.getState().isAuthenticated) {
              navigate("/auth");
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleWishlist(product);
          }}
          className="flex h-[52px] w-12 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border"
          style={{ borderColor: colors.midGray }}
        >
          <Heart size={18} color={wishlisted ? colors.gold : colors.ink} />
        </button>
        {canTryOn && (
          <button
            type="button"
            onClick={handleTryOn}
            className="flex h-[52px] shrink-0 cursor-pointer flex-row items-center justify-center gap-2 rounded-[2px] border px-3"
            style={{
              borderColor: colors.gold,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.champagne;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <Camera size={16} color={colors.gold} />
            <span
              className="text-[12px] tracking-[1.1px]"
              style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
            >
              Try Live
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={
            isInCart
              ? () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  goTo(navigate, "/jewelery/(tabs)/cart" as any);
                }
              : handleAddToCart
          }
          className="flex h-[52px] min-w-0 flex-1 cursor-pointer flex-row items-center justify-center gap-2 rounded-[2px]"
          style={{
            backgroundColor: isInCart
              ? colors.emerald
              : addedToCart
                ? colors.emerald
                : colors.gold,
          }}
          onMouseEnter={(e) => {
            if (!isInCart && !addedToCart) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.goldLight;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = isInCart
              ? colors.emerald
              : addedToCart
                ? colors.emerald
                : colors.gold;
          }}
        >
          {isInCart ? (
            <ArrowRight size={16} color={colors.onBrand} />
          ) : addedToCart ? (
            <Check size={16} color={colors.onBrand} />
          ) : (
            <ShoppingBag size={16} color={colors.onBrand} />
          )}
          <span
            className="text-[13px] tracking-[1.5px]"
            style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
          >
            {isInCart
              ? "Go to Cart →"
              : addedToCart
                ? "Added to Bag"
                : "Add to Bag"}
          </span>
        </button>
      </div>

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
    </div>
  );
}
