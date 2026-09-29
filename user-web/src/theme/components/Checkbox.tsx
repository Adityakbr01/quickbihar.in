import React, { useState } from "react";
import { Pressable, StyleSheet, ViewStyle, View } from "@/components/primitives";
import { Square, SquareCheckBig } from "lucide-react";
import { useTheme } from "../Provider/ThemeProvider";
import ThemedText from "./ThemedText";


interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  style,
}) => {
  const theme = useTheme() as any;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
  };

  const handlePressOut = () => {
    setPressed(false);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 8,
    },
    iconContainer: {
      marginRight: 8,
    },
    label: {
      fontSize: 14,
      color: theme.text,
    },
  });

  return (
    <Pressable style={[styles.container, style]}
      onPress={() => onChange(!checked)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.iconContainer, { transform: [{ scale: pressed ? 0.9 : 1 }], transition: "transform 0.15s ease-out" }]}>
        {checked ? (
          <SquareCheckBig size={24} color={theme.primary} />
        ) : (
          <Square size={24} color={theme.secondaryText} />
        )}
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
};
