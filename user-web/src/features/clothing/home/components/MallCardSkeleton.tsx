import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export const MallCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <div
      className="h-[200px] w-full animate-pulse overflow-hidden rounded-[20px]"
      style={{ borderColor: theme.border, backgroundColor: theme.border }}
    />
  );
};
