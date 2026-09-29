import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import * as Haptics from "@/lib/haptics";

interface WishlistHeartProps {
  isWishlisted: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: React.CSSProperties | React.CSSProperties[];
}

const flatten = (s: React.CSSProperties | React.CSSProperties[] | undefined): React.CSSProperties =>
  Array.isArray(s) ? Object.assign({}, ...s) : (s ?? {});

const WishlistHeart: React.FC<WishlistHeartProps> = ({
  isWishlisted,
  onToggle,
  size = 16,
  activeColor = "#ef4444",
  inactiveColor = "#020617",
  style,
}) => {
  const [popping, setPopping] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handlePress = (e?: { stopPropagation?: () => void }) => {
    // Don't bubble to parent pressables (e.g. product card → detail page).
    e?.stopPropagation?.();

    // Wishlist needs an account — guests go to login first.
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    // 1. Trigger haptics
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // 2. Pop animation (CSS transition replaces the reanimated spring)
    setPopping(true);
    setTimeout(() => setPopping(false), 220);

    // 3. Trigger callback
    onToggle();
  };

  return (
    <div
      onClick={handlePress}
      className="cursor-pointer"
      style={flatten(style)}
    >
      <div
        style={{ transform: popping ? "scale(1.4)" : undefined, transition: "transform 0.2s ease-out" }}
      >
        <Heart
          size={size}
          color={isWishlisted ? activeColor : inactiveColor}
          fill={isWishlisted ? activeColor : "none"}
        />
      </div>
    </div>
  );
};

export default WishlistHeart;
