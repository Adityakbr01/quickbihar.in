import React, { forwardRef } from 'react';
import { processStyle } from './react-native.web';

export const BlurView = forwardRef<HTMLDivElement, any>(({ intensity = 50, tint = 'default', style, children, ...props }, ref) => {
  const blurAmount = Math.max(1, Math.round((intensity / 100) * 20));
  const blurStyle: React.CSSProperties = {
    backdropFilter: `blur(${blurAmount}px)`,
    WebkitBackdropFilter: `blur(${blurAmount}px)`,
    backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.4)' : tint === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
    ...processStyle(style),
  };

  return (
    <div ref={ref} style={blurStyle} {...props}>
      {children}
    </div>
  );
});

BlurView.displayName = 'BlurView';

export default BlurView;
