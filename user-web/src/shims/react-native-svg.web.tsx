import React, { forwardRef } from 'react';
import { processStyle } from './react-native.web';

export const Svg = forwardRef<SVGSVGElement, any>(({ style, children, width, height, viewBox, fill = 'none', ...props }, ref) => (
  <svg
    ref={ref}
    width={width}
    height={height}
    viewBox={viewBox}
    fill={fill}
    style={processStyle(style)}
    {...props}
  >
    {children}
  </svg>
));
Svg.displayName = 'Svg';

export const Path: React.FC<any> = (props) => <path {...props} />;
export const Circle: React.FC<any> = (props) => <circle {...props} />;
export const Rect: React.FC<any> = (props) => <rect {...props} />;
export const G: React.FC<any> = (props) => <g {...props} />;
export const Line: React.FC<any> = (props) => <line {...props} />;
export const Polygon: React.FC<any> = (props) => <polygon {...props} />;
export const Polyline: React.FC<any> = (props) => <polyline {...props} />;
export const Text: React.FC<any> = (props) => <text {...props} />;
export const TSpan: React.FC<any> = (props) => <tspan {...props} />;
export const Defs: React.FC<any> = (props) => <defs {...props} />;
export const LinearGradient: React.FC<any> = (props) => <linearGradient {...props} />;
export const RadialGradient: React.FC<any> = (props) => <radialGradient {...props} />;
export const Stop: React.FC<any> = (props) => <stop {...props} />;
export const ClipPath: React.FC<any> = (props) => <clipPath {...props} />;
export const Mask: React.FC<any> = (props) => <mask {...props} />;
export const Image: React.FC<any> = (props) => <image {...props} />;
export const Use: React.FC<any> = (props) => <use {...props} />;

export default Svg;
