import React from "react";

interface SpinnerProps {
  color: string;
  size?: number;
}

/**
 * Jewellery home loading indicator.
 * Extracted from JeweleryHomeScreen (was an inline `Spinner` function).
 * Preserves the exact markup, classes, inline styles, and ARIA attributes.
 */
export function Spinner({ color, size = 20 }: SpinnerProps) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderTopColor: "transparent",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
