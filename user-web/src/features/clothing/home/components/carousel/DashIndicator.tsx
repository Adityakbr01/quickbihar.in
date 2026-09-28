import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/Provider/ThemeProvider';

interface DashIndicatorProps {
  index: number;
  progress: number;
  dataLength: number;
}

const DashIndicator = ({ index, progress, dataLength }: DashIndicatorProps) => {
  const theme = useTheme();
  const diff = Math.abs(progress - index);
  const isActive = diff < 0.5 || diff > dataLength - 0.5;

  return (
    <View
      style={{
        width: isActive ? 16 : 8,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: isActive ? theme.text : theme.tertiaryText,
        transition: 'width 0.25s ease-out, background-color 0.25s ease-out',
      }}
    />
  );
};

export default DashIndicator;
