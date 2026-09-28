/**
 * Google sign-in config (web).
 *
 * Web uses Google Identity Services directly (`GoogleSignInButton.web.tsx`)
 * with the OAuth client ID from env — no native SDK involved. The exports
 * below keep the native button variant (`GoogleSignInButton.tsx`, reference
 * only on web) compiling; every method is a documented no-op here.
 */

let configured = false;

export const configureGoogleSignIn = () => {
  configured = true;
};

export const statusCodes = {
  SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
  IN_PROGRESS: "IN_PROGRESS",
  PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  SIGN_IN_REQUIRED: "SIGN_IN_REQUIRED",
};

export function isErrorWithCode(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in (error as object);
}

export const GoogleSignin = {
  configure: (_options?: unknown) => {},
  hasPlayServices: async (_options?: unknown) => true,
  signIn: async (): Promise<never> => {
    throw new Error("Native Google sign-in is not available in the web build.");
  },
  signOut: async () => {},
  isSignedIn: async () => false,
  hasPreviousSignIn: () => false,
  getCurrentUser: () => null,
};

export const isGoogleSignInConfigured = () => configured;

/**
 * Clears the native Google SDK's cached account (mobile only, no-op on web).
 *
 * Never throws — auth flows must succeed even if the Google cache clear fails.
 */
export const signOutGoogleNative = async (): Promise<void> => {
  // No native SDK on web — nothing to clear.
};
