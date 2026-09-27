import React, { forwardRef } from 'react';
import { processStyle } from './react-native.web';

export const LinearGradient = forwardRef<HTMLDivElement, any>(({
  colors = [],
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  locations,
  style,
  children,
  onClick,
  onPress,
  ...props
}, ref) => {
  // Calculate CSS angle from start/end points
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;

  const colorStops = colors.map((c: string, index: number) => {
    const loc = locations && locations[index] !== undefined ? `${locations[index] * 100}%` : '';
    return loc ? `${c} ${loc}` : c;
  }).join(', ');

  const gradientStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    background: colors.length > 0 ? `linear-gradient(${angle}deg, ${colorStops})` : undefined,
    ...processStyle(style),
  };

  return (
    <div
      ref={ref}
      style={gradientStyle}
      onClick={onPress || onClick}
      {...props}
    >
      {children}
    </div>
  );
});

LinearGradient.displayName = 'LinearGradient';

export default LinearGradient;
