import React, { useEffect, useRef } from "react";
import {
  StyleProp,
  TextStyle,
  TextInput,
  Platform,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useAnimatedStyle,
  withSequence,
  withSpring,
  interpolate,
} from "react-native-reanimated";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/**
 * Smooth counter that tweens between numeric values and renders the result
 * with a currency prefix (or any custom prefix).
 *
 * Reanimated can't animate `Text` content directly, so we drive an
 * `editable={false}` `TextInput` via `useAnimatedProps` — the standard pattern
 * for animated numbers in RN.
 *
 * On every `value` change the shared value tweens with a `cubic-bezier` curve
 * (ease-out-expo-ish) so increases glide in and decreases glide out. A tiny
 * spring scale pulse on the wrapper gives a "thud" of weight without being
 * noisy.
 */
interface AnimatedPriceProps {
  value: number;
  /** Currency or label prefix. Defaults to ₹. Pass an empty string to disable. */
  prefix?: string;
  /** Total tween duration in ms. */
  duration?: number;
  /** Style for the price text (fontSize, color, weight, etc.). */
  style?: StyleProp<TextStyle>;
  /** Whether to render the value as an integer (default true). */
  integer?: boolean;
  /** Number of decimal digits when `integer` is false. */
  decimals?: number;
  /** When true, prepend a "-" to the rendered string. Useful for discounts. */
  showMinus?: boolean;
  /** If true, render "FREE" instead of a number when value is 0. */
  freeOnZero?: boolean;
  /** Custom free text when `freeOnZero` is true. */
  freeText?: string;
  /** Disable the scale pulse on value change. */
  noPulse?: boolean;
}

export const AnimatedPrice: React.FC<AnimatedPriceProps> = ({
  value,
  prefix = "₹",
  duration = 650,
  style,
  integer = true,
  decimals = 0,
  showMinus = false,
  freeOnZero = false,
  freeText = "FREE",
  noPulse = false,
}) => {
  const animated = useSharedValue(value);
  const pulse = useSharedValue(0);
  const previous = useRef(value);

  useEffect(() => {
    if (value === previous.current) return;
    animated.value = withTiming(value, {
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    if (!noPulse) {
      pulse.value = withSequence(
        withTiming(1, { duration: Math.min(220, duration / 3), easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 14, stiffness: 220, mass: 0.6 }),
      );
    }
    previous.current = value;
  }, [value, duration, noPulse, animated, pulse]);

  const animatedProps = useAnimatedProps(() => {
    if (freeOnZero && value === 0) {
      return {
        text: freeText,
        defaultValue: freeText,
      };
    }
    const current = integer
      ? Math.round(animated.value)
      : Number(animated.value.toFixed(decimals));
    const formatted = current.toLocaleString(undefined, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: integer ? 0 : decimals,
    });
    const sign = showMinus && value > 0 ? "-" : "";
    const out = `${sign}${prefix}${formatted}`;
    return {
      text: out,
      defaultValue: out,
    };
  });

  const wrapperStyle = useAnimatedStyle(() => {
    if (noPulse) return { transform: [{ scale: 1 }] };
    const scale = interpolate(pulse.value, [0, 1], [1, 1.06]);
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View style={wrapperStyle}>
      <AnimatedTextInput
        editable={false}
        // Disable every interaction; we only render text.
        selectTextOnFocus={false}
        contextMenuHidden
        caretHidden
        // Strip platform-specific decorations so this looks like a plain Text.
        underlineColorAndroid="transparent"
        // Keep layout identical to a Text element.
        style={[
          {
            padding: 0,
            margin: 0,
            ...(Platform.OS === "web" ? { outline: "none" } : {}),
          },
          style as any,
        ]}
        animatedProps={animatedProps}
        // RN TextInput defaults differ between platforms; this gives a
        // consistent typographic baseline with surrounding <Text> nodes.
        allowFontScaling
        // Avoid the iOS "Done" toolbar over the price.
        // eslint-disable-next-line react-native/no-inline-styles
      />
    </Animated.View>
  );
};

export default AnimatedPrice;
