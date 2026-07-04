/**
 * Geospatial helpers shared across delivery, store-serviceability and order flows.
 *
 * Pure functions with no side effects or DB access. These mirror the ad-hoc
 * helpers currently inlined in subOrder.service.ts so those can be de-duplicated
 * to import from here later without behavioural change.
 */

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

/** Narrows loose lat/lng input to a finite {latitude, longitude}, or null when either is invalid. */
export function finiteLocation(location?: { latitude?: unknown; longitude?: unknown } | null): GeoPoint | null {
    const latitude = Number((location as any)?.latitude);
    const longitude = Number((location as any)?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
}

/** Great-circle (haversine) distance in km between two points, or null if either is invalid. */
export function distanceKmBetween(from?: any, to?: any): number | null {
    const origin = finiteLocation(from);
    const destination = finiteLocation(to);
    if (!origin || !destination) return null;

    const radiusKm = 6371;
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    const dLat = toRadians(destination.latitude - origin.latitude);
    const dLng = toRadians(destination.longitude - origin.longitude);
    const lat1 = toRadians(origin.latitude);
    const lat2 = toRadians(destination.latitude);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Converts a GeoJSON Point (`coordinates: [lng, lat]`) to {latitude, longitude}, or null. */
export function coordinatesFromGeoJson(geo?: { coordinates?: number[] | null } | null): GeoPoint | null {
    const coords = geo?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    return finiteLocation({ longitude: coords[0], latitude: coords[1] });
}
