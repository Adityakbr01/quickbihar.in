import Constants from "expo-constants";
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

  const config: {
    webClientId?: string;
    iosClientId?: string;
    offlineAccess?: boolean;
  } = {
    offlineAccess: true,
  };

  if (google.webClientId) config.webClientId = google.webClientId;
  if (google.iosClientId) config.iosClientId = google.iosClientId;

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
