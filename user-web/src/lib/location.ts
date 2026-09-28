/**
 * Device location (web: Geolocation API, no native modules).
 *
 * Same call shapes the screens already use (`requestForegroundPermissionsAsync`,
 * `getCurrentPositionAsync`, `getLastKnownPositionAsync`, `watchPositionAsync`,
 * `Accuracy`), so call sites only change their import source.
 */

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export interface GeoCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface GeoPosition {
  coords: GeoCoords;
  timestamp: number;
}

/** Legacy alias — same shape as the old expo type. */
export type LocationObject = GeoPosition;

export interface LocationSubscription {
  remove: () => void;
}

export async function hasServicesEnabledAsync(): Promise<boolean> {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export async function requestForegroundPermissionsAsync(): Promise<{
  status: "granted" | "denied";
}> {
  // Browsers prompt on first getCurrentPosition/watchPosition call.
  // Pre-check via the Permissions API when available so a hard denial
  // surfaces early instead of as a confusing prompt loop.
  try {
    const perms = (navigator as any)?.permissions;
    const res = await perms?.query?.({ name: "geolocation" });
    if (res?.state === "denied") return { status: "denied" };
  } catch {
    // Permissions API missing — fall through and let the browser prompt.
  }
  if (!(await hasServicesEnabledAsync())) return { status: "denied" };
  return { status: "granted" };
}

function toPosition(pos: GeolocationPosition): GeoPosition {
  return {
    coords: {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      altitude: pos.coords.altitude,
      accuracy: pos.coords.accuracy,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
    },
    timestamp: pos.timestamp,
  };
}

export function getCurrentPositionAsync(_options?: {
  accuracy?: number;
}): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toPosition(pos)),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

export async function getLastKnownPositionAsync(): Promise<GeoPosition | null> {
  try {
    return await getCurrentPositionAsync();
  } catch {
    return null;
  }
}

export async function watchPositionAsync(
  _options: { accuracy?: number; timeInterval?: number; distanceInterval?: number },
  callback: (location: GeoPosition) => void
): Promise<LocationSubscription> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not available in this browser.");
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => callback(toPosition(pos)),
    () => {},
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );
  return {
    remove: () => navigator.geolocation.clearWatch(id),
  };
}

/**
 * Native reverse-geocoding has no web equivalent here — callers already
 * fall back to the backend `reverseGeocodeRequest` API, so this stays
 * an empty result (previously it returned a hardcoded Patna stub).
 */
export async function reverseGeocodeAsync(
  _location?: { latitude: number; longitude: number },
  _options?: unknown
): Promise<any[]> {
  return [];
}

export default {
  Accuracy,
  hasServicesEnabledAsync,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  getLastKnownPositionAsync,
  watchPositionAsync,
  reverseGeocodeAsync,
};
