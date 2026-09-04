# Environment Variables

> Owner: `server/src/config/env.config.ts`
> Related: [google-oauth.md](../features/google-oauth.md) · [authentication.md](../features/authentication.md)

Every environment variable that QuickBihar's three apps (server / web / mobile) need — what it's called, why it's needed, whether it's required or defaulted, and where it's used. Plus the **fail-fast Zod validation** that prevents misconfigured servers from starting.

```
server/  → .env (Zod-validated via env.config.ts)   ← most vars
web/     → .env (NEXT_PUBLIC_*)                      ← 3 vars
mobile/  → .env (EXPO_PUBLIC_*)                      ← 5 vars (incl. Google)
```

---

## Why Zod validation (`env.config.ts`)

The server validates its env at **startup** via a Zod schema and `safeParse(process.env)`. If any required var is missing or invalid:

```js
if (!parsed.success) {
  console.error("❌ Invalid ENV:", parsed.error.format());
  process.exit(1);            // ← the server will not start
}
export const ENV = parsed.data;
```

> **Fail-fast by design.** A misconfigured server never reaches a 500-causing state — startup is the safe place to die. Production deploys with a half-configured env will simply refuse to boot, with a clear "what's missing" message.

A few details worth knowing:

- `dotenv.config()` runs first; then Zod parses.
- `.transform()` reshapes a few vars (`CORS_ORIGIN` is comma-split into an array, `FIREBASE_PRIVATE_KEY` has `\\n` replaced with real newlines).
- **Always import `ENV` from `@/config/env.config`**, not `process.env` directly. Defaults and transforms only apply on the parsed object.

---

## `server/.env` (full reference)

The canonical template is [`server/.env.example`](../../../server/.env.example). The groups below mirror the Zod schema in `env.config.ts`.

### Core

```bash
PORT=8000                                    # default 8000
NODE_ENV=development                         # development | production | test (default dev)
MONGODB_URI=mongodb://localhost:27017/quickbihar
REDIS_URL=redis://localhost:6379             # default redis://localhost:6379
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `PORT` | no | `8000` | HTTP port. |
| `NODE_ENV` | no | `development` | Switches cookie `secure` / `sameSite` and other dev/prod behaviour. |
| `MONGODB_URI` | **yes** | — | Any valid Mongo URI. Atlas `mongodb+srv://…` is fine. |
| `REDIS_URL` | no | `redis://localhost:6379` | Used for caching, rate limits, and the reset-token replay store. |

### Auth / JWT

```bash
ACCESS_TOKEN_SECRET=replace_me-access-token-secret-min-8-chars
ACCESS_TOKEN_EXPIRY=1d                       # default "1d"
REFRESH_TOKEN_SECRET=replace_me-refresh-token-secret-min-8-chars
REFRESH_TOKEN_EXPIRY=10d                     # default "10d"
RESET_PASSWORD_JWT_SECRET=                   # optional, defaults to REFRESH_TOKEN_SECRET
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `ACCESS_TOKEN_SECRET` | **yes** | — | HS256 signing key for access tokens. Min 8 chars enforced. |
| `ACCESS_TOKEN_EXPIRY` | no | `1d` | TTL string (e.g. `1d`, `12h`, `30m`). |
| `REFRESH_TOKEN_SECRET` | **yes** | — | HS256 signing key for refresh tokens. Min 8 chars. **Use a different value from `ACCESS_TOKEN_SECRET` in production.** |
| `REFRESH_TOKEN_EXPIRY` | no | `10d` | TTL string. |
| `RESET_PASSWORD_JWT_SECRET` | no | `REFRESH_TOKEN_SECRET` | Optional separation — if set, password-reset JWTs are signed with this key. Useful in production so a leak of one secret doesn't compromise the other. |

### CORS

```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8081
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `CORS_ORIGIN` | no | `*` | Comma-separated list, transformed to an array. `*` is allowed but **not** recommended in production. |

### Google OAuth

```bash
GOOGLE_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=                        # optional
GOOGLE_REDIRECT_URI=                         # optional
GOOGLE_ANDROID_CLIENT_ID=replace_me-android-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=replace_me-ios-client-id.apps.googleusercontent.com
GOOGLE_ANDROID_PACKAGE=com.quickbihar.app
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `GOOGLE_CLIENT_ID` | **yes** | — | Web client ID. Used as the audience when verifying `id_token`s. **Startup fails if missing.** Full setup is in [google-oauth.md](../features/google-oauth.md). |
| `GOOGLE_CLIENT_SECRET` | no | — | Only needed if you ever wire the auth-code flow server-side. Unused today. |
| `GOOGLE_REDIRECT_URI` | no | — | Same — reserved for the auth-code flow. |
| `GOOGLE_ANDROID_CLIENT_ID` | no | — | Recommended. Adds the Android client ID to the audience list, so the server can reject Android tokens issued for an unrelated app. |
| `GOOGLE_IOS_CLIENT_ID` | no | — | Same idea, for iOS. |
| `GOOGLE_ANDROID_PACKAGE` | no | — | Must match the package in `mobile/app.json`. Consumed by the SDK on the client, not by the server. |

> **Startup guard:** if `GOOGLE_CLIENT_ID` is missing or empty, `env.config.ts` refuses to start. This is deliberate — see [google-oauth.md §3.1](../features/google-oauth.md#31-serverenv-google-section) for the full template.

### ImageKit (uploads)

```bash
IMAGEKIT_PUBLIC_KEY=replace_me_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=replace_me_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `IMAGEKIT_PUBLIC_KEY` | **yes** | — | ImageKit public key. |
| `IMAGEKIT_PRIVATE_KEY` | **yes** | — | ImageKit private key. |
| `IMAGEKIT_URL_ENDPOINT` | **yes** | — | Must be a valid URL (Zod `.url()`). |

### Razorpay (payments)

```bash
RAZORPAY_KEY_ID=replace_me_razorpay_key_id
RAZORPAY_KEY_SECRET=replace_me_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=                     # optional
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `RAZORPAY_KEY_ID` | **yes** | — | |
| `RAZORPAY_KEY_SECRET` | **yes** | — | |
| `RAZORPAY_WEBHOOK_SECRET` | no | — | Needed only if you wire Razorpay webhooks. |

### Firebase (push)

```bash
FIREBASE_PROJECT_ID=replace_me_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\n"
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `FIREBASE_PROJECT_ID` | **yes** | — | |
| `FIREBASE_CLIENT_EMAIL` | **yes** | — | Must be a valid email (Zod `.email()`). |
| `FIREBASE_PRIVATE_KEY` | **yes** | — | The PEM body. Use `\\n` inside the value; the Zod transform converts to real newlines. |

### Email (Resend)

```bash
RESEND_API_KEY=                              # optional
RESEND_FROM_EMAIL="Quick Bihar <noreply@voiceact.tech>"
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `RESEND_API_KEY` | no | — | Optional in the schema. The reset-password email **silently no-ops** if this is unset — see the gap below. |
| `RESEND_FROM_EMAIL` | no | `Quick Bihar <noreply@voiceact.tech>` | The `From:` header on transactional email. |

### Admin seed

```bash
ADMIN_EMAIL=admin@yourdomain
ADMIN_PASSWORD=replace_me_admin_password_min_8
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `ADMIN_EMAIL` | no | `admin@gmail.com` | Used by the boot script to seed the first admin. **Change in production.** |
| `ADMIN_PASSWORD` | no | `admin123` | Min 8 chars enforced. **Change in production.** |

### Marketplace / rider tuning

```bash
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

All are **optional** with the shown defaults. They tune the rider-matching algorithm, payout tiers, dynamic bonuses, COD liability, and platform commission. See the [pricing engine section in payments.md](../features/payments.md) for what each one does.

---

## `web/.env`

The canonical template is [`web/.env.example`](../../../web/.env.example).

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | **yes** (build-time) | — | Base URL for REST calls. Includes the `/api/v1` prefix. |
| `NEXT_PUBLIC_SOCKET_URL` | **yes** (build-time) | — | Base URL for the socket connection. No prefix. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | **yes** (build-time) | — | Web client ID from Google Cloud. Same value as `server.GOOGLE_CLIENT_ID`. Inlined at build time. |

> `NEXT_PUBLIC_*` vars are baked into the JS bundle at build. They are **not** secrets — the public OAuth client ID is meant to be public, and Google enforces the configured JS origins server-side.

---

## `mobile/.env`

The canonical template is [`mobile/.env.example`](../../../mobile/.env.example).

```bash
EXPO_PUBLIC_API_ORIGIN=https://quick.voiceact.tech
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=replace_me-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=replace_me-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=replace_me-web-client-id.apps.googleusercontent.com
```

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `EXPO_PUBLIC_API_ORIGIN` | **yes** (build-time) | — | Base URL for REST calls. Pick one: `https://quick.voiceact.tech` (prod), `http://localhost:8000` (iOS sim / Mac), `http://10.0.2.2:8000` (Android emulator), or your LAN IP. |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | **yes** (build-time) | — | Android client ID. Consumed by `GoogleSignin.configure`. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | **yes** (build-time) | — | iOS client ID. Same. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | **yes** (build-time) | — | Web client ID (rare fallback for in-app web flows). Same value as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. |

---

## Required vs optional (cheat sheet)

### Server (required for startup)

`MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `GOOGLE_CLIENT_ID`, `IMAGEKIT_*` (3), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

### Server (optional with defaults)

Everything else — see each section above.

### Web (build-time required)

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### Mobile (build-time required)

`EXPO_PUBLIC_API_ORIGIN`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

---

## Production secrets — operational notes

- **Never commit `.env`.** Each `.env.example` is the sanitized template.
- **Rotate any leaked secret immediately.** During the 2026-08 audit, the server's `.env` was found exposed; the Resend, Razorpay, SMSLocal, 2Factor, Firebase PEM, MongoDB URI, and JWT secrets were all rotated on the same day. The new template files (`server/.env.example`, `web/.env.example`, `mobile/.env.example`) are the source of truth for the next operator.
- **Use a separate `RESET_PASSWORD_JWT_SECRET`.** Defaulting to `REFRESH_TOKEN_SECRET` is fine for dev, but production should keep these distinct.
- **Use different `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.** They are not interchangeable, and a leak of one should not compromise the other.

---

## Known gaps

- `RESEND_API_KEY` is optional in the schema. If unset, `MailService.sendResetPasswordLink` silently no-ops — the user sees the standard "we sent you a link" response but receives no email. Either make it required, or warn loudly at boot when it's empty.
- `ADMIN_PASSWORD` defaults to `admin123` and `ADMIN_EMAIL` to `admin@gmail.com`. The seed script uses these, so a fresh production server can boot with a publicly-known admin. **Set them in `.env` before the first deploy.**
- No secret-rotation strategy is automated. Rotation is currently a manual `kubectl edit secret` / SSH + edit workflow. Tracked in the operations backlog.
