# 01 — Folder Structure

> **Created:** 2026-08-01
> **File type:** Foundation doc
> **Padhne ka time:** ~20 min

---

## WHAT — Yeh doc kya cover karti hai?

Poore monorepo ki **har important folder ka matlab** — woh kyun exist karti hai, andar kya files hain, kaunsi files ek doosre se kaise baat karti hain, aur (sabse important) **kya safe hai edit karna aur kya nahi**.

---

## WHY — Folder structure samajhna kyun zaroori hai?

Kyunki QuickBihar ek **monorepo** hai jisme 3 **independent** apps hain (koi shared root workspace nahi — teeno ka apna `package.json`, apna `node_modules`). Agar aapko yeh pata nahi ki kaunsi cheez kaha rehti hai, toh aap galat jagah code likhoge ya kuch important tod doge.

Ek golden concept: **`common` vs `clothing` seam** (server mein). Yeh poore codebase ki sabse important design line hai.

---

## Root level structure

```
quickbihar.in/
├── server/                  ← Backend (Bun + Express + Mongoose)  ★ brain
├── web/                     ← Dashboards (Next.js 16)
├── mobile/                  ← Mobile app (Expo / React Native)
├── nginx/
│   └── default.conf         ← Production reverse-proxy routing (LIVE config)
├── deploy/
│   ├── nginx/quickbihar.path-based.conf   ← alternate path-based nginx
│   └── README.md            ← deployment notes
├── docs/
│   ├── developers-docs/     ← YEH docs (aap yaha ho)
│   ├── ARCHITECTURE_AND_FLOWS.md    ← purani architecture doc
│   ├── LAUNCH_READINESS.md
│   ├── TRD.md               ← Technical Requirements Doc
│   └── WIRE-FLOW-AUDIT-TODO.md   ← ★ audit + fix history (bahut important)
├── docker-compose.yml       ← saari services orchestrate karne ke liye
├── readme.md                ← main project readme
├── readme-hinglish.md       ← Hinglish readme
├── rule.md                  ← ★ refactoring rules (class→function convention)
└── .github/workflows/
    └── docker-ci-cd.yml     ← CI/CD pipeline
```

### ⚠️ Kya NEVER modify karein (root level)

| File/Folder | Kyun |
|-------------|------|
| `rule.md` | Yeh codebase ka refactoring contract hai (class-based → function-based). Naye backend modules isi convention mein likhne hain. Padho, tod-mat. |
| `nginx/default.conf` | Yeh production routing hai. Galat edit = 502 Bad Gateway, poora site down. |
| `.github/workflows/docker-ci-cd.yml` | Yeh auto-deploy karta hai `master` pe push hote hi. Careful. |
| `docs/WIRE-FLOW-AUDIT-TODO.md` | Yeh saari audit findings + fixes ka record hai. Reference ke liye, casually mat badlo. |

---

## SERVER — `server/` structure

Yeh sabse important app hai. Iska structure:

```
server/
├── Dockerfile               ← Bun image, port 8000
├── package.json             ← deps (Express 5, Mongoose 9, BullMQ, etc.)
├── tsconfig.json            ← path alias: @/* → src/*
├── bun.lock
├── quickbihar-firebase-adminsdk-*.json   ← ★ Firebase service account (SECRET!)
└── src/
    ├── server.ts            ← ★ ENTRY POINT (http server + socket + workers)
    ├── app.ts               ← Express app (middleware chain + 25 routers)
    ├── config/
    │   ├── env.config.ts     ← ★ Zod-validated env (invalid = process.exit(1))
    │   ├── db.ts             ← MongoDB connect
    │   ├── redis.config.ts   ← Redis connection
    │   └── imagekit.config.ts ← ImageKit client config
    ├── constants/
    │   └── socketEvents.ts   ← ★ saare socket event names (single source)
    ├── db/                   ← seed data (JSON) + seed/migration scripts
    │   ├── rbacSeed.ts       ← roles + permissions seed
    │   ├── importData.ts     ← DB import script
    │   ├── backfillSellerSettlements.ts
    │   ├── syncSellerEarningIndexes.ts
    │   ├── repairPartnerRoles.ts
    │   └── quickbihar.*.json ← sample/seed data dumps
    ├── seed/
    │   └── seed.ts           ← main seeder (server.ts mein commented out)
    ├── middlewares/          ← ★ Express middlewares (dekho neeche)
    ├── utils/                ← ★ helpers (ApiError, ApiResponse, etc.)
    ├── _tests_/              ← Bun tests (auth, rbac, onboarding, settlements, return)
    ├── debug_notifications.ts ← ad-hoc debug script
    ├── debug_seller.ts        ← ad-hoc debug script
    └── modules/              ← ★★★ SAARA business logic yaha hai
        ├── common/           ← vertical-agnostic modules (23 folders)
        └── clothing/         ← clothing-only modules (products, sizeChart)
```

### `server/src/middlewares/` — Express middlewares

| File | Kaam |
|------|------|
| `auth.middleware.ts` | `verifyJWT` (token verify + user attach), `isAdmin`/`isSeller`/`isDelivery` role guards |
| `error.middleware.ts` | `errorHandler` — global error → JSON response (app.ts mein last) |
| `logger.middleware.ts` | Request logging |
| `multer.middleware.ts` | File upload (memory storage, 15MB, image-only) |
| `responseExtensions.middleware.ts` | `res` object pe custom helper methods add karta hai |
| `validate.middleware.ts` | Zod schema validation middleware |

Detail: [18_Error_Handling.md](./18_Error_Handling.md), [08_Authentication.md](./08_Authentication.md).

### `server/src/utils/` — Helpers

| File | Kaam |
|------|------|
| `ApiError.ts` | Custom error class (`statusCode`, `errors[]`) |
| `ApiResponse.ts` | Standard success response wrapper |
| `asyncHandler.ts` | Async route wrapper (`.catch(next)`) |
| `geo.util.ts` | Haversine distance, GeoJSON helpers |
| `imagekit.util.ts` | Upload/delete images to ImageKit |
| `mail.service.ts` | Email bhejne ke liye (Resend) |
| `razorpay.util.ts` | Razorpay client + signature verify |

### ★ `common` vs `clothing` — Sabse important seam

```
modules/
├── common/     ← "Yeh sab verticals ke liye hai"
│               (order, payment, user, auth, delivery, rider matching,
│                notification, seller, store, cart, coupon, etc.)
│
└── clothing/   ← "Yeh SIRF clothing ke liye hai"
                 (products [size/color variants], sizeChart)
```

**Rule of thumb:**
- Agar koi cheez **har business type** ke liye same hai (order kaise place hota hai, payment kaise hota hai, rider kaise match hota hai) → **`common/`**.
- Agar koi cheez **sirf clothing** ke liye specific hai (size charts, apparel variants) → **`clothing/`**.

Naya vertical (jaise food) add karte time yeh distinction hi aapko bachaayegi. Dekho [28_Add_New_Business_Type.md](./28_Add_New_Business_Type.md).

### `modules/common/` ke 23 folders

| Folder | Kya karta hai |
|--------|--------------|
| `admin` | Admin dashboard ke saare operations (users, malls, payouts, CMS, backups...) |
| `appConfig` | Global app configuration (shipping rules, commission, delivery rules) |
| `auth` | Login, register, OTP, refresh token, logout |
| `banner` | Home screen promotional banners |
| `cart` | Shopping cart |
| `category` | Product categories |
| `coupon` | Discount codes |
| `delivery` | ★ Rider fulfillment + rider matching engine + payouts |
| `deliveryBoy` | Rider profile model (`DeliveryBoy`) |
| `fulfillment` | ★ FulfillmentEvent (durable event feed) + ReturnRequest |
| `label` | Shipping labels (PDF/barcode) |
| `mall` | Seller malls (groups of sellers) |
| `notification` | ★ Push notifications (BullMQ worker + FCM/Expo + outbox) |
| `onboarding` | Seller/rider application + document upload |
| `order` | ★★ Order + SubOrder + pricing engine + fulfillment |
| `paymentMethod` | Saved payment methods |
| `rbac` | ★ Roles, Permissions, RolePermission + middleware |
| `refundPolicy` | Return/refund policies |
| `savedAddress` | Customer addresses |
| `seller` | ★ Seller profile + wallet + settlement ledger |
| `socket` | ★ Socket.IO service (realtime rooms) |
| `store` | ★ Store model + serviceability (geo/pincode) |
| `user` | ★ User identity model + token generation |
| `wishlist` | Customer wishlist |

### Ek module ke andar kya hota hai? (Standard layout)

`order` module ko example lo — yeh standard backend module structure hai:

```
order/
├── order.model.ts        ← Mongoose schema (Order)
├── order.type.ts         ← TypeScript types + enums (OrderStatus, DeliveryStatus)
├── order.dao.ts          ← Data Access Object (DB queries)
├── order.service.ts      ← ★ Business logic (yaha asli kaam hota hai)
├── order.controller.ts   ← HTTP handlers (req/res)
├── order.router.ts       ← Route definitions (URL → controller)
├── order.validator.ts    ← Zod validation schemas
├── orderPricing.service.ts ← pricing engine (hybrid marketplace)
├── subOrder.model.ts     ← SubOrder schema (per-seller split)
├── subOrder.service.ts   ← rider payout calc, sub-order logic
├── timeline.helper.ts    ← timeline event builder
└── returnEligibility.ts  ← return window check
```

**Execution order (jab request aati hai):**
```
router → (middleware: verifyJWT, role guard) → controller → service → dao → model → MongoDB
                                                    ↓
                                          validator (Zod) request check karta hai
```

Yeh **layered architecture** hai. Detail: [04_Backend.md](./04_Backend.md).

> **Note:** Sab modules mein saari files nahi hoti. Chhote modules mein sirf `model + service + controller + router` ho sakta hai. Yeh normal hai.

### `modules/clothing/` ke 2 folders

| Folder | Kya |
|--------|-----|
| `products` | Product model (size/color variants), product DAO/service/controller — **poore catalog ka core** |
| `sizeChart` | Size charts (clothing-specific measurement tables) |

---

## WEB — `web/` structure

Next.js 16 App Router. **Feature-first** architecture.

```
web/
├── Dockerfile               ← node:20-alpine, standalone build, port 3000
├── next.config.ts           ← basePath: "/web", output: standalone
├── components.json          ← shadcn config
├── AGENTS.md                ← ⚠️ "This is NOT the Next.js you know" warning
└── src/
    ├── proxy.ts             ← ★ Next 16 "proxy" (route guard, cookie presence)
    ├── app/                 ← App Router (routing shell)
    │   ├── layout.tsx        ← root layout (QueryProvider + SocketListener + Toaster)
    │   ├── page.tsx          ← public landing page
    │   ├── globals.css
    │   ├── admin/            ← /admin/login, /admin/dashboard/[section]
    │   ├── seller/           ← /seller/login, /register, /dashboard/[section]
    │   └── delivery/         ← /delivery/login, /register, /dashboard
    ├── features/            ← ★ feature modules (business logic)
    │   ├── auth/             ← login forms, auth store, schemas, hooks
    │   ├── dashboard/        ← admin dashboard (api, components, hooks, utils)
    │   ├── seller/           ← seller dashboard
    │   ├── delivery/         ← delivery dashboard
    │   └── onboarding/       ← partner registration
    ├── components/
    │   ├── landing/          ← landing page sections (Hero, Features...)
    │   ├── providers/        ← QueryProvider, SocketListenerProvider
    │   └── ui/               ← shadcn UI components
    ├── hooks/
    │   └── useFulfillmentRealtime.ts   ← socket-driven cache invalidation
    ├── lib/
    │   ├── axios.ts          ← ★ HTTP client (auth interceptor + silent refresh)
    │   ├── socket.ts         ← ★ Socket.IO client (token-keyed singleton)
    │   └── utils.ts          ← cn() + helpers
    └── constants/
        └── socketEvents.ts   ← socket event names (server ke mirror)
```

### `web/src/features/<domain>/` layout

Har feature ka standard structure (dashboard example):
```
dashboard/
├── api/         ← axios calls (adminManagement.api.ts, catalogManagement.api.ts)
├── hooks/       ← React Query hooks (useAdminManagement.ts, etc.)
├── components/  ← UI panels (OrderManagementPanel, ProductManagementPanel...)
└── utils/       ← helpers
```

**Data flow (web):**
```
Component → React Query hook → api function → axios → server /api/v1/*
                ↑
        socket event → invalidateQueries → refetch
```

Detail: [03_Frontend.md](./03_Frontend.md).

### ⚠️ Web mein kya dhyan rakhein

- `next.config.ts` mein `basePath: "/web"` hai. Iska matlab saare routes actually `/web/admin/...` pe serve hote hain, par `usePathname()` basePath strip kar deta hai (isliye code mein `/admin/...` dikhta hai). Yeh subtle hai — debugging mein yaad rakho.
- `AGENTS.md` warn karta hai: yeh Next.js ka **breaking-changes** version hai. Naya code likhne se pehle `node_modules/next/dist/docs/` padho.

---

## MOBILE — `mobile/` structure

Expo SDK 56, expo-router (file-based routing), React Native 0.85.

```
mobile/
├── Dockerfile               ← mobile-web static build (nginx serves it)
├── app.json                 ← Expo config
├── eas.json                 ← EAS build profiles (dev/preview/prod)
├── google-services.json     ← ★ Firebase config (FCM)
├── babel.config.js, metro.config.js
├── app/                     ← ★ expo-router screens (file = route)
│   ├── _layout.tsx           ← root layout
│   ├── index.tsx             ← entry redirect
│   ├── Onboarding/           ← onboarding slides
│   ├── auth/                 ← login/register/OTP
│   ├── (tabs)/               ← ★ tab navigator
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── clothing/         ← home, cart, search, account, admin, rider tabs
│   ├── account/              ← addresses, orders, wishlist, profile, notifications
│   ├── admin/                ← admin screens (products, categories, coupons...)
│   ├── rider/                ← rider workspace
│   ├── product/[id].tsx      ← product detail
│   ├── mall/                 ← mall list + detail
│   ├── checkout.tsx          ← ★ checkout screen
│   ├── order-success.tsx
│   ├── track-order/[id].tsx  ← live order tracking
│   ├── food/                 ← ⚠️ placeholder only
│   └── jewelery/             ← ⚠️ placeholder only
└── src/
    ├── api/
    │   └── axiosInstance.ts   ← ★ HTTP client (SecureStore token + refresh)
    ├── lib/
    │   ├── socket.ts          ← ★ Socket.IO client
    │   ├── authStorage.ts     ← SecureStore wrapper (web fallback to localStorage)
    │   └── notification.ts    ← Expo push registration + FCM token
    ├── store/                 ← Zustand stores (toast, socket, module switcher)
    ├── provider/              ← QueryProvider, SafeViewWrapper
    ├── context/               ← ScrollContext
    ├── constants/             ← tabs, modules
    ├── theme/                 ← colors, spacing, themed components
    ├── components/            ← shared UI (Skeleton, Toast, etc.)
    ├── hooks/
    ├── utils/                 ← validation
    ├── shims/                 ← expo-haptics web shim
    ├── __tests__/             ← Jest tests
    └── features/             ← ★ feature modules
        ├── clothing/          ← home, product, search, sizeChart
        ├── common/            ← account, address, admin, auth, banner, cart,
        │                        category, coupon, notification, order,
        │                        profileInfo, refundPolicy, trackOrder, wishlist
        ├── Delivery/          ← rider components + screens
        ├── Onboarding/        ← onboarding slides
        ├── Food/              ← ⚠️ placeholder screen
        └── Jewelery/          ← ⚠️ placeholder screen
```

### `mobile/src/features/<domain>/` layout

Standard (order example):
```
common/order/
├── api/         ← order.api.ts (createOrder, quote, verify...)
├── screen/      ← CheckoutScreen, OrderListScreen, OrderSuccessScreen
├── config/      ← razorpay.config.ts
├── lib/         ← openRazorpayCheckout (native + web variants)
└── style/       ← styles
```

Detail: [05_Mobile_App.md](./05_Mobile_App.md).

### ⚠️ Mobile mein kya dhyan rakhein

- `food/` aur `jewelery/` folders **placeholder** hain — inme koi real feature nahi. Confuse mat ho.
- Token storage: mobile mein **SecureStore** use hota hai (web mein localStorage) via `authStorage.ts`.

---

## WHO — Kaun kaunse folder chhuता hai?

| Developer type | Zyadatar yaha kaam karega |
|----------------|--------------------------|
| Backend dev | `server/src/modules/`, `server/src/middlewares/`, `server/src/utils/` |
| Web/dashboard dev | `web/src/features/`, `web/src/components/` |
| Mobile dev | `mobile/app/`, `mobile/src/features/` |
| DevOps | `docker-compose.yml`, `nginx/`, `.github/workflows/`, `Dockerfile`s |

---

## FLOW — Ek nayi cheez add karni ho toh kaha jaaun?

```
Naya API endpoint?          → server/src/modules/<module>/*.router.ts + controller + service
                              (guide: 26_Add_New_API.md)
Naya backend module?        → server/src/modules/common/<newModule>/
                              (guide: 27_Add_New_Module.md)
Naya dashboard screen?      → web/src/features/<domain>/components/
Naya mobile screen?         → mobile/app/<route>.tsx + mobile/src/features/
Naya vertical (food)?       → dono common + clothing pattern follow karo
                              (guide: 28_Add_New_Business_Type.md)
```

---

## DEPENDENCIES

- **Isse pehle:** [00_Project_Overview.md](./00_Project_Overview.md)
- **Iske baad:** [02_System_Architecture.md](./02_System_Architecture.md)
- **Deep dives:** [04_Backend.md](./04_Backend.md), [03_Frontend.md](./03_Frontend.md), [05_Mobile_App.md](./05_Mobile_App.md)
- **Full file map:** [21_Codebase_Map.md](./21_Codebase_Map.md)

---

## RISKS

- ⚠️ **Teeno apps ka apna `node_modules` hai.** Ek app mein package install karne se doosre pe koi asar nahi. Har app mein alag se `bun install`/`npm install` karo.
- ⚠️ **`common`/`clothing` seam agar galat samjha** toh aap clothing-specific code `common` mein daal doge (ya ulta), jo future multi-vertical work ko tod dega.

---

## IMPROVEMENTS

- Server modules mein consistency laana (kuch modules mein DAO hai, kuch mein nahi).
- Web mein `sellerManagement.api.ts` aur `sellerPanel.api.ts` overlap karte hain — consolidate karna chahiye (dekho [30_Tech_Debt.md](./30_Tech_Debt.md)).

---

*Verified against actual directory listings on 2026-08-01 (server modules, web/src, mobile/app + src trees sab `ls` se confirm kiye).*
