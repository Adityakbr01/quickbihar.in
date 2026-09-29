import React from "react";
import { AppIcon } from "@/src/components/common/AppIcon";
import type { LucideIcon } from "lucide-react";
import { useTheme, type Theme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

interface ProfileInfoRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  theme?: Theme;
  styles?: any;
}

const ProfileInfoRow: React.FC<ProfileInfoRowProps> = ({
  icon,
  label,
  value,
  theme: themeProp,
}) => {
  const hookTheme = useTheme();
  const theme = (themeProp ?? hookTheme) as Theme;

  return (
    <div
      className={cn("flex flex-row items-center border-b py-[15px]")}
      style={{ borderBottomColor: `${theme.border}50` }}
    >
      <div
        className="mr-[15px] flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: theme.background }}
      >
        <AppIcon icon={icon} size={20} color={theme.primary} />
      </div>
      <div>
        <span
          className="mb-0.5 block text-xs"
          style={{ color: theme.tertiaryText }}
        >
          {label}
        </span>
        <span
          className="block text-base font-semibold"
          style={{ color: theme.text }}
        >
          {value || "Not provided"}
        </span>
      </div>
    </div>
  );
};

export default ProfileInfoRow;
