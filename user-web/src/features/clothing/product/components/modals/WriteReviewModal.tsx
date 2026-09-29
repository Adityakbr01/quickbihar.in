import React, { useState } from "react";
import { Star } from "lucide-react";
import { AppSheet } from "@/src/components/common/AppSheet";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import * as Haptics from "@/lib/haptics";

import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { TextInput } from "@/src/theme/components/TextInput";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  productTitle?: string;
  theme: Theme & { radius?: number };
  /** Where guests go when they try to review. Defaults to the common
   *  sign-in; jewellery passes its own sign-in route to stay in-module. */
  authRoute?: string;
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
  authRoute = "/auth",
}) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (score: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(score);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onClose();
      goTo(navigate, authRoute as any);
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
    } catch {
      // Haptic-only failure signal — the sheet stays open to retry.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppSheet
      visible={visible}
      onClose={onClose}
      title="Write a Review"
      subtitle={productTitle}
      footer={
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="flex h-12 w-full cursor-pointer items-center justify-center text-[15px] font-bold text-white"
          style={{
            backgroundColor: theme.primary,
            borderRadius: theme.radius ?? 10,
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            "Submit Review"
          )}
        </button>
      }
    >
      <div className="p-6">
          {/* Rating Stars Selector */}
          <div className="mb-6 flex flex-col items-center">
            <p className="mb-3 text-sm font-semibold" style={{ color: theme.text }}>
              Overall Rating
            </p>
            <div className="flex flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarPress(star)}
                  aria-label={`Rate ${star} stars`}
                  className="cursor-pointer p-1"
                >
                  {star <= rating ? (
                    <Star size={36} color="#F59E0B" fill="#F59E0B" />
                  ) : (
                    <Star size={36} color="#F59E0B" />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm font-bold" style={{ color: theme.primary }}>
              {RATING_LABELS[rating]}
            </p>
          </div>

          {/* Review Title Input */}
          <div className="mb-4.5">
            <label className="mb-2 block text-[13px] font-semibold" style={{ color: theme.secondaryText }}>
              Review Title (Optional)
            </label>
            <TextInput
              placeholder="e.g. Great fabric and perfect fit"
              placeholderTextColor={theme.tertiaryText}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
              containerStyle={{ marginBottom: 0 }}
              inputContainerStyle={{
                backgroundColor: theme.tertiaryBackground,
                borderRadius: theme.radius ?? 10,
                borderWidth: 1,
                paddingHorizontal: 14,
                height: 48,
              }}
              style={{ fontSize: 14, color: theme.text }}
            />
          </div>

          {/* Detailed Comment Input */}
          <div className="mb-4.5">
            <label className="mb-2 block text-[13px] font-semibold" style={{ color: theme.secondaryText }}>
              Your Experience *
            </label>
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
                borderRadius: theme.radius ?? 10,
                borderWidth: 1,
                paddingHorizontal: 14,
                paddingVertical: 12,
                minHeight: 110,
              }}
              style={{ fontSize: 14, color: theme.text, textAlignVertical: "top" }}
            />
            <p className="mt-1 text-right text-[11px]" style={{ color: theme.tertiaryText }}>
              {comment.length}/1000
            </p>
          </div>
      </div>
    </AppSheet>
  );
};
