# 16 — Environment Variables & Config

> **Created:** 2026-08-01
> **File type:** Config deep-dive
> **Padhne ka time:** ~25 min

---

## WHAT — Yeh doc kya cover karti hai?

Har **environment variable** jo QuickBihar ke teeno apps (server / web / mobile) ko chahiye — kya naam hai, kyun chahiye, required hai ya default, aur kaha use hoti hai. Plus **kaunsi missing hai** (deployment pitfall) aur `.env` ko secure kaise rakhein.

```
server/  → .env (Zod-validated via env.config.ts)   ← sabse zyada vars
web/     → .env (NEXT_PUBLIC_*)                      ← 2 vars only
mobile/  → .env (EXPO_PUBLIC_*)                      ← 1 var only
```

---

## WHY — Zod validation kaun zaroori? (`env.config.ts`)

Server **startup pe hi** env validate karta hai — Zod schema ke saath `safeParse(process.env)`. Agar koi required var missing/invalid ho:

```javascript
if (!parsed.success) {
  console.error("❌ Invalid ENV:", parsed.error.format());
  process.exit(1);            // ← server START hi nahi hoga
}
export const ENV = parsed.data;
```

> ★ **Fail-fast design secrets ke liye:** Bina valid config ke server chalu hi nahi hoga. Yeh **accha** hai — runtime pe kabhi `undefined` env ki wajah se 500 aane ke bajaye, startup pe hi clear error (kya missing hai) milta hai. Production deploy pe aadhe-configured server chaos se bachata hai.

- `dotenv.config()` pehle load karta hai `.env` ko, phir Zod parse.
- `.transform()` kuch vars ko shape karta hai (`CORS_ORIGIN` comma-split → array, `FIREBASE_PRIVATE_KEY` `\\n` → real newline).
- **Important:** `process.env` seedha mat padho — `import { ENV } from "@/config/env.config"` use karo. Zod defaults/transforms sirf `ENV` pe apply hote hain.

---

## WHERE — `server/.env` (poora reference)

```bash
# ── CORE ──────────────────────────────────────────────
PORT=8000                                    # default 8000
MONGODB_URI=mongodb+srv://.../quickbihar     # REQUIRED — min(1)
REDIS_URL=redis://localhost:6379             # default redis://localhost:6379
NODE_ENV=development                         # development|production|test (default dev)

# ── AUTH / JWT ────────────────────────────────────────
ACCESS_TOKEN_SECRET=...                      # REQUIRED — min 8 chars
ACCESS_TOKEN_EXPIRY=1d                       # default "1d"
REFRESH_TOKEN_SECRET=...                     # REQUIRED — min 8 chars
REFRESH_TOKEN_EXPIRY=10d                     # default "10d"

# ── CORS ──────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
                                             # default "*" — comma-separated LIST (transform → array)

# ── MARKETPLACE / RIDER TUNING ────────────────────────
MATCHING_STAGE4_RADIUS_KM=8                  # rider matching radius (default 8)
RIDER_MAX_ACCEPTED_ORDERS_PER_WINDOW=15      # per-window cap (15)
RIDER_ACCEPTANCE_WINDOW_HOURS=12             # window size (12h)
RIDER_MAX_COD_LIABILITY=5000                 # COD cap ₹ (5000)
RETURN_WINDOW_DAYS=7                         # return eligibility (7d)
RIDER_PAYOUT_UPTO_3_KM=20
RIDER_PAYOUT_UPTO_5_KM=30
RIDER_PAYOUT_UPTO_8_KM=45
RIDER_PAYOUT_EXTRA_PER_KM_AFTER_8=5
RIDER_PAYOUT_RAIN_BONUS=0                    # dynamic bonuses (default 0 = off)
RIDER_PAYOUT_PEAK_BONUS=0
RIDER_PAYOUT_FESTIVAL_BONUS=0
RIDER_PAYOUT_NIGHT_BONUS=0
MARKETPLACE_COMMISSION_PERCENT=15            # platform fee % (default 15)

# ── ADMIN SEED ────────────────────────────────────────
ADMIN_EMAIL=admin@gmail.com                  # default admin@gmail.com
ADMIN_PASSWORD=admin123                      # default admin123  ⚠️ CHANGE IN PROD

# ── IMAGEKIT (uploads) ────────────────────────────────
IMAGEKIT_PUBLIC_KEY=...                      # REQUIRED
IMAGEKIT_PRIVATE_KEY=...                     # REQUIRED
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...   # REQUIRED (.url())

# ── RAZORPAY (payments) ───────────────────────────────
RAZORPAY_KEY_ID=...                          # REQUIRED
RAZORPAY_KEY_SECRET=...                      # REQUIRED
RAZORPAY_WEBHOOK_SECRET=...                  # optional (webhook verify)

# ── FIREBASE (push) ───────────────────────────────────
FIREBASE_PROJECT_ID=...                      # REQUIRED
FIREBASE_CLIENT_EMAIL=...@...iam.gserviceaccount.com  # REQUIRED (.email())
FIREBASE_PRIVATE_KEY="-----BEGIN...-----\\n"  # REQUIRED (transform: \\n → newline)

# ── EMAIL (Resend) ────────────────────────────────────
RESEND_API_KEY=...                           # optional in schema  ⚠️ but see gap below
```

| Category | Vars |
|----------|------|
| **Required (server start block)** | `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `IMAGEKIT_*` (3), `RAZORPAY_KEY_ID/SECRET`, `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` |
| **Sensible defaults** | `PORT`, `NODE_ENV`, expiry strings, `CORS_ORIGIN`, all rider/marketplace tuning, `REDIS_URL`, `ADMIN_*` |
| **Optional** | `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY` |

<!-- APPEND_2 -->

