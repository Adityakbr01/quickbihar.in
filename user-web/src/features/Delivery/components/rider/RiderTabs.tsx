import React from "react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { riderTabs } from "../../theme/riderTheme";
import type { RiderStyles, RiderTab } from "../../types/rider.types";

export function RiderTabs({
  styles,
  theme,
  activeTab,
  onTabChange,
}: {
  styles: RiderStyles;
  theme: Theme;
  activeTab: RiderTab;
  onTabChange: (tab: RiderTab) => void;
}) {
  void styles;
  return (
    <div className="mb-2.5 flex flex-row gap-2 overflow-x-auto pr-[18px]">
      {riderTabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="flex min-h-[40px] shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-[14px] border px-3 py-2"
            style={{
              backgroundColor: selected ? theme.primary : theme.secondaryBackground,
              borderColor: selected ? theme.primary : theme.border,
            }}
          >
            <tab.icon size={16} color={selected ? "#fff" : theme.secondaryText} />
            <span
              className="text-xs font-extrabold"
              style={{ color: selected ? "#fff" : theme.secondaryText }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
