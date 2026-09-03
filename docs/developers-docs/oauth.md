# OAuth (Google) — QuickBihar

> Single source of truth for **Google OAuth 2.0** in QuickBihar — covers the **Google Cloud Console** setup, **all production + testing URLs/URIs/redirects**, the **.env templates** for server / web / mobile, and how the **code uses each env var**.
>
> **Last updated:** 2026-09-04
> **Audience:** Devs onboarding a new environment (laptop, staging, prod)
> **Time:** ~25 min for the cloud console + ~5 min per env file
>
> For the deeper auth-flow / cookie / token-rotation architecture, see [08_Authentication.md](./08_Authentication.md). For every other env var, see [16_Environment.md](./16_Environment.md).

---

## 0. What you need from Google Cloud

| Credential | Used by | Audience check on server |
|------------|---------|--------------------------|
| **Web client ID** | Web dashboard (Next.js), iOS (ASWebAuthenticationSession) | `GOOGLE_CLIENT_ID` (server) |
| **Android client ID** | Android app (Google Sign-In SDK) | `GOOGLE_ANDROID_CLIENT_ID` (server) — recommended |
| **iOS client ID** | iOS app (Google Sign-In SDK) | `GOOGLE_IOS_CLIENT_ID` (server) — optional |
| **Web client secret** | Only if you ever wire the auth-code flow server-side | `GOOGLE_CLIENT_SECRET` — optional today |
| **Android package name** | Tells the Google SDK which app to launch | `GOOGLE_ANDROID_PACKAGE=com.quickbihar.app` |
| **Android SHA-1** | Matches your release/debug keystore | Configured **in the Google Cloud console**, not in `.env` |

---

## 1. Google Cloud Console — step-by-step

### 1.1 Project

1. Go to https://console.cloud.google.com/
2. Create or pick a project — e.g. **QuickBihar**.
3. Top-left project picker → ensure the right project is selected.

### 1.2 OAuth consent screen

1. Sidebar → **APIs & Services** → **OAuth consent screen**.
2. User type: **External** (or **Internal** if you're on Workspace and only want org members).
3. Fill in:

   | Field | Value |
   |-------|-------|
   | App name | `QuickBihar` |
   | User support email | your support email |
   | App logo | QuickBihar logo (optional) |
   | Application home page | `https://quick.voiceact.tech` |
   | Application privacy policy link | `https://quick.voiceact.tech/privacy-policy` |
   | Application terms of service link | `https://quick.voiceact.tech/terms-of-service` |
   | Authorized domains | `quick.voiceact.tech`, `voiceact.tech` |
   | Developer contact email | your dev email |

4. **Scopes** → add:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. **Test users** (while in "Testing" mode): add the Google accounts you want to be able to sign in before verification.
6. Click **Save and Continue** through every step. When you're ready for real users, click **Publish App** (basic profile + email scopes usually don't require formal verification).

### 1.3 Credentials — Web client

1. **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**.
2. **Application type:** **Web application**.
3. **Name:** `QuickBihar Web`.
4. **Authorized JavaScript origins** — add (one per line):

   ```
   http://localhost:3000
   http://localhost:3001
   https://quick.voiceact.tech
   https://www.quick.voiceact.tech
   ```

5. **Authorized redirect URIs** — add (forward-compat; the web client uses the *implicit* flow today):

   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   https://quick.voiceact.tech
   https://quick.voiceact.tech/auth/callback
   ```

6. Click **Create**. You'll get:
   - **Client ID** (e.g. `123456789-abc…xyz.apps.googleusercontent.com`)
   - **Client secret** (optional; only needed if you wire auth-code server-side)

7. Paste the **Client ID** into:
   - `web/.env` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `server/.env` as `GOOGLE_CLIENT_ID` (this is the **same** value — it's the public key the server uses to verify the id_token's audience).

### 1.4 Credentials — Android client

1. Same **Credentials** page → **+ Create Credentials** → **OAuth client ID**.
2. **Application type:** **Android**.
3. **Name:** `QuickBihar Android`.
4. **Package name:** `com.quickbihar.app`  *(the package in `mobile/app.json`; the placeholder `com.example` from your spec will NOT match the real app — use the real one)*
5. **SHA-1 certificate fingerprint** — get the SHA-1 of the keystore you'll sign the app with:

   ```bash
   # Debug keystore (development)
   keytool -list -v -keystore ~/.android/debug.keystore \
       -alias androiddebugkey -storepass android -keypass android | grep SHA1

   # Release keystore (Play Store / production)
   keytool -list -v -keystore /path/to/your-release-key.jks \
       -alias your-key-alias | grep SHA1
   ```

   The `12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:AA:BB:CC:DD` in your spec is a **placeholder**. You must replace it with the SHA-1 of your real keystore, otherwise Google will reject the id_token with a `package+signature mismatch` error.

   > You can register **two SHA-1s** (debug + release) by editing the client after creation. This lets dev builds and Play Store builds both work.

6. Click **Create**. You'll get an **Android Client ID** — paste into `mobile/.env` as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and into `server/.env` as `GOOGLE_ANDROID_CLIENT_ID` (for stricter audience checking on Android).

### 1.5 Credentials — iOS client (only if you ship iOS today)

1. **+ Create Credentials** → **OAuth client ID** → **iOS**.
2. **Name:** `QuickBihar iOS`.
3. **Bundle ID:** `com.quickbihar.app`
4. **App Store ID:** (skip if not yet published).
5. Click **Create**. Paste the **iOS Client ID** into:
   - `mobile/.env` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - `server/.env` as `GOOGLE_IOS_CLIENT_ID`

---

## 2. ALL URLs / URIs / LINKS — copy-paste cheat sheet

### 2.1 OAuth consent screen fields

```
App name:                                 QuickBihar
User support email:                       your-support@yourdomain
Application home page:                    https://quick.voiceact.tech
Application privacy policy link:          https://quick.voiceact.tech/privacy-policy
Application terms of service link:        https://quick.voiceact.tech/terms-of-service
Authorized domains:                       quick.voiceact.tech
                                          voiceact.tech
Developer contact email:                  your-dev@yourdomain
Scopes:                                   openid
                                          https://www.googleapis.com/auth/userinfo.email
                                          https://www.googleapis.com/auth/userinfo.profile
```

### 2.2 Web client — Authorized JavaScript origins

```
http://localhost:3000
http://localhost:3001
https://quick.voiceact.tech
https://www.quick.voiceact.tech
```

### 2.3 Web client — Authorized redirect URIs

```
http://localhost:3000
http://localhost:3000/auth/callback
https://quick.voiceact.tech
https://quick.voiceact.tech/auth/callback
```

### 2.4 Android client — Package name + SHA-1 fingerprints

```
Package name:     com.quickbihar.app
SHA-1 (debug):    <paste from keytool ~/.android/debug.keystore>
SHA-1 (release):  <paste from keytool /path/to/your-release-key.jks>
```

### 2.5 iOS client — Bundle ID

```
Bundle ID:        com.quickbihar.app
```

### 2.6 Server API endpoint that the clients POST to

```
POST https://quick.voiceact.tech/api/v1/auth/google
body: {
  idToken:    "<JWT id_token from Google>",
  client:     "web" | "android" | "ios",
  legacyPhone?: "+919876543210"     // optional, for legacy phone migration
}
returns: {
  user: { _id, email, fullName, role, ... },
  accessToken: "...",
  refreshToken: "...",
  isNewUser: true|false
}
```

### 2.7 Mobile deep-link / redirect scheme

| Platform | Redirect URI | Notes |
|----------|--------------|-------|
| Android (system browser) | `com.quickbihar.app:/oauth2redirect` | `@react-native-google-signin/google-signin` v15 default |
| iOS (ASWebAuthenticationSession) | `com.quickbihar.app:/oauth2redirect` | Same library default |
| Expo Go (dev) | `exp://127.0.0.1:8081/--/` | Auto-derived by `expo-auth-session` |

> If you need a custom URL scheme (e.g. `quickbihar://oauth/callback`), declare it under `android.scheme`/`ios.scheme` in `mobile/app.json` and add the matching URI to the Google Cloud client's "Authorized redirect URIs".

### 2.8 Useful Google Cloud URLs

| Purpose | Link |
|---------|------|
| Credentials | https://console.cloud.google.com/apis/credentials |
| OAuth consent screen | https://console.cloud.google.com/apis/credentials/consent |
| API Library (enable Google Identity) | https://console.cloud.google.com/apis/library |
| Domain verification | https://search.google.com/search-console/welcome |
| OAuth 2.0 docs | https://developers.google.com/identity/protocols/oauth2 |
| People API (for `userinfo`) | https://developers.google.com/people/api/rest |

---

## 3. `.env` templates — server / web / mobile

> **Convention:**
> - `server/.env` keys are **plain** (read at runtime from `process.env`).
> - `web/.env` keys are **`NEXT_PUBLIC_*`** (inlined at build time, public).
> - `mobile/.env` keys are **`EXPO_PUBLIC_*`** (inlined at build time, public).
> - Mock/placeholder values are clearly marked. **Replace `replace_me-*` with real values from Google Cloud before testing.**

### 3.1 `server/.env`

```bash
# ── Core ──────────────────────────────────────────────
PORT=8000
NODE_ENV=development                       # development | production | test
MONGODB_URI=mongodb://localhost:27017/quickbihar
REDIS_URL=redis://localhost:6379

# ── JWT secrets ─────────────────────────────────────
ACCESS_TOKEN_SECRET=replace_me-access-token-secret-min-8-chars
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=replace_me-refresh-token-secret-min-8-chars
REFRESH_TOKEN_EXPIRY=10d
RESET_PASSWORD_JWT_SECRET=                  # optional, defaults to REFRESH_TOKEN_SECRET

# ── CORS ────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8081

# ── Google OAuth (THIS DOC) ─────────────────────────
# Required — Web client ID from Google Cloud. The server uses this as
# the audience when verifying the id_token. MUST match the Web client
# ID used by the web dashboard and (typically) the iOS app.
GOOGLE_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com

# Optional — only needed if you ever wire the auth-code flow server-side.
GOOGLE_CLIENT_SECRET=

# Optional — explicit redirect URI for the auth-code flow.
GOOGLE_REDIRECT_URI=

# Recommended — Android client ID. Set this to a stricter value so the
# server rejects id_tokens that weren't issued for your Android app.
GOOGLE_ANDROID_CLIENT_ID=replace_me-android-client-id.apps.googleusercontent.com

# Optional — iOS client ID (mirrors the Android logic).
GOOGLE_IOS_CLIENT_ID=replace_me-ios-client-id.apps.googleusercontent.com

# Optional — only used by the Google Sign-In SDK on Android to verify
# the calling package. Must match the package in mobile/app.json.
GOOGLE_ANDROID_PACKAGE=com.quickbihar.app

# ── ImageKit (uploads) ─────────────────────────────
IMAGEKIT_PUBLIC_KEY=replace_me_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=replace_me_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id

# ── Razorpay (payments) ────────────────────────────
RAZORPAY_KEY_ID=replace_me_razorpay_key_id
RAZORPAY_KEY_SECRET=replace_me_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=                    # optional

# ── Firebase (push) ────────────────────────────────
FIREBASE_PROJECT_ID=replace_me_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"

# ── Email (Resend) ────────────────────────────────
RESEND_API_KEY=                             # optional
RESEND_FROM_EMAIL="Quick Bihar <noreply@voiceact.tech>"

# ── Admin seed ─────────────────────────────────────
ADMIN_EMAIL=admin@yourdomain
ADMIN_PASSWORD=replace_me_admin_password_min_8

# ── Rider / marketplace tuning (defaults shown) ───
MATCHING_STAGE4_RADIUS_KM=8
RIDER_MAX_ACCEPTED_ORDERS_PER_WINDOW=15
RIDER_ACCEPTANCE_WINDOW_HOURS=12
RIDER_MAX_COD_LIABILITY=5000
RETURN_WINDOW_DAYS=7
RIDER_PAYOUT_UPTO_3_KM=20
RIDER_PAYOUT_UPTO_5_KM=30
RIDER_PAYOUT_UPTO_8_KM=45
RIDER_PAYOUT_EXTRA_PER_KM_AFTER_8=5
RIDER_PAYOUT_RAIN_BONUS=0
RIDER_PAYOUT_PEAK_BONUS=0
RIDER_PAYOUT_FESTIVAL_BONUS=0
RIDER_PAYOUT_NIGHT_BONUS=0
MARKETPLACE_COMMISSION_PERCENT=15
```

> **Test-mode mock values:** When running unit tests, set
> `GOOGLE_CLIENT_ID=test_placeholder` and `GOOGLE_CLIENT_SECRET=test_placeholder`
> to satisfy the Zod-validator without making real Google calls.

### 3.2 `web/.env`

```bash
# ── API ──────────────────────────────────────────────
# Dev:           http://localhost:8000/api/v1
# Production:    https://quick.voiceact.tech/api/v1
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Dev:           http://localhost:8000
# Production:    https://quick.voiceact.tech
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000

# ── Google OAuth (Web client) ──────────────────────
# MUST equal the Web client ID from Google Cloud. Same value goes into
# server's GOOGLE_CLIENT_ID so the server can verify the id_token.
NEXT_PUBLIC_GOOGLE_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com
```

> **Security note:** `NEXT_PUBLIC_*` vars are inlined at build time. That's expected — a public OAuth client ID cannot be used to impersonate your server because Google enforces the configured JS origins.

### 3.3 `mobile/.env`

```bash
# ── API origin (pick ONE; uncomment the active one) ─
EXPO_PUBLIC_API_ORIGIN=https://quick.voiceact.tech
# EXPO_PUBLIC_API_ORIGIN=http://localhost:8000
# EXPO_PUBLIC_API_ORIGIN=http://10.0.2.2:8000            # Android emulator
# EXPO_PUBLIC_API_ORIGIN=http://10.56.21.27:8000         # LAN (replace IP)

# ── Google OAuth (mobile) ──────────────────────────
# Android client ID — @react-native-google-signin/google-signin v15
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=replace_me-android-client-id.apps.googleusercontent.com

# iOS client ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=replace_me-ios-client-id.apps.googleusercontent.com

# Web client ID (rare fallback)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com
```

---

## 4. How the code uses each env var

### 4.1 Server

| Env var | Used in | Purpose |
|---------|---------|---------|
| `GOOGLE_CLIENT_ID` | [googleAuth.service.ts](../../server/src/modules/common/auth/googleAuth.service.ts) | Audience for `OAuth2Client.verifyIdToken` (web + iOS tokens) |
| `GOOGLE_ANDROID_CLIENT_ID` | same | Audience for Android tokens (stricter) |
| `GOOGLE_IOS_CLIENT_ID` | same | Audience for iOS tokens (stricter) |
| `GOOGLE_CLIENT_SECRET` | (unused today) | Reserved for auth-code flow |
| `GOOGLE_REDIRECT_URI` | (unused today) | Reserved for auth-code flow |
| `GOOGLE_ANDROID_PACKAGE` | (server doesn't read this; SDK-side only) | — |

> **Startup guard:** If `GOOGLE_CLIENT_ID` is missing, [env.config.ts](../../server/src/config/env.config.ts) (Zod) refuses to start the server with a clear error message. This is intentional — fail-fast is better than runtime 500s.

### 4.2 Web

| Env var | Used in | Purpose |
|---------|---------|---------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | [AuthProviders.tsx](../../web/src/components/providers/AuthProviders.tsx) | `GoogleOAuthProvider` wraps the entire app |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | [GoogleSignInButton.tsx](../../web/src/features/auth/components/GoogleSignInButton.tsx) | Implicit flow; the returned `id_token` is POSTed to `/api/v1/auth/google` |

### 4.3 Mobile

| Env var | Used in | Purpose |
|---------|---------|---------|
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | [googleAuth.ts](../../mobile/src/features/auth/api/googleAuth.ts) | `GoogleSignin.configure({ webClientId, iosClientId })` on Android |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | same | Same on iOS |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | same | `webClientId` param (so a future web-in-WebView flow still works) |

---

## 5. End-to-end verification (after pasting real credentials)

| Step | Web | Android | iOS |
|------|-----|---------|-----|
| Consent screen shows the right app name + logo | ✓ | ✓ | ✓ |
| Google returns an `id_token` (visible in devtools / logcat) | ✓ | ✓ | ✓ |
| Server `verifyIdToken` returns a payload (no `Invalid audience`) | ✓ | ✓ | ✓ |
| `POST /api/v1/auth/google` creates/updates the user and returns tokens | ✓ | ✓ | ✓ |
| Refresh-token rotation works after 1 day | ✓ | ✓ | ✓ |
| The order-detail page shows OTPs after seller confirms | ✓ | ✓ | ✓ |

### Common mistakes

| Symptom | Fix |
|---------|-----|
| `Invalid audience` from the server | `GOOGLE_CLIENT_ID` (server) ≠ the Client ID the SDK is using. Make them the same value. |
| `idpiframe_initialization_failed` on web | Web Client ID missing in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, or the JS origin isn't whitelisted in Google Cloud. |
| Android signs in but server says `Invalid audience` | You created a dedicated Android client. Either set `GOOGLE_ANDROID_CLIENT_ID` to that value, or have the Android SDK use the Web client ID's tokens. |
| `package+signature mismatch` on Android | The SHA-1 in Google Cloud doesn't match the keystore you signed the build with. Re-run `keytool -list` and update. |
| iOS `Error 400: invalid_request` | Bundle ID in Google Cloud ≠ the bundle in `app.json`. |

---

## 6. Production cutover checklist

Before flipping DNS to production:

- [ ] All `GOOGLE_*` vars in `server/.env` are real values (not `replace_me-*`).
- [ ] All `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `web/.env` is the real Web client ID.
- [ ] All `EXPO_PUBLIC_GOOGLE_*` in `mobile/.env` are the real client IDs.
- [ ] **Production origins** added to the Web client's "Authorized JavaScript origins":
  - `https://quick.voiceact.tech`
  - `https://www.quick.voiceact.tech`
- [ ] **Production redirect URIs** added:
  - `https://quick.voiceact.tech`
  - `https://quick.voiceact.tech/auth/callback`
- [ ] **Android release SHA-1** added (in addition to debug) in the Android client.
- [ ] OAuth consent screen **published** (not in "Testing" mode).
- [ ] Real customer Google accounts added as test users (if still in testing).
- [ ] Server logs (in dev) show `verifyIdToken` succeeding for at least one real user.
- [ ] Web dashboard login round-trip works on a real Google account.
- [ ] Mobile app login round-trip works on a real Google account (TestFlight / Play internal testing).

Once production is verified, **delete the test-only entries** from `.env` files (dev URLs, debug keystore SHA-1, etc.) before committing.

---

## 7. Rotation / offboarding

| What leaked | Action |
|-------------|--------|
| Web Client ID | **No rotation possible** (it's public). Make sure the JS origin list is correct. |
| Web Client Secret | Reset in Google Cloud → Credentials → Reset secret → update `GOOGLE_CLIENT_SECRET`. |
| Android Client ID | Re-create the client in Google Cloud → update mobile + server envs → rebuild app. |
| iOS Client ID | Same as Android. |
| Android SHA-1 leaked | Rotate your release keystore → update SHA-1 in Google Cloud → re-sign the app. |

The server's `GOOGLE_CLIENT_ID` is the single source of truth for verification — rotating it invalidates every previously-issued `id_token` (they're short-lived JWTs anyway, signed with Google's rotating certs, so they expire in 1 hour).

---

## Cross-references

- [08_Authentication.md](./08_Authentication.md) — auth flow, JWT, refresh rotation
- [16_Environment.md](./16_Environment.md) — every other env var
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) — alternate, deeper reference (same content, different layout)
- Google Cloud Console — https://console.cloud.google.com/apis/credentials
- `google-auth-library` (Node) — https://www.npmjs.com/package/google-auth-library
- `@react-oauth/google` (Web) — https://www.npmjs.com/package/@react-oauth/google
- `@react-native-google-signin/google-signin` v15 (Mobile) — https://www.npmjs.com/package/@react-native-google-signin/google-signin
