/**
 * Typecheck-only shims for React-Native / Expo native modules.
 *
 * The 268 files copied verbatim from mobile/src import native modules that
 * cannot exist in a Vite web build (expo-router, expo-haptics, safe-area,
 * reanimated, razorpay-native, ...). These `declare module` shims let `tsc -b`
 * resolve those imports WITHOUT editing any copied source.
 *
 * They are type-level only: Vite bundles from main.tsx, and nothing in the
 * web entry graph imports these native modules, so the shims never reach
 * runtime. As each screen is ported to web UI, its native imports disappear
 * and the corresponding line below can be deleted.
 */

declare module "@expo/vector-icons";
declare module "@lodev09/react-native-true-sheet";
declare module "@react-native-async-storage/async-storage";
declare module "@react-native-community/datetimepicker";
declare module "@react-native-google-signin/google-signin";
declare module "@shopify/flash-list";
declare module "@tanstack/query-async-storage-persister";
declare module "expo-blur";
declare module "expo-constants";
declare module "expo-device";
declare module "expo-haptics";
declare module "expo-image";
declare module "expo-image-picker";
declare module "expo-linear-gradient";
declare module "expo-location";
declare module "expo-notifications";
declare module "expo-router";
declare module "expo-router/head";
declare module "expo-secure-store";
declare module "expo-symbols";
declare module "expo-web-browser";
declare module "lottie-react-native";
declare module "react-native-gesture-handler";
declare module "react-native-razorpay";
declare module "react-native-reanimated";
declare module "react-native-reanimated-carousel";
declare module "react-native-safe-area-context";
declare module "react-native-webview";
