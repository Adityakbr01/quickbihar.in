import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Switch } from "@/src/components/ui/switch";

// iOS switch metrics — identical to the native ThemeToggle
// (51x31 track, 27px knob, 2px pad => 20px travel).
// iOS metrics: 51x31 track, 27px knob, 2px pad => 20px travel
// (travel is applied via the thumb's translate-x class below).

interface ThemeToggleProps {
  value: boolean;
  onToggle: () => void;
}

/**
 * Web-only toggle: shadcn/Radix Switch styled to the exact iOS look
 * (green ON, theme well OFF). The shared RN/Reanimated toggle can't
 * animate on web — shared values never trigger a re-render there, so
 * its knob froze while the theme still flipped underneath.
 * Mobile keeps ThemeToggle.tsx untouched.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  value,
  onToggle,
}) => {
  const theme = useTheme() as any;

  return (
    <Switch
      checked={value}
      onCheckedChange={() => onToggle()}
      aria-label="Toggle dark mode"
      className="h-[31px] w-[51px] rounded-full p-[2px]"
      style={{
        backgroundColor: value
          ? "#34C759"
          : theme.isDark
            ? "#3A3A3C"
            : "#E9E9EA",
      }}
      thumbClassName="h-[27px] w-[27px] rounded-full bg-white shadow data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-0"
    />
  );
};
