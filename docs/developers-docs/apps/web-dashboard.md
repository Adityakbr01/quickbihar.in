# 03 — Frontend (Web Dashboards)

> **Created:** 2026-08-01 · **Updated:** 2026-09-04 (rider dashboard now mirrors the seller-dashboard admin-verification gate; partner register page now has a `google-phone` sub-phase)
> **File type:** App deep-dive
> **Padhne ka time:** ~25 min

---

## WHAT — Yeh doc kya cover karti hai?

`web/` app — jo **Next.js 16** pe bana hai aur **teen portals** serve karta hai: Admin, Seller, Delivery. Iska routing, auth flow, data fetching (React Query + axios), realtime (socket), aur state management (Zustand).

---

## WHY — Web app kis liye hai?

Mobile app **customer + rider** ke liye hai. Lekin **admin, seller, aur delivery (rider) ke desktop dashboards** web pe hain. Seller apne products/orders yaha manage karta hai, admin poore platform ko yaha se control karta hai, rider (delivery) yaha se bhi kaam kar sakta hai.

```
web/ ke 3 portals:
┌──────────────┬────────────────────────────────────────────┐
│ /admin/*     │ Admin + Super Admin — poora platform control │
│ /seller/*    │ Seller — apne products, orders, wallet       │
│ /delivery/*  │ Rider — deliveries, earnings, offers         │
└──────────────┴────────────────────────────────────────────┘
```

---

## ⚠️ WHERE — "Yeh woh Next.js nahi hai jo aap jaante ho"

`web/AGENTS.md` clearly warn karta hai: yeh **Next.js 16** hai, jo **breaking changes** waala version hai. Kuch cheezein alag hain:

1. **`basePath: "/web"`** (`next.config.ts` mein). Iska matlab:
   - Saare routes production mein `/web/admin/...` pe serve hote hain.
   - Par `usePathname()` basePath **strip** kar deta hai — isliye code mein `/admin/...` dikhta hai.
   - Yeh subtle hai. Debugging mein yaad rakho: URL mein `/web` hoga, code mein nahi.

2. **`proxy.ts`** — Next 16 mein purana "middleware" ab **"proxy"** kehlata hai. Yeh route guard ka kaam karta hai.

3. **`output: "standalone"`** — Docker ke liye self-contained build banata hai.

> **Golden rule:** Naya code likhne se pehle `web/node_modules/next/dist/docs/` padho (AGENTS.md ki salaah). Purani Next.js knowledge yaha galat ho sakti hai.

---

## HOW — Routing structure (App Router)

```
web/src/app/
├── layout.tsx              ← root layout (providers wrap)
├── page.tsx                ← public landing page (/)
├── globals.css
├── admin/
│   ├── login/page.tsx       ← /admin/login
│   └── dashboard/
│       └── [section]/       ← /admin/dashboard/users, /orders, etc.
├── seller/
│   ├── login/page.tsx       ← /seller/login
│   ├── register/            ← /seller/register (onboarding: Google sign-in → unified application form → submitted)
│   └── dashboard/
│       └── [section]/       ← /seller/dashboard/products, etc. (gated on application status)
└── delivery/
    ├── login/page.tsx       ← /delivery/login
    ├── register/            ← /delivery/register (same unified onboarding flow as seller)
    └── dashboard/           ← /delivery/dashboard (gated on application status — same gate as seller)
```

**Pattern:** `app/` sirf **routing shell** hai (patli layer). Asli business logic `features/` mein hai. `[section]` dynamic routes bas ek panel component ko re-export karte hain.

```
app/admin/dashboard/[section]/page.tsx   (routing shell — patla)
        │  re-exports / renders
        ▼
features/dashboard/components/<SectionPanel>.tsx   (asli UI + logic)
```

---

## HOW — Auth flow (web)

### Login (role-based)

Web mein ek **`useRoleLogin` factory** hai jo har portal ke liye login hook banata hai. Har portal apne `allowedRoles` ke saath configure hota hai:

```
/admin/login    → allowedRoles: [ADMIN, SUPER_ADMIN]
/seller/login   → allowedRoles: [SELLER]
/delivery/login → allowedRoles: [DELIVERY]
```

Login ke baad token **Zustand store** mein persist hota hai (key: `admin-auth-storage` — localStorage). Yeh key `web/src/lib/axios.ts` bhi padhta hai token attach karne ke liye.

> **Note (verified):** Agar koi `USER` role (customer) web pe login kare, toh use **partner-onboarding** pe bhej diya jaata hai (kyunki customer ke liye web dashboard nahi hai).

### Login-time admin-verification gate (seller / delivery)

`useRoleLogin` aur `useRoleGoogleAuth` (in `web/src/features/auth/hooks/useAuth.ts`) shared helper `handleIncompletePartner` use karte hain. After a successful `POST /auth/login` (or `/auth/google`):

1. `setAuth(user, accessToken)` — Zustand mein auth state set.
2. `onboardingApi.status()` se latest application + partner profile pull.
3. Agar `partnerProfileOk` (`Seller` ya `DeliveryBoy` doc) **ya** latest application `APPROVED` hai → proceed to dashboard.
4. Warna toast dikhao (PENDING → info, REJECTED → error + `rejectionReason`, missing → generic) aur `router.replace(/seller/register | /delivery/register)`.

Yeh login hook + dashboard page **same `onboardingApi.status()`** padhte hain, so the two layers never disagree. Detail: [authentication.md → Admin verification gate](./../features/authentication.md#admin-verification-gate-login--dashboard).

### Partner register page — streamlined flow (`PartnerRegisterForm.tsx`)

`web/src/features/auth/components/PartnerRegisterForm.tsx` runs through a single streamlined onboarding flow without duplicate registration screens:

```
Phase 1: "auth"             ← Single "Continue with Google" button (no redundant email/password forms)
Phase 2: "application"      ← Unified onboarding form:
                               • Section 1: Business Profile (Seller) / Vehicle Details (Rider) + Required Mobile Number
                               • Section 2: Address & Location
                               • Section 3: Payout Bank Account & Government ID
                               • Section 4: Verification Documents Upload
Phase 3: "submitted"        ← "Application received — admin will review" success screen
```

**How phone and authentication work:**
1. Unauthenticated partners click **Continue with Google** on `/seller/register` or `/delivery/register`.
2. Once signed in, they immediately land on the application form (**Phase 2**).
3. The partner's **Mobile Number \*** is captured directly in Section 1 alongside business or vehicle fields (no phone taken before registration, no phone taken after registration).
4. Submitting the form validates the phone number (10 to 15 digits), updates the user's profile via `PATCH /users/profile`, and submits the application to `onboardingApi.apply()`.
5. The user transitions to **Phase 3 ("submitted")** and waits for admin approval before panel access is enabled. Normal customer accounts (`USER` role) are unaffected and phone remains optional for them.

### Route guard (proxy.ts)

`web/src/proxy.ts` — Next 16 proxy. Yeh **sirf cookie presence** check karta hai (JWT ka content nahi padhta, kyunki JWT mein role claim nahi hota):

```
proxy.ts logic:
  cookie "accessToken" hai?
    ├─ NAHI + protected route (/admin, /seller, /delivery)  → login pe redirect
    └─ HAAN + login page pe ho                              → dashboard pe redirect

  matcher: /admin/:path*, /seller/:path*, /delivery/:path*
```

> ⚠️ **CRITICAL:** `proxy.ts` **security boundary NAHI hai.** Woh sirf UX ke liye hai (login page dikhana ya na dikhana). Asli security **backend RBAC** karta hai (har API pe `verifyJWT` + role guard). Client-side guard ko kabhi security ke liye trust mat karo. Dekho [09_Authorization_RBAC.md](./../features/authorization-rbac.md).

---

## HOW — Data fetching (axios + React Query)

### axios (`web/src/lib/axios.ts`)

```
Config:
  baseURL: NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  withCredentials: true   (cookies bhejne ke liye)

Request interceptor:
  Zustand persist blob (admin-auth-storage) se token nikaal ke
  Authorization: Bearer <token> attach karta hai

Response interceptor (401 handling):
  ┌─────────────────────────────────────────────────────────┐
  │ 401 aaya + request _retry nahi thi?                       │
  │   ├─ 401 /auth/refresh-token se hi aaya?                  │
  │   │     → TERMINAL: token clear + login pe redirect       │
  │   └─ warna:                                                │
  │        → single-flight refresh (ek hi refresh call)       │
  │        → baaki concurrent 401s failedQueue mein wait      │
  │        → refresh success: naya token, saari queued retry  │
  └─────────────────────────────────────────────────────────┘
```

**Single-flight refresh** ka matlab: agar ek saath 5 requests 401 huin, toh sirf **1 refresh call** jaayegi, baaki 4 `failedQueue` mein ruk jaayengi aur naya token milne pe retry hongi. Yeh duplicate refresh calls se bachata hai.

### React Query

```
Component → useQuery/useMutation (React Query hook)
              │
              ▼
          api function (features/<domain>/api/*.api.ts)
              │
              ▼
          axios → server
```

- Query keys **namespaced** hain (jaise `["admin", "orders"]`, `["seller", "products"]`).
- Mutation success pe relevant query `invalidateQueries` hoti hai → automatic refetch.
- `QueryProvider` root layout (`app/layout.tsx`) mein wrap hota hai.

---

## HOW — Realtime (socket → cache invalidation)

`web/src/hooks/useFulfillmentRealtime.ts` socket events ko React Query cache invalidation se jodta hai:

```
socket event aaya (e.g. ORDER_STATUS_UPDATE)
        │
        ▼
useFulfillmentRealtime → queryClient.invalidateQueries(["orders"])
        │
        ▼
React Query automatic refetch → UI update (bina page reload)
```

`web/src/lib/socket.ts`:
```
SOCKET_URL: NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000"
getWebSocket(tokenOverride?)  ← token-keyed singleton
io(SOCKET_URL, {
  auth: { token },
  transports: ["websocket"],
  reconnectionAttempts: 8
})
```

Token change hone pe naya socket banta hai (token-keyed). `webSocketClient` object export hota hai: `{connect, disconnect, on, off, emit, isConnected}`.

Socket event names `web/src/constants/socketEvents.ts` mein hain — yeh server ke `server/src/constants/socketEvents.ts` ka **mirror** hai. Dono ko sync rakhna zaroori hai.

---

## WHO — Dashboard sections (kaun kya dekhta hai)

### Admin portal (`/admin/dashboard/[section]`)
22 sections — users, sellers, orders, products, categories, coupons, banners, malls, payouts, delivery/riders, CMS, backups, analytics, RBAC, app-config, refund-policies, etc. Har section ka apna panel component `features/dashboard/components/` mein hai.

### Seller portal (`/seller/dashboard/[section]`)
13 sections — products, orders, sub-orders, wallet/settlements, store settings, coupons, size charts (⚠️ dekho neeche), etc.

### Delivery portal (`/delivery/dashboard`)
5 tabs — active deliveries, offers, earnings, payouts, history.

**Gated on admin verification (added 2026-09-04):** the page reads `useDeliverySetupStatus()` (which calls `onboardingApi.status()`) and shows an "Application Under Review" / "Application Needs Attention" / "Rider Onboarding Required" screen instead of the live dashboard when the rider's application isn't `APPROVED` and no `riderProfile` exists. This mirrors the seller-dashboard pattern (see `SellerDashboardClient.tsx`) — a stale cookie or a manual role change can't leak a live dashboard to an unapproved rider.

---

## FLOW — Seller ek product add karta hai (end-to-end)

```
1. Seller /seller/dashboard/products pe jaata hai
2. "Add Product" → ProductForm khulta hai
3. Form submit → useMutation (React Query)
4. api function → axios POST /api/v1/products
      (Authorization: Bearer <seller token>)
5. Server: verifyJWT → isSeller → productController → productService
6. Product save (approvalStatus default "APPROVED" — auto-approve, turant live)
   ⚠️ Correction: schema default APPROVED hai (PENDING nahi). Moderation
   optional. Verified: product.model.ts. Dekho 07_Database.md + 10_Product_System.md.
7. Success → invalidateQueries(["seller","products"]) → list refetch
8. (Realtime) admin ko NEW product notification socket se
```

---

## DEPENDENCIES

- **Isse pehle:** [02_System_Architecture.md](./../getting-started/system-architecture.md)
- **Related:** [08_Authentication.md](./../features/authentication.md), [09_Authorization_RBAC.md](./../features/authorization-rbac.md), [06_API_Flow.md](././api-flow.md)
- **Mobile counterpart:** [05_Mobile_App.md](././mobile-app.md)

---

## RISKS

- ⚠️ **`proxy.ts` ko security samajhna** — yeh sabse badi galti. Woh sirf cookie presence check karta hai; asli guard backend RBAC hai.
- ⚠️ **basePath confusion** — `/web` prefix production mein hota hai, dev/code mein nahi. Redirects aur links likhte time yaad rakho.
- ⚠️ **Dual seller API layers** — `sellerManagement.api.ts` (admin ka seller-management) aur `sellerPanel.api.ts` (seller ka apna) overlap karte hain. Dekho 30_Tech_Debt.md.
- ⚠️ **socketEvents.ts sync** — web aur server ke event names manually sync rakhne padte hain. Ek jagah change kiya, doosri jagah bhoolna = silent break.

---

## IMPROVEMENTS

- `socketEvents.ts` ko ek shared package se import karna (abhi duplicate hai).
- Dual seller API layers ko consolidate karna.
- Seller size charts abhi admin-owned hain (seller UI throw karti hai) — yeh clarify/fix hona chahiye.

---

*Verified against web/ source (proxy.ts, lib/axios.ts, lib/socket.ts, features/ tree) + AGENTS.md + next.config.ts on 2026-08-01. Dashboard section counts comprehensive web agent analysis se.*
