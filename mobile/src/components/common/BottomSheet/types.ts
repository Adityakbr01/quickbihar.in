import type { ComponentType, ReactElement, ReactNode } from "react";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";
import type {
  BackgroundBlur,
  InsetAdjustment,
  ScrollableOptions,
  SheetDetent,
  TrueSheetMethods,
  TrueSheetProps,
} from "@lodev09/react-native-true-sheet";

/**
 * Imperative handle exposed by the global <Sheet /> component.
 * Wraps the underlying TrueSheet ref so consumers don't import the
 * library directly.
 */
export type SheetRef = TrueSheetMethods;

/**
 * Props for the global <Sheet /> component.
 *
 * This is a strict superset of the library props — we just re-export them
 * with project-relevant defaults so call sites only need to import from
 * `@/src/components/common/BottomSheet`.
 */
export interface SheetProps
  extends Omit<TrueSheetProps, "name" | "children" | "header" | "footer"> {
  /** Optional global name used by `useGlobalSheet().show(name, ...)`. */
  name?: string;

  /** Default `["auto", 1]` — auto-size to content, expandable to full. */
  detents?: SheetDetent[];

  /** Sheet content. */
  children?: ReactNode;

  /** Optional header slot — pass a <SheetHeader /> element. */
  header?: ComponentType<unknown> | ReactElement;

  /** Optional footer slot — pass a <SheetFooter /> element. */
  footer?: ComponentType<unknown> | ReactElement;
}

/* -------------------------------------------------------------------------- */
/*                                  Header                                    */
/* -------------------------------------------------------------------------- */

export interface SheetHeaderProps {
  title?: string;
  subtitle?: string;
  /** Rendered on the right side of the header (e.g. count badge). */
  right?: ReactNode;
  /** Called when the close button is pressed. */
  onClose?: () => void;
  /** Hide the default close button (e.g. when the right slot already has one). */
  hideCloseButton?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Override the theme tokens (e.g. a module palette) — defaults to the app theme. */
  themeOverride?: any;
}

/* -------------------------------------------------------------------------- */
/*                                  Footer                                    */
/* -------------------------------------------------------------------------- */

export interface SheetFooterProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/* -------------------------------------------------------------------------- */
/*                            Re-exported primitives                          */
/* -------------------------------------------------------------------------- */

export type {
  SheetDetent,
  BackgroundBlur,
  InsetAdjustment,
  ScrollableOptions,
  ColorValue,
};
