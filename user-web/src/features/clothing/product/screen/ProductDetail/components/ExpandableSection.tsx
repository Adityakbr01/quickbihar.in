import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  theme: any;
  defaultOpen?: boolean;
}

export const ExpandableSection = ({
  title,
  children,
  theme,
  defaultOpen = false,
}: ExpandableSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer flex-row items-center justify-between py-4"
      >
        <span className="text-sm font-bold tracking-wide" style={{ color: theme.text }}>{title}</span>
        {open ? (
          <ChevronUp size={18} color={theme.secondaryText} />
        ) : (
          <ChevronDown size={18} color={theme.secondaryText} />
        )}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
};
