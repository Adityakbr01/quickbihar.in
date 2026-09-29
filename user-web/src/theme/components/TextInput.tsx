import React, { useState } from "react";
import { useTheme } from "../Provider/ThemeProvider";
import ThemedText from "./ThemedText";
import { spacing } from "../spacing";

export interface WebInputProps {
  style?: React.CSSProperties;
  value?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: any) => void;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  onSubmitEditing?: (e: any) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: string;
  returnKeyType?: string;
  autoCapitalize?: string;
  selectTextOnFocus?: boolean;
  blurOnSubmit?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  numberOfLines?: number;
  selectionColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onKeyPress?: (e: any) => void;
  [key: string]: any;
}

export interface TextInputProps extends WebInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  variant?: "default" | "glass";
  containerStyle?: React.CSSProperties;
  /** Extra style for the bordered input row (bg, radius, padding). */
  inputContainerStyle?: React.CSSProperties;
  /** Border color while focused. Defaults to theme.primary. */
  focusBorderColor?: string;
  /**
   * Bare mode for embedding inside a custom chrome (e.g. an animated
   * search container): skips the internal focus/error background wash so
   * only the outer container paints. Border logic still applies.
   */
  bare?: boolean;
}

function resolveType(secureTextEntry?: boolean, keyboardType?: string) {
  if (secureTextEntry) return "password";
  if (keyboardType === "email-address") return "email";
  if (keyboardType === "numeric" || keyboardType === "number-pad") return "number";
  if (keyboardType === "phone-pad") return "tel";
  return "text";
}

export const TextInput = React.forwardRef<any, TextInputProps>(
  (props: any, ref) => {
    const {
      label, icon, rightIcon, error, variant = "default",
      containerStyle, inputContainerStyle, focusBorderColor, bare = false,
      value, onChangeText, onChange, onFocus, onBlur, onSubmitEditing,
      placeholder, secureTextEntry, multiline, keyboardType, returnKeyType,
      autoCapitalize, editable = true, autoFocus, maxLength, numberOfLines,
      selectionColor, style, ...restProps
    } = props;
    const theme = useTheme() as any;
    // Strip RN-only props so they never leak onto the native element.
    const {
      placeholderTextColor: _ph,
      textAlignVertical: _tav,
      underlineColorAndroid: _uca,
      clearButtonMode: _cbm,
      blurOnSubmit: _bos,
      selectTextOnFocus: _stf,
      enablesReturnKeyAutomatically: _erka,
      cursorColor: _cc,
      selection: _sel,
      showSoftInputOnFocus: _ssif,
      disableFullscreenUI: _dfui,
      accessibilityLabel: _al,
      accessibilityHint: _ah,
      ...domProps
    } = restProps;
    void _ph; void _tav; void _uca; void _cbm; void _bos; void _stf;
    void _erka; void _cc; void _sel; void _ssif; void _dfui; void _ah;
    const [isFocused, setIsFocused] = useState(false);

    const isGlass = variant === "glass";
    const activeBorder = focusBorderColor ?? theme.primary;

    const borderColor = isGlass
      ? (error
          ? "#ef4444"
          : isFocused
            ? (theme.background === "#ffffff" ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.6)")
            : (theme.background === "#ffffff" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.15)"))
      : (error ? theme.error : isFocused ? activeBorder : theme.border);

    const wash: React.CSSProperties = bare
      ? {}
      : isFocused
        ? {
            backgroundColor: isGlass
              ? (theme.background === "#ffffff" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.12)")
              : theme.secondaryBackground,
          }
        : error
          ? {
              backgroundColor: isGlass
                ? (theme.background === "#ffffff" ? "rgba(239, 68, 68, 0.03)" : "rgba(239, 68, 68, 0.05)")
                : theme.secondaryBackground,
            }
          : {};

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChangeText?.(e.target.value);
      onChange?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !multiline && onSubmitEditing) onSubmitEditing(e);
      (domProps as any).onKeyDown?.(e);
    };

    const fieldStyle: React.CSSProperties = {
      flex: 1,
      width: "100%",
      backgroundColor: "transparent",
      border: "none",
      outline: "none",
      padding: 0,
      margin: 0,
      fontFamily: "inherit",
      fontSize: 16,
      color: theme.text,
      fontWeight: 500,
      caretColor: selectionColor,
      ...(multiline ? { minHeight: (numberOfLines ?? 4) * 22, resize: "vertical" as const } : null),
      ...style,
    };

    return (
      <div style={{ marginBottom: isGlass ? 0 : 16, ...containerStyle }}>
        {label && (
          <ThemedText
            className="font-semibold"
            style={{ fontSize: 16, color: theme.text, marginBottom: isGlass ? 0 : 8, display: "block" }}
          >
            {label}
          </ThemedText>
        )}
        <div
          className="flex flex-row items-center"
          style={{
            height: isGlass ? 60 : undefined,
            paddingLeft: isGlass ? 16 : 12,
            paddingRight: isGlass ? 16 : 12,
            paddingTop: isGlass ? 0 : 4,
            paddingBottom: isGlass ? 0 : 4,
            borderRadius: isGlass ? 16 : spacing.xl,
            backgroundColor: isGlass
              ? (theme.background === "#ffffff" ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.06)")
              : theme.secondaryBackground,
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor,
            gap: isGlass ? 12 : 10,
            ...wash,
            ...inputContainerStyle,
          }}
        >
          {icon && icon}
          {multiline ? (
            <textarea
              ref={ref}
              value={value ?? ""}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              autoFocus={autoFocus}
              autoCapitalize={autoCapitalize}
              disabled={!editable}
              aria-label={_al || label}
              style={fieldStyle}
              {...domProps}
            />
          ) : (
            <input
              ref={ref}
              type={resolveType(secureTextEntry, keyboardType)}
              value={value ?? ""}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              autoFocus={autoFocus}
              autoCapitalize={autoCapitalize}
              enterKeyHint={(returnKeyType as any) || undefined}
              disabled={!editable}
              aria-label={_al || label}
              style={fieldStyle}
              {...domProps}
            />
          )}
          {rightIcon && rightIcon}
        </div>
        {error ? (
          <ThemedText
            className="font-medium"
            style={{
              fontSize: isGlass ? 13 : 12,
              color: isGlass ? "#f87171" : theme.error,
              marginTop: isGlass ? 0 : 6,
              marginLeft: isGlass ? 4 : 0,
              display: "block",
            }}
          >
            {error}
          </ThemedText>
        ) : null}
      </div>
    );
  },
);
TextInput.displayName = "TextInput";
