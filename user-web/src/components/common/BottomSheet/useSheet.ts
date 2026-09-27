import { useRef } from "react";
import type { SheetRef } from "./types";

/**
 * Convenience hook for the imperative <Sheet /> handle.
 *
 * Equivalent to `useRef<SheetRef>(null)` but co-located with the component
 * so call sites can `import { useSheet } from "@/src/components/common/BottomSheet"`.
 *
 * @example
 *   const sheet = useSheet();
 *   ...
 *   <Sheet ref={sheet} onDidDismiss={onClose} />
 *   ...
 *   sheet.current?.present();
 */
export function useSheet() {
  return useRef<SheetRef>(null);
}
