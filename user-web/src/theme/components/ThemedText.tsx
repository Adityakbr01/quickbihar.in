// components/ThemedText.tsx
import React from "react";
import { useTheme } from "../Provider/ThemeProvider";

export interface ThemedTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  style?: React.CSSProperties;
}

export default function ThemedText({ style, ...props }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <span
      {...props}
      style={{ color: theme.text, ...style }} // override allow karega
    />
  );
}
