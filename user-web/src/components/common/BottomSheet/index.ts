/**
 * Global bottom sheet component used across the QuickBihar mobile app.
 *
 * @example
 *   import { Sheet, SheetHeader, SheetFooter, useSheet } from
 *     "@/src/components/common/BottomSheet";
 *
 *   const ref = useSheet();
 *
 *   <Sheet ref={ref} onDidDismiss={onClose}>
 *     <SheetHeader title="Filters" onClose={() => ref.current?.dismiss()} />
 *     <View>...</View>
 *     <SheetFooter>
 *       <Button title="Apply" onPress={apply} />
 *     </SheetFooter>
 *   </Sheet>
 */
export { Sheet } from "./Sheet";
export { SheetHeader } from "./SheetHeader";
export { SheetFooter } from "./SheetFooter";
export { useSheet } from "./useSheet";
export { SheetProvider, useGlobalSheet } from "./SheetProvider";

export type {
  SheetRef,
  SheetProps,
  SheetHeaderProps,
  SheetFooterProps,
  SheetDetent,
} from "./types";
