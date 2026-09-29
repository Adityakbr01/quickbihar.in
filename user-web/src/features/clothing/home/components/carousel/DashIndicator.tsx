import React from 'react';
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
    <div
      className="h-[3px] rounded-full transition-all duration-200"
      style={{
        width: isActive ? 16 : 8,
        backgroundColor: isActive ? theme.text : theme.tertiaryText,
      }}
    />
  );
};

export default DashIndicator;
