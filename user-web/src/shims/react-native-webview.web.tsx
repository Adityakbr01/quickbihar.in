import React, { forwardRef } from 'react';
import { processStyle } from './react-native.web';

export type WebView = any;

export const WebView = forwardRef<HTMLIFrameElement, any>(({ source, style, ...props }, ref) => {
  const uri = typeof source === 'object' ? source?.uri || '' : source || '';

  return (
    <iframe
      ref={ref}
      src={uri}
      style={{ border: 'none', width: '100%', height: '100%', ...processStyle(style) }}
      {...props}
    />
  );
});

WebView.displayName = 'WebView';

export default WebView;
