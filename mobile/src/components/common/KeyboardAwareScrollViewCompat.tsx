import React from "react";
import { ScrollView, ScrollViewProps } from "react-native";

/**
 * A ScrollView that defaults `keyboardShouldPersistTaps` to "handled".
 * Drop-in replacement for ScrollView in forms and list screens.
 *
 * ponytail: moved from Jewelery/components/ — belongs in common since it has
 * zero business logic.
 */
export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: ScrollViewProps) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
