import React, { forwardRef } from 'react';
import { FlatList, FlatListProps } from './react-native.web';

export const FlashList = forwardRef<HTMLDivElement, FlatListProps & { estimatedItemSize?: number }>((props, ref) => {
  return <FlatList ref={ref} {...props} />;
});

FlashList.displayName = 'FlashList';

export default FlashList;
