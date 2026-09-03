/**
 * Google OAuth service — wraps `google-auth-library` to verify ID tokens.
 *
 * The client (web or mobile) obtains a Google ID token via
 *   - Web:   `@react-oauth/google` GoogleLogin component → credentialResponse.credential
 *   - Mobile: `@react-native-google-signin/google-signin` → signIn().idToken
 *
 * The client posts the ID token here. We verify the signature, audience, expiry,
 * and issuer using Google's public keys (no server-side OAuth code exchange needed).
 *
 * Never accept a Google `access_token` as proof of identity — ID tokens only.
 */
import { OAuth2Client } from "google-auth-library";
import { ENV } from "@/config/env.config";
import { ApiError } from "@/utils/ApiError";

const oauthClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
}

/**
 * Verify a Google ID token.
 *
 * @param idToken The JWT issued by Google.
 * @param client  'web' | 'mobile' — used to widen the accepted audience to
 *                the Android client ID when applicable.
 * @returns The normalized Google profile.
 * @throws ApiError 401 if the token is invalid, expired, or has the wrong audience.
 * @throws ApiError 400 if the email on the Google account is not verified.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  client: "web" | "mobile" = "web"
): Promise<GoogleProfile> {
  if (!idToken || idToken.length < 10) {
    throw new ApiError(400, "Invalid Google ID token");
  }

  // Build the audience list — mobile may send tokens issued for the Android client.
  const audience: string[] = [ENV.GOOGLE_CLIENT_ID];
  if (client === "mobile" && ENV.GOOGLE_ANDROID_CLIENT_ID) {
    audience.push(ENV.GOOGLE_ANDROID_CLIENT_ID);
  }
  if (ENV.GOOGLE_IOS_CLIENT_ID) {
    audience.push(ENV.GOOGLE_IOS_CLIENT_ID);
  }

  let ticket;
  try {
    ticket = await oauthClient.verifyIdToken({
      idToken,
      audience,
    });
  } catch (err: any) {
    // Don't leak the underlying Google error verbatim — could include token contents.
    throw new ApiError(401, "Invalid or expired Google token");
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw new ApiError(400, "Google token missing required claims");
  }

  if (payload.email_verified !== true) {
    throw new ApiError(400, "Google account email is not verified");
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    email_verified: true,
    name: payload.name ?? payload.given_name ?? "",
    picture: payload.picture ?? "",
  };
}