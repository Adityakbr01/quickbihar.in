import React, { forwardRef } from 'react';
import { Image as RNImage } from './react-native.web';

// expo-image `contentFit` -> CSS `object-fit`. The RN Image shim only maps
// `resizeMode`, so every `contentFit="cover"` photo on web silently lost
// its cover fit and never filled its frame (e.g. Top Selling cards).
const CONTENT_FIT_MAP: Record<string, React.CSSProperties['objectFit']> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'fill',
  none: 'none',
  'scale-down': 'scale-down',
};

export const Image = forwardRef<HTMLImageElement, any>((props, ref) => {
  const {
    contentFit,
    resizeMode,
    transition: _transition,
    priority: _priority,
    placeholder: _placeholder,
    cachePolicy: _cachePolicy,
    style,
    ...rest
  } = props;
  const objectFit =
    CONTENT_FIT_MAP[contentFit] ??
    (resizeMode === 'stretch' ? 'fill' : resizeMode === 'center' ? 'none' : resizeMode);
  return (
    <RNImage
      ref={ref}
      {...rest}
      resizeMode={undefined}
      style={[style, objectFit ? { objectFit } : null]}
    />
  );
});

Image.displayName = 'Image';

export default Image;
