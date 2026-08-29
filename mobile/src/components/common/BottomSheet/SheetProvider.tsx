import React, { createContext, useContext, useMemo, useRef } from "react";
import { useTrueSheet } from "@lodev09/react-native-true-sheet";

/**
 * Global sheet manager — present any registered sheet by name from
 * anywhere in the tree (deep links, socket events, unrelated screens).
 *
 * Sheets are registered by giving them a `name` prop. The provider
 * itself doesn't render anything; it just exposes the imperative
 * `useTrueSheet` handle via context.
 *
 * @example
 *   // 1. Mount the provider once near the root
 *   <SheetProvider>
 *     <RootNavigator />
 *   </SheetProvider>
 *
 *   // 2. Register any sheet by name (e.g. in a top-level layout)
 *   <Sheet name="coupon">
 *     <CouponContent />
 *   </Sheet>
 *
 *   // 3. Present it from anywhere
 *   const { show } = useGlobalSheet();
 *   show("coupon");
 */

type GlobalSheet = ReturnType<typeof useTrueSheet>;

const SheetManagerContext = createContext<GlobalSheet | null>(null);

export const SheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const manager = useTrueSheet();
  // useTrueSheet already returns a stable object, but memoize to be safe
  // and to keep referential equality through re-renders.
  const value = useMemo(() => manager, [manager]);
  return (
    <SheetManagerContext.Provider value={value}>
      {children}
    </SheetManagerContext.Provider>
  );
};

/**
 * Returns the global sheet manager. Throws if used outside a <SheetProvider />.
 *
 * The returned object exposes `present(name)`, `dismiss(name)`,
 * `resize(name, index)`, `dismissStack(name)`, and `dismissAll()`.
 */
export function useGlobalSheet(): GlobalSheet {
  const ctx = useContext(SheetManagerContext);
  if (!ctx) {
    throw new Error(
      "useGlobalSheet must be used inside <SheetProvider>. " +
        "Wrap your app root with <SheetProvider>.",
    );
  }
  return ctx;
}
