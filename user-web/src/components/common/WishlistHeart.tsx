import React, { useState } from "react";
import { TouchableOpacity, Platform, View, ViewStyle } from "react-native";
import { Heart } from "lucide-react";
import * as Haptics from "@/lib/haptics";

interface WishlistHeartProps {
  isWishlisted: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: ViewStyle | ViewStyle[];
}

const WishlistHeart: React.FC<WishlistHeartProps> = ({
  isWishlisted,
  onToggle,
  size = 16,
  activeColor = "#ef4444",
  inactiveColor = "#020617",
  style,
}) => {
  const [popping, setPopping] = useState(false);

  const handlePress = () => {
    // 1. Trigger haptics
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // 2. Pop animation (CSS transition replaces the reanimated spring)
    setPopping(true);
    setTimeout(() => setPopping(false), 220);

    // 3. Trigger callback
    onToggle();
  };

  return (
    <TouchableOpacity activeOpacity={0.7}
      onPress={handlePress}
      style={style}
    >
      <View style={{ transform: [{ scale: popping ? 1.4 : 1 }], transition: "transform 0.2s ease-out" }}>
        <Heart
          size={size}
          color={isWishlisted ? activeColor : inactiveColor}
          fill={isWishlisted ? activeColor : "none"}
        />
      </View>
    </TouchableOpacity>
  );
};

export default WishlistHeart;
