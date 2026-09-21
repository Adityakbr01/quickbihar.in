import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import * as Haptics from "expo-haptics";

import { useRouter } from "expo-router";
import { TextInput } from "@/src/theme/components/TextInput";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import {
  Sheet,
  SheetFooter,
  SheetHeader,
  useSheet,
} from "@/src/components/common/BottomSheet";
import { spacing } from "@/src/theme/spacing";

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  productTitle?: string;
  theme: Theme;
}

const RATING_LABELS: Record<number, string> = {
  1: "Terrible 😞",
  2: "Bad 🙁",
  3: "Average 😐",
  4: "Good 😊",
  5: "Excellent! 🌟",
};

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  productTitle,
  theme,
}) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sheet = useSheet();

  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible, sheet]);

  const handleStarPress = (score: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(score);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onClose();
      router.push("/auth" as any);
      return;
    }

    if (!comment.trim()) {
      // Haptic-only — the comment box is focused right here in the sheet.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle("");
      setComment("");
      setRating(5);
      onClose();
    } catch (error: any) {
      // Haptic-only failure signal — the sheet stays open to retry.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <Sheet ref={sheet} onDidDismiss={onClose} backgroundColor={theme.background}>
      <SheetHeader
        title="Write a Review"
        subtitle={productTitle}
        onClose={onClose}
        themeOverride={theme}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Rating Stars Selector */}
        <View style={styles.ratingSelectSection}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Overall Rating
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                activeOpacity={0.7}
                onPress={() => handleStarPress(star)}
                style={styles.starTouch}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.ratingLabelText, { color: theme.primary }]}>
            {RATING_LABELS[rating]}
          </Text>
        </View>

        {/* Review Title Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>
            Review Title (Optional)
          </Text>
          <TextInput
            placeholder="e.g. Great fabric and perfect fit"
            placeholderTextColor={theme.tertiaryText}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            containerStyle={{ marginBottom: 0 }}
            inputContainerStyle={{
              backgroundColor: theme.tertiaryBackground,
              borderRadius: 10,
              borderWidth: 1,
              paddingHorizontal: 14,
              height: 48,
            }}
            style={{ fontSize: 14, color: theme.text }}
          />
        </View>

        {/* Detailed Comment Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>
            Your Experience *
          </Text>
          <TextInput
            placeholder="How was the quality, fit, color, and delivery? Share details that will help other shoppers..."
            placeholderTextColor={theme.tertiaryText}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={1000}
            containerStyle={{ marginBottom: 0 }}
            inputContainerStyle={{
              backgroundColor: theme.tertiaryBackground,
              borderRadius: 10,
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 12,
              minHeight: 110,
            }}
            style={{ fontSize: 14, color: theme.text, textAlignVertical: "top" }}
          />
          <Text style={[styles.charCount, { color: theme.tertiaryText }]}>
            {comment.length}/1000
          </Text>
        </View>
      </ScrollView>

      {/* Footer Submit Button */}
      <SheetFooter>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: theme.primary, opacity: isSubmitting ? 0.7 : 1 },
          ]}
          disabled={isSubmitting}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </SheetFooter>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  ratingSelectSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
  },
  starTouch: {
    padding: 4,
  },
  ratingLabelText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  submitBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
