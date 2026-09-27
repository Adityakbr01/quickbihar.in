import React from 'react';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/Provider/ThemeProvider';

interface DashIndicatorProps {
  index: number;
  progressValue: SharedValue<number>;
  dataLength: number;
}

const DashIndicator = ({ index, progressValue, dataLength }: DashIndicatorProps) => {
  const theme = useTheme();
  const dashStyle = useAnimatedStyle(() => {
    const diff = Math.abs(progressValue.value - index);
    const isActive = diff < 0.5 || diff > dataLength - 0.5;

    return {
      width: isActive ? 16 : 8,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: isActive
        ? theme.text
        : theme.tertiaryText,
    };
  });

  return <Animated.View style={dashStyle} />;
};

export default DashIndicator;
