import React from "react";

interface GradientProps {
  colors?: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[] | null;
  style?: React.CSSProperties | Array<React.CSSProperties | false | null | undefined>;
  children?: React.ReactNode;
}

/**
 * Linear gradient box (pure CSS, no native modules).
 *
 * Same props as the old expo-linear-gradient usage so call sites
 * barely change: `start`/`end` are 0-1 points, `locations` are 0-1 stops.
 */
export function Gradient({
  colors = [],
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  locations,
  style,
  children,
}: GradientProps) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;

  const colorStops = colors
    .map((c, i) => {
      const loc = locations && locations[i] !== undefined ? `${locations[i] * 100}%` : "";
      return loc ? `${c} ${loc}` : c;
    })
    .join(", ");

  const flatStyle: React.CSSProperties = Object.assign(
    {},
    ...(Array.isArray(style) ? style : [style]).filter(Boolean)
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: colors.length > 0 ? `linear-gradient(${angle}deg, ${colorStops})` : undefined,
        ...flatStyle,
      }}
    >
      {children}
    </div>
  );
}

export default Gradient;
