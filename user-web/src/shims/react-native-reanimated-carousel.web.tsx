import React from 'react';
import { View, ScrollView } from './react-native.web';

export function Carousel<T = any>({ data = [], renderItem, width, height, style, ...props }: any): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ width: width || '100%', height: height || 'auto', ...style }}
      {...props}
    >
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {data.map((item: any, index: number) => (
          <div key={item?.id || item?.key || index} style={{ width: width || '100%', flexShrink: 0 }}>
            {renderItem ? renderItem({ item, index }) : null}
          </div>
        ))}
      </div>
    </ScrollView>
  );
}

export default Carousel;
