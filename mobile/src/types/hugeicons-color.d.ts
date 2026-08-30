// Type augmentation: react-native-svg 15.15+ removed `color` from the
// public SvgProps surface, but @hugeicons/react-native still reads it at
// runtime. Re-add it here so the existing `color={...}` call sites in
// the app keep type-checking without changing the runtime pattern.
import "react-native";
import type { ColorValue } from "react-native";

declare module "@hugeicons/react-native" {
  export interface HugeiconsProps {
    color?: ColorValue;
  }
}

export {};
