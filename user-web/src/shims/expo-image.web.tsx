import React, { forwardRef } from 'react';
import { Image as RNImage } from './react-native.web';

export const Image = forwardRef<HTMLImageElement, any>((props, ref) => {
  return <RNImage ref={ref} {...props} />;
});

Image.displayName = 'Image';

export default Image;
