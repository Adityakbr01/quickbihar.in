import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";
import { TrueSheet, type TrueSheetMethods } from "@lodev09/react-native-true-sheet";
import type { SheetProps, SheetRef } from "./types";

/** 2rem in px (RN default). Applied as top padding to all sheet content. */
const SHEET_TOP_PADDING = 32;

/**
 * Default detents: content-sized with the option to expand to full screen.
 * Matches the existing 85%-of-screen ceiling across the app (auto ≤ 1).
 */
const DEFAULT_DETENTS = ["auto", 1] as const;

/**
 * Global bottom sheet used across the QuickBihar mobile app.
 *
 * This is the one component every bottom-sheet-shaped surface in the app
 * renders. It wraps the native `@lodev09/react-native-true-sheet` and
 * applies project defaults (corner radius, detents, dimmed backdrop,
 * native grabber, dismissible, automatic safe-area insets).
 *
 * Use imperatively via a ref or globally via `useGlobalSheet().show(name)`.
 *
 * @example
 *   const sheet = useRef<SheetRef>(null);
 *   <Sheet ref={sheet} onDidDismiss={onClose}>
 *     <SheetHeader title="Filters" onClose={() => sheet.current?.dismiss()} />
 *     <View>...</View>
 *     <SheetFooter>...</SheetFooter>
 *   </Sheet>
 */
export const Sheet = forwardRef<SheetRef, SheetProps>(function Sheet(
  {
    detents = [...DEFAULT_DETENTS],
    cornerRadius = 24,
    dimmed = true,
    dismissible = true,
    draggable = true,
    grabber = true,
    insetAdjustment = "automatic",
    children,
    ...rest
  },
  ref,
) {
  const tsRef = useRef<TrueSheetMethods>(null);

  useImperativeHandle(
    ref,
    () => ({
      present: (index, animated) =>
        tsRef.current?.present(index, animated) ?? Promise.resolve(),
      dismiss: (animated) =>
        tsRef.current?.dismiss(animated) ?? Promise.resolve(),
      resize: (index) => tsRef.current?.resize(index) ?? Promise.resolve(),
      dismissStack: (animated) =>
        tsRef.current?.dismissStack(animated) ?? Promise.resolve(),
    }),
    [],
  );

  // Memoize defaults so a fresh array isn't passed every render
  // (TrueSheet's PureComponent would otherwise see a new prop every time).
  const memoDetents = useMemo(() => detents, [detents]);

  return (
    <TrueSheet
      ref={tsRef}
      detents={memoDetents}
      cornerRadius={cornerRadius}
      dimmed={dimmed}
      dismissible={dismissible}
      draggable={draggable}
      grabber={grabber}
      insetAdjustment={insetAdjustment}
      {...rest}
    >
      <View style={{ paddingTop: SHEET_TOP_PADDING }}>{children}</View>
    </TrueSheet>
  );
});
