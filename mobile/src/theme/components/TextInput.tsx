import React, { useState } from "react";
import {
  TextInput as RNTextInput,
  View,
  TextInputProps as RNTextInputProps,
  StyleSheet,
} from "react-native";
import { useTheme } from "../Provider/ThemeProvider";
import ThemedText from "./ThemedText";
import { spacing } from "../spacing";

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  variant?: "default" | "glass";
  containerStyle?: object;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ label, icon, rightIcon, error, variant = "default", containerStyle, ...props }, ref) => {
    const theme = useTheme() as any;
    const [isFocused, setIsFocused] = useState(false);

    const isGlass = variant === "glass";

    const styles = StyleSheet.create({
      container: {
        marginBottom: isGlass ? 0 : 16,
        gap: isGlass ? 6 : 0,
      },
      label: {
        fontSize: 16,
        fontWeight: "600",
        color: isGlass ? "rgba(255,255,255,0.9)" : theme.text,
        marginBottom: isGlass ? 0 : 8,
      },
      inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: isGlass ? 60 : undefined,
        paddingHorizontal: isGlass ? 16 : 12,
        paddingVertical: isGlass ? 0 : 4,
        borderRadius: isGlass ? 16 : spacing.xl,
        backgroundColor: isGlass ? "rgba(255, 255, 255, 0.08)" : theme.secondaryBackground,
        borderWidth: 1.5,
        borderColor: isGlass
          ? (error ? "#ef4444" : isFocused ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.15)")
          : (error ? theme.error : isFocused ? theme.primary : theme.border),
        gap: isGlass ? 12 : 10,
      },
      inputContainerFocused: {
        backgroundColor: isGlass ? "rgba(255, 255, 255, 0.12)" : theme.secondaryBackground,
      },
      inputContainerError: {
        backgroundColor: isGlass ? "rgba(239, 68, 68, 0.05)" : theme.secondaryBackground,
      },
      input: {
        flex: 1,
        height: isGlass ? "100%" : undefined,
        fontSize: 16,
        color: isGlass ? "#ffffff" : theme.text,
        fontWeight: "500",
      },
      errorText: {
        fontSize: isGlass ? 13 : 12,
        color: isGlass ? "#f87171" : theme.error,
        marginTop: isGlass ? 0 : 6,
        marginLeft: isGlass ? 4 : 0,
        fontWeight: "500",
      },
    });

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <ThemedText style={styles.label}>{label}</ThemedText>}
        <View 
          style={[
            styles.inputContainer, 
            isFocused && styles.inputContainerFocused,
            error ? styles.inputContainerError : null
          ]}
        >
          {icon && icon}
          <RNTextInput
            ref={ref}
            {...props}
            style={[styles.input, props.style]}
            placeholderTextColor={isGlass ? "rgba(255, 255, 255, 0.78)" : theme.secondaryText}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            accessibilityLabel={props.accessibilityLabel || label}
            accessibilityHint={props.accessibilityHint}
          />
          {rightIcon && rightIcon}
        </View>
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      </View>
    );
  },
);
TextInput.displayName = "TextInput";
