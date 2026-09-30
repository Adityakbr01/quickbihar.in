import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShoppingBag,
  SquarePen,
  Star,
  StarHalf,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useMallDetail, useSubmitMallReview } from "../hooks/useMalls";
import { TextInput } from "@/src/theme/components/TextInput";
import { Gradient } from "@/src/components/common/Gradient";
import Carousel from "@/src/components/common/EmblaCarousel";
import * as Haptics from "@/lib/haptics";
import { goBack, goTo } from "@/src/utils/navigation";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

interface MallDetailScreenProps {
  id: string;
}

const MallDetailScreen: React.FC<MallDetailScreenProps> = ({
  id,
}) => {
  const navigate = useNavigate();
  const theme = useTheme() as any;
  // Live width so rotation / foldables / small phones never overflow.
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const { data, isLoading, isError } = useMallDetail(id);
  const submitReviewMutation = useSubmitMallReview(id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
          <span
            className="block h-9 w-9 animate-spin rounded-full border-[5px] border-t-transparent"
            style={{
              borderColor: `${theme.primary}30`,
              borderTopColor: theme.primary,
            }}
          />
          <p
            className="mt-3 text-sm font-medium"
            style={{ color: theme.secondaryText }}
          >
            Loading Mall details...
          </p>
        </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{ backgroundColor: theme.background }}
      >
          <CircleAlert size={60} color={theme.primary} />
          <p
            className="mt-4 text-center text-base font-medium"
            style={{ color: theme.text }}
          >
            Could not load mall information.
          </p>
          <button
            type="button"
            onClick={() => goBack(navigate)}
            className="mt-6 cursor-pointer rounded-lg px-5 py-3 font-semibold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            Go Back
          </button>
        </div>
    );
  }

  const { mall, products, reviews, matchingMalls } = data;

  const handleShare = async () => {
    const text = `Explore ${mall.name} at ${mall.location} on QuickBihar! 🛍️`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = () => {
    submitReviewMutation.mutate(
      { rating, comment },
      {
        onSuccess: () => {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
          setComment("");
          setShowReviewForm(false);
        },
        onError: () => {
          // Haptic-only failure signal — the form stays open to retry.
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          ).catch(() => {});
        },
      },
    );
  };

  const toImageUrl = (img: any): string =>
    typeof img === "string" ? img : img?.url || img?.uri || "";

  // Cover first, then gallery — accepts [{url}] objects or plain strings,
  // drops empties and dedupes so a missing shape can never blank the hero.
  const mallImages: string[] = Array.from(
    new Set(
      [
        mall.coverImageUrl,
        ...(Array.isArray(mall.images) ? mall.images : []),
        mall.image,
        mall.logoUrl,
      ]
        .map(toImageUrl)
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter(Boolean),
    ),
  );

  const heroImages =
    mallImages.length > 0
      ? mallImages
      : ["https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800"];

  const handleGetDirections = () => {
    const { latitude, longitude } = mall.address || {};
    if (latitude && longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        "_blank",
      );
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: theme.background }}
    >
        {/* Cover Image Slider & Header */}
        <div className="relative h-[300px] w-full">
          <Carousel
            width={windowWidth}
            height={300}
            data={heroImages}
            loop={heroImages.length > 1}
            autoPlay={heroImages.length > 1}
            autoPlayInterval={4000}
            scrollAnimationDuration={300}
            onSnapToItem={setActiveImageIndex}
            renderItem={({ item: uri, index }) => (
              <img
                key={`${index}-${uri}`}
                src={uri}
                alt={
                  index === 0
                    ? `${mall.name} cover photo - Shopping Mall in Bihar`
                    : `${mall.name} photo ${index + 1} - Shopping Mall in Bihar`
                }
                title={`${mall.name} | QuickBihar Local Mall`}
                className="h-full object-cover"
                style={{ width: windowWidth }}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "low"}
              />
            )}
          />
          <Gradient
            colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.85)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              top: 0,
              pointerEvents: "none",
            }}
          />

          {/* Header Actions */}
          <div className="absolute top-4 right-4 left-4 z-10 flex flex-row items-center justify-between">
            <button
              type="button"
              onClick={() => goBack(navigate)}
              aria-label="Go back"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/40"
            >
              <ArrowLeft size={24} color="#FFF" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share mall"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/40"
            >
              <Share2 size={22} color="#FFF" />
            </button>
          </div>

          {/* Mall Title Overlay */}
          <div className="absolute right-4 bottom-4 left-4">
            <div className="mb-2 flex flex-row gap-2">
              <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                MALL
              </span>
              {mall.sellerCount > 0 && (
                <span className="rounded bg-white/25 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {mall.sellerCount} Stores
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-white drop-shadow">
              {mall.name}
            </h1>
            <div className="mt-1 flex flex-row items-center justify-between">
              <p className="mr-2 flex-1 truncate text-sm text-white/85">
                {mall.tagline}
              </p>
              {heroImages.length > 1 && (
                <div className="flex flex-row gap-1">
                  {heroImages.map((_: any, idx: number) => (
                    <span
                      key={idx}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          idx === activeImageIndex
                            ? "#FFF"
                            : "rgba(255,255,255,0.4)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mall Details Block */}
        <div className="p-4">
          {/* Breadcrumb trail (visible match for BreadcrumbList JSON-LD) */}
          <nav
            className="mb-2 flex flex-row items-center text-xs"
            style={{ color: theme.secondaryText }}
          >
            <Link
              to="/"
              className="text-xs"
              style={{ color: theme.secondaryText }}
            >
              Home
            </Link>
            <span className="text-xs">{"  ›  "}</span>
            <Link
              to="/mall"
              className="text-xs"
              style={{ color: theme.secondaryText }}
            >
              Malls
            </Link>
            <span className="text-xs">{"  ›  "}</span>
            <span
              className="flex-1 truncate text-xs"
              style={{ color: theme.secondaryText }}
            >
              {mall.name}
            </span>
          </nav>
          <div className="mb-3 flex flex-row items-center justify-between">
            <div className="mr-2 mb-0 flex flex-1 flex-row items-center gap-1.5">
              <MapPin size={18} color={theme.primary} />
              <p
                className="line-clamp-2 text-sm font-medium"
                style={{ color: theme.secondaryText }}
              >
                {mall.location}
              </p>
            </div>
            {mall.address?.latitude && mall.address?.longitude && (
              <button
                type="button"
                onClick={handleGetDirections}
                className="flex cursor-pointer flex-row items-center rounded-full px-3 py-1.5 shadow"
                style={{ backgroundColor: theme.primary }}
              >
                <MapIcon size={14} color="#FFF" className="mr-1" />
                <span className="text-xs font-semibold text-white">
                  Get Directions
                </span>
              </button>
            )}
          </div>

          {mall.isMobileVisible !== false && !!mall.mobileNumber && (
            <a
              href={`tel:${mall.mobileNumber}`}
              className="mb-3 flex flex-row items-center"
            >
              <Phone size={16} color={theme.primary} className="mr-1.5" />
              <span
                className="text-sm font-medium"
                style={{ color: theme.secondaryText }}
              >
                Contact:{" "}
                <span className="font-semibold" style={{ color: theme.text }}>
                  {mall.mobileNumber}
                </span>
              </span>
            </a>
          )}

          {mall.description && (
            <p
              className="mb-5 text-[13px] leading-[18px]"
              style={{ color: theme.tertiaryText }}
            >
              {mall.description}
            </p>
          )}

          <div
            className="mt-2 flex flex-row items-center justify-between border-t pt-4"
            style={{ borderTopColor: theme.border }}
          >
            <div className="flex flex-col gap-0.5">
              <p
                className="text-[28px] font-extrabold"
                style={{ color: theme.text }}
              >
                {mall.rating}
              </p>
              <div className="my-0.5 flex flex-row gap-0.5">
                {[1, 2, 3, 4, 5].map((star) =>
                  star <= Math.floor(mall.rating) ? (
                    <Star key={star} size={16} color="#F59E0B" fill="#F59E0B" />
                  ) : star - 0.5 <= mall.rating ? (
                    <StarHalf key={star} size={16} color="#F59E0B" />
                  ) : (
                    <Star key={star} size={16} color="#F59E0B" />
                  ),
                )}
              </div>
              <p className="text-xs" style={{ color: theme.tertiaryText }}>
                {reviews.length} Customer Reviews
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  goTo(navigate, "/auth" as any);
                } else {
                  setShowReviewForm(!showReviewForm);
                }
              }}
              className="flex cursor-pointer flex-row items-center gap-1.5 rounded-full border px-3.5 py-2"
              style={{ borderColor: theme.primary }}
            >
              <SquarePen size={16} color={theme.primary} />
              <span
                className="text-xs font-semibold"
                style={{ color: theme.primary }}
              >
                {showReviewForm ? "Cancel Review" : "Write Review"}
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Write a Review Form */}
        {showReviewForm && (
          <div
            className="mx-4 mb-5 rounded-xl border p-4"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
          >
            <p
              className="mb-2.5 text-sm font-bold"
              style={{ color: theme.text }}
            >
              Rate your experience
            </p>
            <div className="mb-4 flex flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                  className="cursor-pointer p-1"
                >
                  {star <= rating ? (
                    <Star size={32} color="#F59E0B" fill="#F59E0B" />
                  ) : (
                    <Star size={32} color="#F59E0B" />
                  )}
                </button>
              ))}
            </div>
            <TextInput
              placeholder="Tell us about the stores, parking, ambiance, etc. (optional)"
              placeholderTextColor={theme.tertiaryText}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              containerStyle={{ marginBottom: 16 }}
              inputContainerStyle={{
                backgroundColor: theme.background,
                borderRadius: 8,
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 80,
              }}
              style={{
                fontSize: 13,
                color: theme.text,
                textAlignVertical: "top",
              }}
            />
            <button
              type="button"
              onClick={handleReviewSubmit}
              disabled={submitReviewMutation.isPending}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg py-3"
              style={{ backgroundColor: theme.primary }}
            >
              {submitReviewMutation.isPending ? (
                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span className="text-sm font-bold text-white">
                  Submit Review
                </span>
              )}
            </button>
          </div>
        )}

        {/* Mall Products Grid */}
        <div className="mt-5 px-4">
          <h2
            className="mb-3.5 text-lg font-extrabold tracking-tight"
            style={{ color: theme.text }}
          >
            Trending Products in Mall
          </h2>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-7.5">
              <ShoppingBag size={48} color={theme.tertiaryText} />
              <p className="text-[13px]" style={{ color: theme.tertiaryText }}>
                No products listed in this mall yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-row flex-wrap justify-start gap-3">
              {products.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    goTo(navigate, `/product/${item.slug || item.id}` as any)
                  }
                  className="relative cursor-pointer overflow-hidden rounded-xl text-left"
                  style={{
                    backgroundColor: theme.tertiaryBackground,
                    width: Math.max((windowWidth - 44) / 2, 140),
                  }}
                >
                  <img
                    src={item.image}
                    alt={`${item.name} - Shop Online in Bihar`}
                    title={`${item.name} | QuickBihar`}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {item.discount && (
                    <span className="absolute top-2 left-2 rounded bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {item.discount}
                    </span>
                  )}
                  <span className="block p-2.5">
                    <span
                      className="mb-1 block truncate text-[13px] font-semibold"
                      style={{ color: theme.text }}
                    >
                      {item.name}
                    </span>
                    <span className="mb-1 flex flex-row items-center gap-1.5">
                      <span
                        className="text-sm font-bold"
                        style={{ color: theme.primary }}
                      >
                        {item.price}
                      </span>
                      {item.originalPrice && (
                        <span
                          className="text-[11px] line-through"
                          style={{ color: theme.tertiaryText }}
                        >
                          {item.originalPrice}
                        </span>
                      )}
                    </span>
                    <span className="flex flex-row items-center gap-1">
                      <Star size={10} color="#F59E0B" fill="#F59E0B" />
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: theme.secondaryText }}
                      >
                        {item.rating}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mall Reviews List */}
        <div className="mt-5 px-4">
          <h2
            className="mb-3.5 text-lg font-extrabold tracking-tight"
            style={{ color: theme.text }}
          >
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-7.5">
              <MessageCircle size={40} color={theme.tertiaryText} />
              <p className="text-[13px]" style={{ color: theme.tertiaryText }}>
                Be the first to review this mall!
              </p>
            </div>
          ) : (
            reviews.map((review: any) => (
              <div
                key={review.id}
                className="border-b py-3.5"
                style={{ borderBottomColor: theme.border }}
              >
                <div className="mb-2 flex flex-row items-center">
                  <div className="mr-2.5">
                    {review.user.avatarUrl ? (
                      <img
                        src={review.user.avatarUrl}
                        alt={`${review.user.fullName} - QuickBihar reviewer`}
                        className="h-9 w-9 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: theme.primary + "20",
                          color: theme.primary,
                        }}
                      >
                        {review.user.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: theme.text }}
                    >
                      {review.user.fullName}
                    </p>
                    <p
                      className="mt-0.5 text-[10px]"
                      style={{ color: theme.tertiaryText }}
                    >
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="flex flex-row items-center gap-1 rounded-[10px] bg-amber-500 px-2 py-1">
                    <Star size={12} color="#fff" fill="#fff" />
                    <span className="text-[11px] font-bold text-white">
                      {review.rating}
                    </span>
                  </span>
                </div>
                {review.comment ? (
                  <p
                    className="pl-[46px] text-[13px] leading-[18px]"
                    style={{ color: theme.secondaryText }}
                  >
                    {review.comment}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>

        {/* Matching Malls */}
        <div className="mt-5 px-4 pb-10">
          <h2
            className="mb-3.5 text-lg font-extrabold tracking-tight"
            style={{ color: theme.text }}
          >
            Other Malls in City
          </h2>
          <div
            className="flex flex-row gap-3 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {matchingMalls.map((item: any) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(navigate, `/mall/${item.id}` as any)}
                className="w-[180px] shrink-0 cursor-pointer overflow-hidden rounded-xl text-left"
                style={{ backgroundColor: theme.tertiaryBackground }}
              >
                <img
                  src={item.image}
                  alt={`${item.name} - Shop Online in Bihar`}
                  title={`${item.name} | QuickBihar`}
                  className="h-[110px] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <span className="block p-2.5">
                  <span
                    className="block truncate text-[13px] font-bold"
                    style={{ color: theme.text }}
                  >
                    {item.name}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11px]"
                    style={{ color: theme.tertiaryText }}
                  >
                    {item.location}
                  </span>
                  <span className="mt-1.5 flex flex-row items-center gap-1">
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: theme.text }}
                    >
                      {item.rating}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
  );
};

export default MallDetailScreen;
