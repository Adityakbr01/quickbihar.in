import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Share,
  Linking,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useMallDetail, useSubmitMallReview } from "../hooks/useMalls";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface MallDetailScreenProps {
  id: string;
}

const MallDetailScreen: React.FC<MallDetailScreenProps> = ({ id }) => {
  const router = useRouter();
  const theme = useTheme() as any;
  const { data, isLoading, isError } = useMallDetail(id);
  const submitReviewMutation = useSubmitMallReview(id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
          Loading Mall details...
        </Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={theme.primary} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          Could not load mall information.
        </Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { mall, products, reviews, matchingMalls } = data;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Explore ${mall.name} at ${mall.location} on QuickBihar! 🛍️`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = () => {
    submitReviewMutation.mutate(
      { rating, comment },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Review Submitted",
            text2: "Thank you for rating this mall!",
          });
          setComment("");
          setShowReviewForm(false);
        },
        onError: (err: any) => {
          Toast.show({
            type: "error",
            text1: "Submission Failed",
            text2: err.message || "Failed to submit review.",
          });
        },
      }
    );
  };

  const mallImages = (mall.images && mall.images.length > 0)
    ? mall.images
    : [{ url: mall.image || mall.coverImageUrl || mall.logoUrl || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800" }];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleGetDirections = () => {
    const { latitude, longitude } = mall.address || {};
    if (latitude && longitude) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`).catch((err) => {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not open Google Maps",
        });
        console.error("Open Maps Error:", err);
      });
    }
  };

  return (
    <SafeViewWrapper>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Cover Image Slider & Header */}
        <View style={styles.heroContainer}>
          <FlatList
            data={mallImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            onMomentumScrollEnd={(event) => {
              const slideSize = event.nativeEvent.layoutMeasurement.width;
              const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={[styles.coverImage, { width: SCREEN_WIDTH }]} resizeMode="cover" />
            )}
          />
          <LinearGradient colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.85)"]} style={styles.gradientOverlay} pointerEvents="none" />
          
          {/* Header Actions */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navIconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.navIconBtn}>
              <Ionicons name="share-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Mall Title Overlay */}
          <View style={styles.titleOverlay}>
            <View style={styles.badgeRow}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>MALL</Text>
              </View>
              {mall.sellerCount > 0 && (
                <View style={styles.shopsBadge}>
                  <Text style={styles.shopsBadgeText}>{mall.sellerCount} Stores</Text>
                </View>
              )}
            </View>
            <Text style={styles.mallNameText}>{mall.name}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <Text style={[styles.taglineText, { flex: 1, marginRight: 8 }]} numberOfLines={1}>{mall.tagline}</Text>
              {mallImages.length > 1 && (
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {mallImages.map((_: any, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: idx === activeImageIndex ? "#FFF" : "rgba(255,255,255,0.4)"
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Mall Details Block */}
        <View style={styles.detailBlock}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={[styles.locationContainer, { marginBottom: 0, flex: 1, marginRight: 8 }]}>
              <Ionicons name="location-outline" size={18} color={theme.primary} />
              <Text style={[styles.locationText, { color: theme.secondaryText }]} numberOfLines={2}>{mall.location}</Text>
            </View>
            {mall.address?.latitude && mall.address?.longitude && (
              <TouchableOpacity
                onPress={handleGetDirections}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.5,
                }}
              >
                <Ionicons name="map-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>Get Directions</Text>
              </TouchableOpacity>
            )}
          </View>

          {mall.isMobileVisible !== false && !!mall.mobileNumber && (
            <TouchableOpacity 
              onPress={() => Linking.openURL(`tel:${mall.mobileNumber}`).catch(() => {})}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
            >
              <Ionicons name="call-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.secondaryText, fontSize: 14, fontWeight: "500" }}>
                Contact: <Text style={{ color: theme.text, fontWeight: "600" }}>{mall.mobileNumber}</Text>
              </Text>
            </TouchableOpacity>
          )}

          {mall.description && (
            <Text style={[styles.descriptionText, { color: theme.tertiaryText }]}>{mall.description}</Text>
          )}

          <View style={[styles.ratingOverviewRow, { borderColor: theme.border }]}>
            <View style={styles.ratingOverviewLeft}>
              <Text style={[styles.ratingNumber, { color: theme.text }]}>{mall.rating}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(mall.rating) ? "star" : star - 0.5 <= mall.rating ? "star-half" : "star-outline"}
                    size={16}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={[styles.reviewsCountText, { color: theme.tertiaryText }]}>
                {reviews.length} Customer Reviews
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.writeReviewTriggerBtn, { borderColor: theme.primary }]}
              onPress={() => {
                if (!isAuthenticated) {
                  router.push("/auth" as any);
                } else {
                  setShowReviewForm(!showReviewForm);
                }
              }}
            >
              <Ionicons name="create-outline" size={16} color={theme.primary} />
              <Text style={[styles.writeReviewTriggerBtnText, { color: theme.primary }]}>
                {showReviewForm ? "Cancel Review" : "Write Review"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandable Write a Review Form */}
        {showReviewForm && (
          <View style={[styles.reviewFormContainer, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>Rate your experience</Text>
            <View style={styles.ratingSelectorRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starTouch}>
                  <Ionicons name={star <= rating ? "star" : "star-outline"} size={32} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.commentInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Tell us about the stores, parking, ambiance, etc. (optional)"
              placeholderTextColor={theme.tertiaryText}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity
              style={[styles.submitReviewBtn, { backgroundColor: theme.primary }]}
              onPress={handleReviewSubmit}
              disabled={submitReviewMutation.isPending}
            >
              {submitReviewMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitReviewBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Mall Products Grid */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Trending Products in Mall</Text>
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-handle-outline" size={48} color={theme.tertiaryText} />
              <Text style={[styles.emptyText, { color: theme.tertiaryText }]}>No products listed in this mall yet.</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.productCard, { backgroundColor: theme.tertiaryBackground }]}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                >
                  <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                  {item.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{item.discount}</Text>
                    </View>
                  )}
                  <View style={styles.productDetails}>
                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.productPrice, { color: theme.primary }]}>{item.price}</Text>
                      {item.originalPrice && (
                        <Text style={[styles.productOriginalPrice, { color: theme.tertiaryText }]}>
                          {item.originalPrice}
                        </Text>
                      )}
                    </View>
                    <View style={styles.productRatingRow}>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                      <Text style={[styles.productRatingVal, { color: theme.secondaryText }]}>{item.rating}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Mall Reviews List */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbox-ellipses-outline" size={40} color={theme.tertiaryText} />
              <Text style={[styles.emptyText, { color: theme.tertiaryText }]}>Be the first to review this mall!</Text>
            </View>
          ) : (
            reviews.map((review: any) => (
              <View key={review.id} style={[styles.reviewCard, { borderBottomColor: theme.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    {review.user.avatarUrl ? (
                      <Image source={{ uri: review.user.avatarUrl }} style={styles.avatarImage} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: theme.primary + "20" }]}>
                        <Text style={[styles.avatarFallbackText, { color: theme.primary }]}>
                          {review.user.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={[styles.reviewerName, { color: theme.text }]}>{review.user.fullName}</Text>
                    <Text style={[styles.reviewDate, { color: theme.tertiaryText }]}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.reviewRatingBadge}>
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.reviewRatingBadgeText}>{review.rating}</Text>
                  </View>
                </View>
                {review.comment ? (
                  <Text style={[styles.reviewComment, { color: theme.secondaryText }]}>{review.comment}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Matching Malls */}
        <View style={[styles.sectionContainer, { paddingBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Other Malls in City</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchingMallsScroll}>
            {matchingMalls.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.matchingCard, { backgroundColor: theme.tertiaryBackground }]}
                onPress={() => router.push(`/mall/${item.id}` as any)}
              >
                <Image source={{ uri: item.image }} style={styles.matchingImage} resizeMode="cover" />
                <View style={styles.matchingDetails}>
                  <Text style={[styles.matchingName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.matchingLocation, { color: theme.tertiaryText }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                  <View style={styles.matchingRatingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={[styles.matchingRatingVal, { color: theme.text }]}>{item.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  backBtn: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFF",
    fontWeight: "600",
  },
  heroContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  headerRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  premiumBadge: {
    backgroundColor: "#E11D48",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  shopsBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  shopsBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  mallNameText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  taglineText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 4,
  },
  detailBlock: {
    padding: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  ratingOverviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  ratingOverviewLeft: {
    flexDirection: "column",
    gap: 2,
  },
  ratingNumber: {
    fontSize: 28,
    fontWeight: "800",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginVertical: 2,
  },
  reviewsCountText: {
    fontSize: 12,
  },
  writeReviewTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  writeReviewTriggerBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewFormContainer: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  ratingSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  starTouch: {
    padding: 4,
  },
  commentInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
    fontSize: 13,
    marginBottom: 16,
  },
  submitReviewBtn: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitReviewBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  productCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 160,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#22C55E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "700",
  },
  productDetails: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  productOriginalPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  productRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  productRatingVal: {
    fontSize: 10,
    fontWeight: "500",
  },
  reviewCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerAvatar: {
    marginRight: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: "700",
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewDate: {
    fontSize: 10,
    marginTop: 2,
  },
  reviewRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reviewRatingBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 46,
  },
  matchingMallsScroll: {
    gap: 12,
  },
  matchingCard: {
    width: 180,
    borderRadius: 12,
    overflow: "hidden",
  },
  matchingImage: {
    width: "100%",
    height: 110,
  },
  matchingDetails: {
    padding: 10,
  },
  matchingName: {
    fontSize: 13,
    fontWeight: "700",
  },
  matchingLocation: {
    fontSize: 11,
    marginTop: 2,
  },
  matchingRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  matchingRatingVal: {
    fontSize: 11,
    fontWeight: "700",
  },
});

export default MallDetailScreen;
