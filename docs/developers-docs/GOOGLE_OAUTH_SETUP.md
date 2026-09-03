# Google OAuth — Setup Guide (Web + Android + iOS)

> **Last updated:** 2026-09-04
> **Audience:** Devs setting up a fresh Google Cloud project OR adding OAuth to a new environment
> **Time:** ~25 min for the cloud console + ~5 min per env file

This guide covers the OAuth 2.0 credential configuration for QuickBihar's three clients — the **web dashboard (Next.js)**, the **Android mobile app (Expo)**, and the **iOS mobile app (Expo)** — plus the **server-side ID-token verification**.

> **TL;DR — what you need from Google Cloud:**
> - 1 **Web application** client (used by the dashboard)
> - 1 **Android** client per package name (used by the Android app)
> - 1 **iOS** client per bundle ID (used by the iOS app)
> - 1 **service-account-style secret** in `server/.env` for ID-token verification (the `GOOGLE_CLIENT_ID` itself is the public key; `GOOGLE_CLIENT_SECRET` is optional and only used if you ever add the auth-code flow server-side)
>
> **Mock placeholders are in `server/.env.example`, `web/.env.example`, and `mobile/.env.example`.** Replace them with your real values.

---

## 1. Google Cloud Console — one-time setup

### 1.1 Project

1. Go to https://console.cloud.google.com/
2. Create a project (or pick an existing one) — e.g. **QuickBihar**.
3. Top-left project picker → ensure the right project is selected.

### 1.2 OAuth consent screen

1. Sidebar → **APIs & Services** → **OAuth consent screen**.
2. User type: **External** (unless you have a Workspace and want to limit to your org).
3. Fill in:
   - **App name:** `QuickBihar`
   - **User support email:** your support email
   - **App logo:** upload QuickBihar logo (optional, helps with verification)
   - **Application home page:** `https://quick.voiceact.tech`
   - **Application privacy policy link:** `https://quick.voiceact.tech/privacy-policy`
   - **Application terms of service link:** `https://quick.voiceact.tech/terms-of-service`
   - **Authorized domains:** `quick.voiceact.tech`, `voiceact.tech`
   - **Developer contact email:** your dev email
4. **Scopes** → add:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. **Test users** (while in "Testing" mode): add the Google accounts you want to be able to sign in before the app is verified.
6. Click **Save and Continue** through every step. Once you're ready for real users, click **Publish App** (verification may take a few days for sensitive scopes; we only use basic profile + email so usually it's instant).

### 1.3 Credentials — Web client

1. Sidebar → **APIs & Services** → **Credentials**.
2. **+ Create Credentials** → **OAuth client ID**.
3. **Application type:** **Web application**.
4. **Name:** `QuickBihar Web`.
5. **Authorized JavaScript origins** — add ALL of these (one per line):
   ```
   http://localhost:3000
   http://localhost:3001
   https://quick.voiceact.tech
   https://www.quick.voiceact.tech
   ```
6. **Authorized redirect URIs** — add (the web client uses the *implicit* flow, so redirect URIs are technically optional, but Google still wants them listed for any future code-flow use):
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   https://quick.voiceact.tech
   https://quick.voiceact.tech/auth/callback
   ```
7. Click **Create**. You'll get:
   - **Client ID** (e.g. `123456789-abc…xyz.apps.googleusercontent.com`)
   - **Client secret** (only needed if you ever wire the auth-code flow server-side — we don't today, but you can still store it)
8. **Save both values** — paste them into the **web client's** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and into the **server's** `GOOGLE_CLIENT_ID` (server uses the same Web client ID to verify the id_token).

### 1.4 Credentials — Android client

1. Same **Credentials** page → **+ Create Credentials** → **OAuth client ID**.
2. **Application type:** **Android**.
3. **Name:** `QuickBihar Android`.
4. **Package name:** `com.quickbihar.app`
5. **SHA-1 certificate fingerprint (from your release keystore):**
   - Get the SHA-1 of your **debug** keystore (for development):
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore \
             -alias androiddebugkey -storepass android -keypass android
     ```
     The `Certificate fingerprints` section lists `SHA1: 12:34:56:...`. Copy that.
   - Get the SHA-1 of your **release** keystore (for Play Store):
     ```bash
     keytool -list -v -keystore /path/to/your-release-key.jks \
             -alias your-key-alias
     ```
   - **If you have not yet generated a release keystore**, use the **debug** SHA-1 for now and add the release SHA-1 later (Google Cloud lets you edit it).
   - The fingerprint in your spec is a placeholder (`12:34:56:...AA:BB:CC:DD`) — replace with your real one.
6. Click **Create**. You'll get an **Android Client ID** — paste into `mobile/.env` as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`. (The Android client doesn't use a secret.)

### 1.5 Credentials — iOS client (optional but recommended)

1. Same flow → **+ Create Credentials** → **OAuth client ID**.
2. **Application type:** **iOS**.
3. **Name:** `QuickBihar iOS`.
4. **Bundle ID:** `com.quickbihar.app`
5. **App Store ID:** (skip for now — only needed if you wire URL-scheme universal-link verification).
6. Click **Create**. You'll get an **iOS Client ID** — paste into `mobile/.env` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

> The iOS client is only required for the `@react-native-google-signin/google-signin` v15 iOS flow. If you're only shipping Android today you can skip this.

### 1.6 Note on **placeholder values** in your spec

Your spec lists:
- Android package: `com.example`
- Android SHA-1: `12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:AA:BB:CC:DD`

Both are **placeholders**. The real package we ship under is **`com.quickbihar.app`**, and the SHA-1 must come from your own keystore (commands above). If you literally paste `com.example` into Google Cloud, the credential will exist but **will not match** your app at sign-in time and Google will reject the id_token.

---

## 2. All URLs / URIs / Links — production & testing

### 2.1 OAuth consent screen (already filled above)

| Field | Value |
|-------|-------|
| Application home page | `https://quick.voiceact.tech` |
| Application privacy policy link | `https://quick.voiceact.tech/privacy-policy` |
| Application terms of service link | `https://quick.voiceact.tech/terms-of-service` |
| Authorized domains | `quick.voiceact.tech`, `voiceact.tech` |
| Support email | your support email |
| Developer contact email | your dev email |

### 2.2 Authorized JavaScript origins (Web client)

| Environment | Origin |
|-------------|--------|
| Dev (Next.js) | `http://localhost:3000` |
| Dev (alternate port) | `http://localhost:3001` |
| Prod | `https://quick.voiceact.tech` |
| Prod (www) | `https://www.quick.voiceact.tech` |

### 2.3 Authorized redirect URIs (Web client)

| Environment | URI |
|-------------|-----|
| Dev (root) | `http://localhost:3000` |
| Dev (callback path) | `http://localhost:3000/auth/callback` |
| Prod (root) | `https://quick.voiceact.tech` |
| Prod (callback path) | `https://quick.voiceact.tech/auth/callback` |

> The web client uses the **implicit** flow (`id_token`, no server exchange), so redirect URIs are a forward-compat safety net. The server's `/auth/google` endpoint receives the `id_token` in the POST body — no redirect is performed.

### 2.4 Server-side verification

The server only needs the **Web client ID** to verify the `id_token`:

```
Server → POST /api/v1/auth/google
  body: { idToken: "<JWT from Google>", client: "web" | "android" | "ios", legacyPhone?: string }

Server verifies the idToken against:
  - GOOGLE_CLIENT_ID (web)        → for "web" + "ios" (iOS uses server-side exchange)
  - GOOGLE_ANDROID_CLIENT_ID       → for "android" (recommended)
  - GOOGLE_IOS_CLIENT_ID           → for "ios"
```

### 2.5 Mobile (Expo) deep-link scheme

The mobile app uses the **Expo `scheme`** from `app.json` for the OAuth redirect:

| Platform | Redirect scheme | Notes |
|----------|-----------------|-------|
| Android | `com.quickbihar.app:/oauth2redirect` (Google default) | `@react-native-google-signin/google-signin` v15 uses the system browser + custom tab |
| iOS | `com.quickbihar.app:/oauth2redirect` | Same library uses ASWebAuthenticationSession |
| Expo Go (dev) | `exp://127.0.0.1:8081/--/` | The `expo-auth-session` library auto-derives this |

> If you ever need a custom URL scheme (e.g. `quickbihar://oauth/callback`), declare it in `app.json` under `android.scheme`/`ios.scheme` and add it to the Google Cloud "Authorized redirect URIs" of the respective client.

---

## 3. `.env` templates — all three apps

The following templates include **placeholder values** that you replace with the real credentials from Google Cloud. Once everything works in production, delete the test/development entries.

### 3.1 `server/.env` (server-side)

```bash
# ── Google OAuth (server verifies the id_token) ──────────
# Replace the placeholders below with your real Web/Android/iOS Client IDs.
# Get them from: https://console.cloud.google.com/apis/credentials

# REQUIRED — Web client ID. The web dashboard and iOS both send id_tokens
# issued under this client. Server verifies them against this audience.
GOOGLE_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com

# OPTIONAL — only needed if you ever wire the auth-code flow server-side.
# We use the implicit flow today, so this is safe to leave blank.
GOOGLE_CLIENT_SECRET=

# OPTIONAL — explicit redirect URI for the auth-code flow.
# Leave blank if you only use the implicit flow.
GOOGLE_REDIRECT_URI=

# OPTIONAL — Android client ID. Recommended: the same as GOOGLE_CLIENT_ID
# is fine, but if you create a dedicated Android client in Cloud Console,
# paste that here for stricter audience checking on Android.
GOOGLE_ANDROID_CLIENT_ID=replace_me-android-client-id.apps.googleusercontent.com

# OPTIONAL — iOS client ID. Same logic as Android.
GOOGLE_IOS_CLIENT_ID=replace_me-ios-client-id.apps.googleusercontent.com

# OPTIONAL — only used by @react-native-google-signin/google-signin on
# Android to validate the package. Must match the package in app.json.
GOOGLE_ANDROID_PACKAGE=com.quickbihar.app
```

> Mock values for the test environment (e.g. when running unit tests) are `GOOGLE_CLIENT_ID=test_placeholder` and `GOOGLE_CLIENT_SECRET=test_placeholder` — see `src/_tests_/*.test.ts` for usage.

### 3.2 `web/.env` (Next.js dashboard)

```bash
# ── API ─────────────────────────────────────────────────
# Local:        http://localhost:8000/api/v1
# Production:   https://quick.voiceact.tech/api/v1
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Local:        http://localhost:8000
# Production:   https://quick.voiceact.tech
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000

# ── Google OAuth (web client) ──────────────────────────
# This is the public-facing Web client ID. The same value goes into
# server's GOOGLE_CLIENT_ID so the server can verify the id_token.
# Get it from: Google Cloud → APIs & Services → Credentials → Web client.
NEXT_PUBLIC_GOOGLE_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com
```

> **Security note:** `NEXT_PUBLIC_*` vars are **inlined at build time** and visible to anyone who opens devtools. That's expected for a public OAuth client ID — it cannot be used to impersonate your server because Google only allows the configured JS origins / redirect URIs.

### 3.3 `mobile/.env` (Expo)

```bash
# ── API ─────────────────────────────────────────────────
# Choose ONE of the following (the active one is uncommented):

# Production
EXPO_PUBLIC_API_ORIGIN=https://quick.voiceact.tech

# Local LAN (replace with your laptop's LAN IP — `ipconfig getifaddr en0` on Mac,
# `ipconfig` on Windows. The Expo dev tools will print this on startup.)
# EXPO_PUBLIC_API_ORIGIN=http://10.56.21.27:8000

# Android emulator
# EXPO_PUBLIC_API_ORIGIN=http://10.0.2.2:8000

# iOS simulator
# EXPO_PUBLIC_API_ORIGIN=http://localhost:8000

# ── Google OAuth (mobile) ─────────────────────────────
# Android client ID — paste from Google Cloud → Android client.
# @react-native-google-signin/google-signin v15 uses this on Android.
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=replace_me-android-client-id.apps.googleusercontent.com

# iOS client ID — paste from Google Cloud → iOS client.
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=replace_me-ios-client-id.apps.googleusercontent.com

# Web client ID — used as a fallback / for web sign-in inside the app (rare).
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com
```

---

## 4. How the code uses these values

### 4.1 Server

- [server/src/modules/common/auth/googleAuth.service.ts](../../server/src/modules/common/auth/googleAuth.service.ts) — uses `ENV.GOOGLE_CLIENT_ID` (and optionally `GOOGLE_ANDROID_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID`) as the **audience** when calling `google-auth-library`'s `OAuth2Client.verifyIdToken`.
- [server/src/config/env.config.ts](../../server/src/config/env.config.ts) — Zod-validates all `GOOGLE_*` vars at startup. If `GOOGLE_CLIENT_ID` is missing, **server refuses to start**.

### 4.2 Web

- [web/src/components/providers/AuthProviders.tsx](../../web/src/components/providers/AuthProviders.tsx) — wraps the app in `GoogleOAuthProvider` with `clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- [web/src/features/auth/components/GoogleSignInButton.tsx](../../web/src/features/auth/components/GoogleSignInButton.tsx) — uses the implicit flow (`flow: "implicit"`) and returns the `id_token` to the parent.
- Parent (`RoleLoginForm`, `PartnerRegisterForm`) POSTs the `id_token` to `POST /api/v1/auth/google` on the server.

### 4.3 Mobile

- [mobile/src/features/auth/api/googleAuth.ts](../../mobile/src/features/auth/api/googleAuth.ts) — wraps `@react-native-google-signin/google-signin` v15; picks the right Client ID per platform (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` on Android, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` on iOS, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` as fallback).
- [mobile/src/features/auth/screen/auth.screen.tsx](../../mobile/src/features/auth/screen/auth.screen.tsx) — calls the above and POSTs the `idToken` to `POST /api/v1/auth/google`.

---

## 5. End-to-end test checklist

After pasting real credentials, verify on **each platform**:

| Step | Web | Android | iOS |
|------|-----|---------|-----|
| Consent screen shows the right app name + logo | ✓ | ✓ | ✓ |
| Google returns `id_token` (visible in devtools / logcat) | ✓ | ✓ | ✓ |
| Server `verifyIdToken` returns a payload (no `Invalid audience`) | ✓ | ✓ | ✓ |
| User is created (or matched) and logged in | ✓ | ✓ | ✓ |
| `POST /auth/google` returns `{ user, accessToken, refreshToken }` | ✓ | ✓ | ✓ |
| Refresh-token rotation works after 1 day | ✓ | ✓ | ✓ |

Common mistakes:
- **"Invalid audience"** — the `GOOGLE_CLIENT_ID` on the server doesn't match the client ID used by the SDK. They MUST be the same value.
- **"idpiframe_initialization_failed"** — the web client ID is missing or the JS origin isn't whitelisted in Google Cloud.
- **Android signs in but the server says "Invalid audience"** — you created a dedicated Android client in Google Cloud but the server's `GOOGLE_CLIENT_ID` is still the Web one. Either set `GOOGLE_ANDROID_CLIENT_ID` to the Android client ID, or have the Android SDK send the Web client ID's id_token (we configured it the other way in the SDK — see [googleAuth.ts](../../mobile/src/features/auth/api/googleAuth.ts)).

---

## 6. Rotation / offboarding

If a Client ID is ever leaked:
1. Go to Google Cloud → Credentials → click the client → **Reset secret** (only works for Web/iOS). For Android, the SHA-1 + package acts as the "secret" — rotate your release keystore if it leaks.
2. Update the env vars in your deployment secrets manager.
3. Restart server / web / rebuild the mobile app.

The server's `GOOGLE_CLIENT_ID` is the single source of truth for verification — rotating it invalidates every previously-issued id_token (they're JWTs signed with Google's certs, so they expire in 1 hour anyway, but new sign-ins will use the new ID).

---

## Cross-references

- [08_Authentication.md](./08_Authentication.md) — auth flow (register, login, refresh)
- [16_Environment.md](./16_Environment.md) — full env var reference for all three apps
- Google Cloud Console — https://console.cloud.google.com/apis/credentials
- OAuth 2.0 spec — https://developers.google.com/identity/protocols/oauth2
- google-auth-library — https://www.npmjs.com/package/google-auth-library
- @react-oauth/google — https://www.npmjs.com/package/@react-oauth/google
- @react-native-google-signin/google-signin — https://www.npmjs.com/package/@react-native-google-signin/google-signin
