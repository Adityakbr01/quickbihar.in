import React from "react";
import {
  StyleProp,
  TextStyle,
  Text,
} from "@/components/primitives";

/**
 * Price text with a currency prefix (or any custom prefix).
 *
 * Web build renders the formatted value directly (no tween) — numbers
 * update instantly on value change.
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
  style,
  integer = true,
  decimals = 0,
  showMinus = false,
  freeOnZero = false,
  freeText = "FREE",
}) => {
  if (freeOnZero && value === 0) {
    return <Text style={style}>{freeText}</Text>;
  }
  const current = integer
    ? Math.round(value)
    : Number(value.toFixed(decimals));
  const formatted = current.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: integer ? 0 : decimals,
  });
  const sign = showMinus && value > 0 ? "-" : "";
  return <Text style={style}>{`${sign}${prefix}${formatted}`}</Text>;
};

export default AnimatedPrice;
