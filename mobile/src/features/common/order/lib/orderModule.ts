import type { CartModule } from "@/src/features/common/cart/store/cartStore";

function norm(value: unknown): string {
  return String(value || "").toLowerCase();
}

export function isJeweleryValue(value: unknown): boolean {
  const v = norm(value);
  return v === "jewelery" || v === "jewellery";
}

export function hasJeweleryDetails(obj: any): boolean {
  const jd = obj?.jeweleryDetails;
  if (!jd || typeof jd !== "object") return false;
  return Boolean(
    jd.metalType ||
      jd.purity ||
      jd.gemstone ||
      jd.weightGrams ||
      jd.stoneWeightCt ||
      jd.certNo ||
      jd.hallmark,
  );
}

export function isJeweleryProduct(prod: any): boolean {
  if (!prod || typeof prod !== "object") return false;
  if (isJeweleryValue(prod.vertical) || isJeweleryValue(prod.module)) return true;
  return hasJeweleryDetails(prod);
}

/**
 * Resolves an order line's owning catalog module. Checks the line itself,
 * then the populated product (vertical/module/jeweleryDetails). Anything
 * that isn't provably jewelery counts as clothing, so legacy orders keep
 * working without a data migration.
 */
export function resolveOrderItemModule(item: any): CartModule {
  const prod =
    item?.productId && typeof item.productId === "object"
      ? item.productId
      : null;
  const candidates = [
    item?.module,
    prod?.module,
    item?.vertical,
    prod?.vertical,
  ];
  if (candidates.some(isJeweleryValue)) return "jewelery";
  if (hasJeweleryDetails(item) || hasJeweleryDetails(prod)) return "jewelery";
  return "clothing";
}

/** Lines of one order (or sub-order) belonging to a single catalog. */
export function filterOrderItemsByModule(
  items: any[] | undefined | null,
  module: CartModule,
): any[] {
  return (items || []).filter((i) => resolveOrderItemModule(i) === module);
}

function allLinesOf(order: any): any[] {
  const top = Array.isArray(order?.items) ? order.items : [];
  const subs = Array.isArray(order?.subOrders)
    ? order.subOrders.flatMap((s: any) => (Array.isArray(s?.items) ? s.items : []))
    : [];
  return [...top, ...subs];
}

/**
 * Whether an order belongs in a catalog's list. An order with no
 * classifiable lines (legacy/empty) counts as clothing so it never
 * vanishes from the main order history.
 */
export function orderHasModule(order: any, module: CartModule): boolean {
  const lines = allLinesOf(order);
  if (lines.length === 0) return module === "clothing";
  return lines.some((i) => resolveOrderItemModule(i) === module);
}
