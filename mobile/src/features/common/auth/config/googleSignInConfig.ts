import Constants from "expo-constants";
import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

/**
 * Configure Google native sign-in. Reads client IDs from Expo's
 * `extra.google` block (set via app.json → `expo.extra.google`).
 *
 * Android: webClientId is the OAuth Web client ID, used to obtain
 *          a server-friendly id_token. iOS uses its iOS client ID.
 *
 * Call this ONCE at app startup (in the root layout) before any
 * Google sign-in attempt.
 */
let configured = false;

export const configureGoogleSignIn = () => {
  if (configured) return;

  const extra = (Constants.expoConfig?.extra as any) ?? {};
  const google = extra.google ?? {};

  const webClientId =
    google.webClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "183149129805-vf8pkq6h066lcapjanjv1271g36jvij4.apps.googleusercontent.com";

  const iosClientId =
    google.iosClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const config: {
    webClientId?: string;
    iosClientId?: string;
    offlineAccess?: boolean;
  } = {
    offlineAccess: true,
  };

  if (webClientId) config.webClientId = webClientId;
  if (iosClientId) config.iosClientId = iosClientId;

  // The library requires at least one of webClientId / iosClientId.
  // When running in Expo Go without native config, this is a no-op
  // and Google sign-in will surface a helpful error.
  try {
    GoogleSignin.configure(config);
    configured = true;
  } catch (err) {
    // Swallow — the user will see a clear error on the button press.
    console.warn("[googleSignInConfig] configure failed:", err);
  }
};

export { GoogleSignin };

/**
 * Clears the native Google SDK's cached account (mobile only, no-op on web).
 *
 * The native SDK remembers the last signed-in Google account. If we don't
 * sign out of it, the next `GoogleSignin.signIn()` silently reuses that
 * account instead of showing the "choose an account" picker. Call this on
 * logout AND before every sign-in attempt so the user always sees all
 * their Google accounts and can pick a different one.
 *
 * Never throws — auth flows must succeed even if the Google cache clear fails.
 */
export const signOutGoogleNative = async (): Promise<void> => {
  if (Platform.OS === "web") return;
  try {
    if (await GoogleSignin.hasPreviousSignIn()) {
      await GoogleSignin.signOut();
    }
  } catch (err) {
    console.warn("[googleSignInConfig] Google native sign-out failed:", err);
  }
};
