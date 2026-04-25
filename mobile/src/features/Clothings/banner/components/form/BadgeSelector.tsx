import React, { memo, useCallback } from "react";
import { FlatList, TouchableOpacity, Text, StyleSheet, View } from "react-native";

interface BadgeSelectorProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    theme: any;
    styles: any;
    formatLabel?: (label: string) => string;
    error?: string;
}

const BadgeSelector = ({ options, value, onChange, theme, styles, formatLabel, error }: BadgeSelectorProps) => {
    const renderItem = useCallback(({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.badge,
                {
                    backgroundColor: value === item ? theme.primary : theme.tertiaryBackground,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderWidth: value === item ? 0 : 1,
                    borderColor: theme.border
                }
            ]}
            onPress={() => onChange(item)}
            activeOpacity={0.7}
        >
            <Text style={[styles.badgeText, { color: value === item ? "#fff" : theme.text }]}>
                {formatLabel ? formatLabel(item) : item.toUpperCase()}
            </Text>
        </TouchableOpacity>
    ), [value, theme, styles, onChange, formatLabel]);

    return (
        <View>
            <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={localStyles.contentContainer}
                scrollEnabled={options.length > 2}
            />
            {error && (
                <Text style={{ color: "#FF3B30", fontSize: 12, marginTop: 8, marginLeft: 4 }}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const localStyles = StyleSheet.create({
    contentContainer: {
        gap: 8,
    }
});

export default memo(BadgeSelector);
