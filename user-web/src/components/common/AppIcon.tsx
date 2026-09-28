import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

interface AppIconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

/**
 * Single icon system for the app — lucide-react (tree-shakeable,
 * consistent 24px stroke style).
 *
 * Pass any lucide icon component, e.g. `<AppIcon icon={House} size={22} />`.
 */
export function AppIcon({ icon: Icon, size = 20, color, style }: AppIconProps) {
  return <Icon size={size} color={color} style={style} />;
}

export default AppIcon;
