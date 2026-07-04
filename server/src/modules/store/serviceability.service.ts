/**
 * Store serviceability.
 *
 * Single source of truth for "can this store deliver to this address?" — shared by
 * hyperlocal product discovery (show only stores that can reach the user) and by
 * order placement (hard-block checkout for unreachable stores). A store serves a
 * target when EITHER the target pincode is listed in its `deliveryConfig.deliveryAreas`
 * OR the target GPS falls within `deliveryRadiusKm` of the store's location.
 */

import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { coordinatesFromGeoJson, distanceKmBetween, finiteLocation } from "../../utils/geo.util";
import { Store } from "./store.model";

/** Base filter for stores eligible to appear on the storefront and accept orders. */
export const ACTIVE_STOREFRONT_FILTER = {
    isOpen: true,
    isActive: true,
    isSetupComplete: true,
} as const;

/** The delivery destination being checked (pincode and/or GPS coordinates). */
export interface ServiceabilityTarget {
    pincode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

/** Minimal structural shape of a store needed to evaluate serviceability (works with lean docs). */
export interface StoreServiceabilityInput {
    _id?: unknown;
    name?: string;
    deliveryConfig?: { deliveryAreas?: string[] | null } | null;
    deliveryRadiusKm?: number | null;
    currentLocation?: { coordinates?: number[] | null } | null;
}

export type ServiceabilityMatch = "PINCODE" | "RADIUS";

export interface ServiceabilityResult {
    serviceable: boolean;
    /** How the store matched, or null when it cannot deliver to the target. */
    matchedBy: ServiceabilityMatch | null;
    /** Distance to the store in km when computable (GPS on both sides), else null. */
    distanceKm: number | null;
}

/**
 * Evaluates whether a single store can deliver to the given target.
 *
 * @param store - Store fields (pincode areas, radius, GeoJSON location).
 * @param target - Destination pincode and/or GPS coordinates.
 */
export function checkStoreServiceability(
    store: StoreServiceabilityInput,
    target: ServiceabilityTarget,
): ServiceabilityResult {
    const pincode = target.pincode != null ? String(target.pincode).trim() : "";
    const areas = (store.deliveryConfig?.deliveryAreas ?? []).map((a) => String(a).trim()).filter(Boolean);
    const pinMatch = pincode.length > 0 && areas.includes(pincode);

    const storePoint = coordinatesFromGeoJson(store.currentLocation ?? null);
    // Guard against explicit null (Number(null) === 0 would otherwise look like the equator).
    const targetPoint = target.latitude != null && target.longitude != null
        ? finiteLocation({ latitude: target.latitude, longitude: target.longitude })
        : null;
    const radiusKm = Number(store.deliveryRadiusKm);

    let distanceKm: number | null = null;
    let radiusMatch = false;
    if (storePoint && targetPoint && Number.isFinite(radiusKm) && radiusKm > 0) {
        distanceKm = distanceKmBetween(storePoint, targetPoint);
        radiusMatch = distanceKm !== null && distanceKm <= radiusKm;
    }

    if (pinMatch) return { serviceable: true, matchedBy: "PINCODE", distanceKm };
    if (radiusMatch) return { serviceable: true, matchedBy: "RADIUS", distanceKm };
    return { serviceable: false, matchedBy: null, distanceKm };
}

/**
 * Asserts a store can deliver to the target, throwing a 400 {@link ApiError} otherwise.
 * Used as a hard gate before creating an order or a payment token.
 *
 * @param itemLabel - Optional product name for a per-item error message at checkout.
 */
export function assertStoreServiceable(
    store: StoreServiceabilityInput,
    target: ServiceabilityTarget,
    itemLabel?: string,
): ServiceabilityResult {
    const result = checkStoreServiceability(store, target);
    if (!result.serviceable) {
        const what = itemLabel ? `Item '${itemLabel}'` : `Store '${store.name ?? "selected store"}'`;
        throw new ApiError(400, `${what} cannot be delivered to your selected address.`);
    }
    return result;
}

/** A cart line item, only the fields needed to gate serviceability. */
export interface ServiceabilityCartItem {
    storeId?: unknown;
    /** Product name for the per-item error message (order items expose this as `title`). */
    title?: string;
    name?: string;
}

/**
 * Hard checkout gate: verifies every store represented in the cart can deliver to the
 * target address, throwing a 400 {@link ApiError} on the first unreachable (or missing)
 * item. Each unique store is loaded once. A no-op when the cart carries no storeIds.
 *
 * @param items - Cart/order line items carrying `storeId` and a product name.
 * @param target - Destination pincode and/or GPS coordinates.
 */
export async function assertCartServiceable(
    items: ServiceabilityCartItem[],
    target: ServiceabilityTarget,
): Promise<void> {
    const storeIds = Array.from(
        new Set((items ?? []).map((item) => item.storeId?.toString()).filter(Boolean)),
    ) as string[];
    if (storeIds.length === 0) return;

    const stores = await Store.find({ _id: { $in: storeIds.map((id) => new Types.ObjectId(id)) } })
        .select("name deliveryConfig deliveryRadiusKm currentLocation")
        .lean();
    const storesById = new Map(stores.map((store: any) => [store._id.toString(), store]));

    for (const item of items ?? []) {
        const storeId = item.storeId?.toString();
        if (!storeId) continue;
        const label = item.title ?? item.name;
        const store = storesById.get(storeId);
        if (!store) {
            throw new ApiError(400, `${label ? `Item '${label}'` : "An item in your cart"} is no longer available.`);
        }
        assertStoreServiceable(store, target, label);
    }
}

/**
 * Checkout availability gate: blocks placing an order that contains items from a store
 * that has been deactivated (`isActive === false`) or is currently closed
 * (`isOpen === false`, e.g. the merchant closed early). Complements
 * {@link assertCartServiceable}, which checks delivery reach rather than open state.
 *
 * Only explicit `false` blocks — undefined status is left to serviceability/other gates.
 *
 * @param items - Cart/order line items carrying `storeId`.
 */
export async function assertCartStoresOpen(items: ServiceabilityCartItem[]): Promise<void> {
    const storeIds = Array.from(
        new Set((items ?? []).map((item) => item.storeId?.toString()).filter(Boolean)),
    ) as string[];
    if (storeIds.length === 0) return;

    const stores = await Store.find({ _id: { $in: storeIds.map((id) => new Types.ObjectId(id)) } })
        .select("name isOpen isActive")
        .lean();
    const storesById = new Map(stores.map((store: any) => [store._id.toString(), store]));

    for (const item of items ?? []) {
        const storeId = item.storeId?.toString();
        if (!storeId) continue;
        const store: any = storesById.get(storeId);
        const label = store?.name ? `'${store.name}'` : "A store in your cart";
        if (!store || store.isActive === false) {
            throw new ApiError(400, `${label} is no longer available.`);
        }
        if (store.isOpen === false) {
            throw new ApiError(
                400,
                `${label} is currently closed and not accepting orders. Please try again later or remove its items to continue.`,
            );
        }
    }
}

/**
 * Returns active storefront stores that can deliver to the target, each annotated
 * with distance and how it matched, sorted nearest-first.
 *
 * Hyperlocal store counts keep the in-memory filter cheap; a coarse `$geoWithin`
 * pre-filter can be layered in later if per-region store counts grow large.
 *
 * @param target - Destination pincode and/or GPS coordinates.
 * @param extraFilter - Additional Mongo filter merged onto the active-storefront base filter.
 */
export async function findServiceableStores(
    target: ServiceabilityTarget,
    extraFilter: Record<string, unknown> = {},
) {
    const stores = await Store.find({ ...ACTIVE_STOREFRONT_FILTER, ...extraFilter }).lean();
    return stores
        .map((store) => ({ store, ...checkStoreServiceability(store as StoreServiceabilityInput, target) }))
        .filter((entry) => entry.serviceable)
        .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
}
