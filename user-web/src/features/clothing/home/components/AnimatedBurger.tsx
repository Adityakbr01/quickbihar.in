import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface AnimatedBurgerProps {
  isOpen: boolean;
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
  const shift = gap + barHeight;

  const barTransition = "transform 0.3s ease-out, opacity 0.2s ease-out";

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { width: size + 12, height: size + 12 }]}
      hitSlop={10}
    >
      <View
        style={[
          styles.bar,
          { width: size, height: barHeight, backgroundColor: color },
          {
            transform: [
              { translateY: isOpen ? shift : 0 },
              { rotateZ: isOpen ? "45deg" : "0deg" },
            ],
            transition: barTransition,
          },
        ]}
      />
      <View
        style={[
          styles.bar,
          {
            width: size,
            height: barHeight,
            backgroundColor: color,
            marginVertical: gap,
          },
          {
            opacity: isOpen ? 0 : 1,
            transform: [{ scaleX: isOpen ? 0 : 1 }],
            transition: barTransition,
          },
        ]}
      />
      <View
        style={[
          styles.bar,
          { width: size, height: barHeight, backgroundColor: color },
          {
            transform: [
              { translateY: isOpen ? -shift : 0 },
              { rotateZ: isOpen ? "-45deg" : "0deg" },
            ],
            transition: barTransition,
          },
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
