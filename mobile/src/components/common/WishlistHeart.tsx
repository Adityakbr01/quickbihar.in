import React from "react";
import { TouchableOpacity, Platform, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // 1. Trigger haptics
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // 2. Trigger animation
    scale.value = withSequence(
      withSpring(1.4, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 12, stiffness: 90 })
    );

    // 3. Trigger callback
    onToggle();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isWishlisted ? "heart" : "heart-outline"}
          size={size}
          color={isWishlisted ? activeColor : inactiveColor}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default WishlistHeart;
