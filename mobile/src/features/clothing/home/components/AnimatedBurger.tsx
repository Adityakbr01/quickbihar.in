import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  SharedValue,
} from "react-native-reanimated";

interface AnimatedBurgerProps {
  isOpen: SharedValue<number>;
  onPress: () => void;
  color?: string;
  size?: number;
}

const AnimatedBurger: React.FC<AnimatedBurgerProps> = ({
  isOpen,
  onPress,
  color = "#ffffff",
  size = 22,
}) => {
  const barHeight = 1.8;
  const gap = size * 0.26;

  const topBarStyle = useAnimatedStyle(() => {
    const rotate = interpolate(isOpen.value, [0, 1], [0, 45]);
    const translateY = interpolate(isOpen.value, [0, 1], [0, gap + barHeight]);
    return {
      transform: [
        { translateY: withTiming(translateY, { duration: 300 }) },
        { rotateZ: withTiming(`${rotate}deg`, { duration: 300 }) },
      ],
    };
  });

  const middleBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(isOpen.value, [0, 0.5, 1], [1, 0, 0]);
    const scaleX = interpolate(isOpen.value, [0, 1], [1, 0]);
    return {
      opacity: withTiming(opacity, { duration: 200 }),
      transform: [{ scaleX: withTiming(scaleX, { duration: 300 }) }],
    };
  });

  const bottomBarStyle = useAnimatedStyle(() => {
    const rotate = interpolate(isOpen.value, [0, 1], [0, -45]);
    const translateY = interpolate(
      isOpen.value,
      [0, 1],
      [0, -(gap + barHeight)]
    );
    return {
      transform: [
        { translateY: withTiming(translateY, { duration: 300 }) },
        { rotateZ: withTiming(`${rotate}deg`, { duration: 300 }) },
      ],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { width: size + 12, height: size + 12 }]}
      hitSlop={10}
    >
      <Animated.View
        style={[
          styles.bar,
          { width: size, height: barHeight, backgroundColor: color },
          topBarStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          {
            width: size,
            height: barHeight,
            backgroundColor: color,
            marginVertical: gap,
          },
          middleBarStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          { width: size, height: barHeight, backgroundColor: color },
          bottomBarStyle,
        ]}
      />
    </Pressable>
  );
};

export default AnimatedBurger;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  bar: {
    borderRadius: 2,
  },
});
