/**
 * Pure-web push-notification API — same function names the app used from
 * `expo-notifications`, implemented as web-safe no-ops/stubs.
 *
 * There is no native push runtime in this Vite build (real Web Push needs
 * a service worker + backend), so every call resolves harmlessly, exactly
 * like the old web shim did.
 */
export const AndroidImportance = {
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
  MIN: 1,
  LOW: 2,
  NONE: 0,
};

export const AndroidNotificationVisibility = {
  PUBLIC: 1,
  PRIVATE: 0,
  SECRET: -1,
};

export function setNotificationHandler(_handler?: any) {}
export function addNotificationReceivedListener(_listener?: any) { return { remove: () => {} }; }
export function addNotificationResponseReceivedListener(_listener?: any) { return { remove: () => {} }; }
export function getPermissionsAsync() { return Promise.resolve({ status: "granted" }); }
export function requestPermissionsAsync() { return Promise.resolve({ status: "granted" }); }
export function getExpoPushTokenAsync(_opts?: any) { return Promise.resolve({ data: "" }); }
export function getDevicePushTokenAsync() { return Promise.resolve({ data: "" }); }
export function setNotificationChannelAsync(_id: string, _channel: any) { return Promise.resolve({}); }
export function setNotificationCategoryAsync(_id: string, _actions: any) { return Promise.resolve({}); }
export function scheduleNotificationAsync(_request: any) { return Promise.resolve(""); }
export function dismissNotificationAsync(_id: string) { return Promise.resolve(); }

export const webNotifications = {
  getExpoPushTokenAsync,
  getDevicePushTokenAsync,
  setNotificationHandler,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationCategoryAsync,
  scheduleNotificationAsync,
  dismissNotificationAsync,
  AndroidImportance,
  AndroidNotificationVisibility,
};

export default webNotifications;
