import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { StyleProp, TextStyle } from "react-native";

export type AppIconName = ComponentProps<typeof Ionicons>["name"];

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Single icon system for the app — Expo recommended `@expo/vector-icons`
 * (font-based, no extra native weight).
 *
 * Replaces `@hugeicons/react-native` + `sweet-sfsymbols` (removed).
 * Pass any Ionicons name, e.g. `<AppIcon name="home-outline" size={22} />`.
 */
export function AppIcon({ name, size = 20, color, style }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

export default AppIcon;
