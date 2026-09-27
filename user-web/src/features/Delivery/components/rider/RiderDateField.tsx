import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { dateInputToDate, dateToInputValue } from "../../theme/riderTheme";
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

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setOpen(false);
      return;
    }
    if (selectedDate) {
      onChange(dateToInputValue(selectedDate));
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
        <Ionicons name="calendar-outline" size={18} color={theme.primary} />
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={dateInputToDate(value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}
    </View>
  );
}
