import React, { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { dateToInputValue } from "../../theme/riderTheme";
import type { RiderStyles } from "../../types/rider.types";

export function RiderDateField({
  styles,
  theme,
  label,
  value,
  onChange,
}: {
  styles: RiderStyles;
  theme: Theme;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  void styles;
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Native date picker opens as a popover; close our inline state on change.
  useEffect(() => {
    if (open) (inputRef.current as any)?.showPicker?.();
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.valueAsDate || (e.target.value ? new Date(e.target.value) : undefined);
    if (picked) {
      onChange(dateToInputValue(picked));
    }
    setOpen(false);
  };

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[52px] w-full cursor-pointer flex-row items-center gap-2.5 rounded-[14px] border px-3 py-2 text-left"
        style={{ backgroundColor: theme.background, borderColor: theme.border }}
      >
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 block text-[11px] font-extrabold" style={{ color: theme.secondaryText }}>
            {label}
          </span>
          <span className="block text-sm font-extrabold" style={{ color: theme.text }}>
            {value || "Select date"}
          </span>
        </span>
        <Calendar size={18} color={theme.primary} />
      </button>
      {open && (
        <input
          ref={inputRef}
          type="date"
          aria-label="Select delivery date"
          value={value || ""}
          onChange={handleChange}
          className="mt-2 w-full rounded-[14px] border px-3 py-2 text-sm"
          style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.text }}
        />
      )}
    </div>
  );
}
