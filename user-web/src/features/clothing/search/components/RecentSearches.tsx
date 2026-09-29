import { Clock, X } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface RecentSearchesProps {
  history: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}

const RecentSearches = ({
  history,
  onSelect,
  onRemove,
  onClearAll,
}: RecentSearchesProps) => {
  const theme = useTheme();

  if (history.length === 0) return null;

  return (
    <div className="pt-4">
      <div className="mb-3 flex flex-row items-center justify-between px-5">
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Recent Searches</h2>
        <button type="button" onClick={onClearAll} className="cursor-pointer text-sm font-medium" style={{ color: theme.primary }}>
          Clear all
        </button>
      </div>

      <ul>
        {history.map((item) => (
          <li key={item}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                Haptics.selectionAsync();
                onSelect(item);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  Haptics.selectionAsync();
                  onSelect(item);
                }
              }}
              className="flex cursor-pointer flex-row items-center justify-between px-5 py-3"
            >
              <span className="flex flex-row items-center">
                <Clock size={20} color={theme.tertiaryText} />
                <span className="ml-3 text-base" style={{ color: theme.text }}>{item}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onRemove(item);
                }}
                className="cursor-pointer p-1"
              >
                <X size={18} color={theme.tertiaryText} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentSearches;
