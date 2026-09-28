import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useEffect, useRef } from "react";
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
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Native date picker opens as a popover; close our inline state on change.
  useEffect(() => {
    if (open) inputRef.current?.showPicker?.();
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.valueAsDate || (e.target.value ? new Date(e.target.value) : undefined);
    if (picked) {
      onChange(dateToInputValue(picked));
    }
    setOpen(false);
  };

  return (
    <View style={styles.dateFieldWrap}>
      <TouchableOpacity style={styles.dateField} onPress={() => setOpen(true)} activeOpacity={0.82}>
        <View style={styles.flexOne}>
          <Text style={styles.dateFieldLabel}>{label}</Text>
          <Text style={styles.dateFieldValue}>{value || "Select date"}</Text>
        </View>
        <Calendar size={18} color={theme.primary} />
      </TouchableOpacity>
      {open && (
        <input ref={inputRef}
          type="date"
          value={value || ""}
          onChange={handleChange}
        />
      )}
    </View>
  );
}
