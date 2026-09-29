import React from "react";

export interface WebScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: React.CSSProperties;
  contentContainerStyle?: React.CSSProperties;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: string;
  [key: string]: any;
}

/**
 * A scroll div that defaults `keyboardShouldPersistTaps` to "handled".
 * Drop-in replacement for ScrollView in forms and list screens.
 *
 * ponytail: moved from Jewelery/components/ — belongs in common since it has
 * zero business logic.
 */
export function KeyboardAwareScrollViewCompat({
  children,
  style,
  contentContainerStyle,
  horizontal,
  keyboardShouldPersistTaps = "handled",
  // Native-only props — accepted for API compat, never rendered to DOM.
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  nestedScrollEnabled,
  scrollEventThrottle,
  refreshControl,
  snapToInterval,
  snapToAlignment,
  decelerationRate,
  contentOffset,
  bounces,
  scrollEnabled,
  pagingEnabled,
  stickyHeaderIndices,
  ...props
}: WebScrollProps) {
  void keyboardShouldPersistTaps;
  void showsHorizontalScrollIndicator;
  void showsVerticalScrollIndicator;
  void nestedScrollEnabled;
  void scrollEventThrottle;
  void refreshControl;
  void snapToInterval;
  void snapToAlignment;
  void decelerationRate;
  void contentOffset;
  void bounces;
  void scrollEnabled;
  void pagingEnabled;
  void stickyHeaderIndices;
  return (
    <div
      className={horizontal ? "flex flex-row overflow-x-auto" : "flex flex-col overflow-y-auto"}
      style={{ scrollbarWidth: "none", ...style }}
      {...props}
    >
      <div
        className={horizontal ? "flex flex-row" : "flex flex-col"}
        style={contentContainerStyle}
      >
        {children}
      </div>
    </div>
  );
}
