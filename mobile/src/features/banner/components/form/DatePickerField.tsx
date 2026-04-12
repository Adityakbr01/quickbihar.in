import React, { useState, memo, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

interface DatePickerFieldProps {
    label: string;
    value: string;
    onChange: (date: string) => void;
    theme: any;
    styles: any;
    error?: string;
}

const DatePickerField = ({ label, value, onChange, theme, styles, error }: DatePickerFieldProps) => {
    const [show, setShow] = useState(false);
    
    // Parse existing date string or default to today
    const dateValue = value ? new Date(value) : new Date();

    const onDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
        // Close for Android immediately, iOS has different behavior for different modes
        if (Platform.OS === "android") {
            setShow(false);
        }
        
        if (selectedDate) {
            // Format to YYYY-MM-DD
            const formattedDate = selectedDate.toISOString().split("T")[0];
            onChange(formattedDate);
        }
    }, [onChange]);

    const displayDate = value || "Select Date";

    return (
        <View style={styles.flex1}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <TouchableOpacity
                style={[styles.input, { 
                    flexDirection: "row", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    borderColor: value ? theme.primary : theme.border
                }]}
                activeOpacity={0.7}
                onPress={() => setShow(true)}
            >
                <Text style={{ color: value ? theme.text : theme.tertiaryText, fontSize: 16 }}>
                    {displayDate}
                </Text>
                <HugeiconsIcon icon={Calendar01Icon} size={20} color={value ? theme.primary : theme.tertiaryText} />
            </TouchableOpacity>

            {error && (
                <Text style={{ color: "#FF3B30", fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                    {error}
                </Text>
            )}

            {show && (
                <DateTimePicker
                    value={dateValue}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={onDateChange}
                    textColor={theme.text}
                    accentColor={theme.primary}
                    style={{ backgroundColor: theme.background }}
                />
            )}
            
            {/* iOS specific: If using inline, we might need a way to close it if not handled by native UI */}
            {show && Platform.OS === "ios" && (
                <TouchableOpacity 
                    style={{ alignSelf: "flex-end", marginTop: 10 }} 
                    onPress={() => setShow(false)}
                >
                    <Text style={{ color: theme.primary, fontWeight: "700" }}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default memo(DatePickerField);
