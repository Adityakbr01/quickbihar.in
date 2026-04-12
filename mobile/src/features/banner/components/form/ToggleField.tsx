import React, { memo } from "react";
import { TouchableOpacity, Text, Switch } from "react-native";

interface ToggleFieldProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    theme: any;
    styles: any;
}

const ToggleField = ({ label, value, onChange, theme, styles }: ToggleFieldProps) => {
    return (
        <TouchableOpacity
            style={styles.toggleRow}
            activeOpacity={0.7}
            onPress={() => onChange(!value)}
        >
            <Text style={styles.toggleLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: theme.border, true: "#34C759" }}
                ios_backgroundColor={theme.border}
            />
        </TouchableOpacity>
    );
};

export default memo(ToggleField);
