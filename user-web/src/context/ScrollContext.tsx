import React, { createContext, useContext } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

interface ScrollContextType {
  headerTranslateY: SharedValue<number>;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const ScrollContext = createContext<ScrollContextType | null>(null);

export const ScrollProvider: React.FC<{ children: React.ReactNode; headerHeight: number }> = ({
  children,
  headerHeight
}) => {
  const headerTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    'worklet';
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.value;

    // Always show at the top
    if (currentY <= 10) {
      headerTranslateY.value = withTiming(0, { duration: 150 });
    } else if (diff > 10 && currentY > 100) {
      // Hide when scrolling down after some initial scroll
      if (headerTranslateY.value === 0) {
        headerTranslateY.value = withTiming(-headerHeight, { duration: 200 });
      }
    } else if (diff < -20) {
      // Show immediately on significant scroll up
      if (headerTranslateY.value === -headerHeight) {
        headerTranslateY.value = withTiming(0, { duration: 200 });
      }
    }

    lastScrollY.value = currentY;
  };

  return (
    <ScrollContext.Provider value={{ headerTranslateY, onScroll }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
};
