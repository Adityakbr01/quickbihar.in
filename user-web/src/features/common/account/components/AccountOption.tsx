import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { AppIcon } from "@/src/components/common/AppIcon";
import { ChevronRight } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import React, { useState } from "react";


interface SubItem {
  label: string;
  icon: any;
  onPress: () => void;
}

interface AccountOptionProps {
  theme: Theme;
  styles?: any;
  icon: any;
  label: string;
  onPress?: () => void;
  showArrow?: boolean;
  isLast?: boolean;
  danger?: boolean;
  subItems?: SubItem[];
}

const AccountOption = ({
  theme,
  icon,
  label,
  onPress,
  showArrow = true,
  isLast = false,
  danger = false,
  subItems = [],
}: AccountOptionProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubItems = subItems.length > 0;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpanded(!expanded);
  };

  const handlePress = () => {
    if (hasSubItems) {
      toggleExpand();
    } else if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePress}
        className="flex w-full flex-row items-center px-6 py-3.5 text-left transition active:opacity-70"
        style={{ backgroundColor: (theme as any).background }}
      >
        <div
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: (theme as any).tertiaryBackground }}
        >
          <AppIcon
            icon={icon}
            size={22}
            color={danger ? "#FF3B30" : (theme as any).primary}
          />
        </div>

        <span
          className="ml-4 flex-1 text-base font-semibold"
          style={{ color: danger ? "#FF3B30" : (theme as any).text }}
        >
          {label}
        </span>

        {showArrow && (
          <span
            className="inline-flex transition-transform duration-300 ease-out"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <AppIcon
              icon={ChevronRight}
              size={20}
              color={(theme as any).tertiaryText}
              style={{ opacity: 0.3 }}
            />
          </span>
        )}
      </button>

      {hasSubItems && (
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            height: expanded ? subItems.length * 56 : 0,
            opacity: expanded ? 1 : 0,
            backgroundColor: (theme as any).tertiaryBackground,
          }}
        >
          {subItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <button
                type="button"
                onClick={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  item.onPress();
                }}
                className="flex w-full flex-row items-center py-3 pl-11 pr-6 text-left transition active:opacity-70"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: (theme as any).background }}
                >
                  <AppIcon
                    icon={item.icon}
                    size={18}
                    color={(theme as any).primary}
                  />
                </div>
                <span
                  className="ml-3 flex-1 text-sm font-medium"
                  style={{ color: (theme as any).secondaryText }}
                >
                  {item.label}
                </span>
              </button>
              {index !== subItems.length - 1 && (
                <div
                  className="h-px opacity-30"
                  style={{ backgroundColor: (theme as any).border, marginLeft: 88 }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {!isLast && !expanded && (
        <div
          className="h-px opacity-50"
          style={{ backgroundColor: (theme as any).border, marginLeft: 82 }}
        />
      )}
    </div>
  );
};

export default AccountOption;
