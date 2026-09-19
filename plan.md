# Quick Bihar Web + Mobile SEO Implementation Plan

> **ADDENDUM (19 Sep 2026):** Is audit ke baad jewelery vertical live ho gaya — mock data purge, real catalog/cart/wishlist/checkout/auth (`vertical=JEWELERY`), strict BIS validation, 8 seeded categories, dash-web catalog tabs. Niche jaha "jewelery mock/placeholder/noindex" likha hai, woh 9 Sep ki position hai; current status `docs/mobile-heavy-packages-jewelry-catalog-audit-2026-09-19.md` (Sec 15, 20) me hai. SEO index-faisla (jewelry pages noindex rakhe ya khole) ab real data ke saath dobara evaluate karna chahiye.

> **PLAN ONLY — DO NOT IMPLEMENT.** No code was changed to produce this plan. Stop after reviewing and wait for explicit approval.
> Generated: 2026-09-09 from direct codebase reads (mobile/ + server/ + web/ + vps-nginx/ + docker-compose.yml + docs/).

---

## 1. Executive Summary

**FACT:** QuickBihar.in is NOT a single Expo app. It is a three-app monorepo (verified `readme.md:49-59`, `docker-compose.yml`, `DEPLOYMENT_GUIDE.md`):

| App | Dir | Serves | Domain (verified `vps-nginx/quickbihar.conf`, `docker-compose.yml`) |
|---|---|---|---|
| Customer storefront + rider workspace | `mobile/` (Expo SDK 56 + expo-router 56.2.9, RN 0.85, React 19) | static SPA via nginx | `https://quickbihar.in` → `127.0.0.1:7001` |
| Admin/seller/delivery dashboard | `web/` (Next.js 16 App Router) | SSR/SSG Node server | `https://dashboard.quickbihar.in` → `127.0.0.1:3002` |
| API + realtime | `server/` (Bun + Express 5 + Mongoose 9 + Socket.IO + BullMQ) | JSON API | `quickbihar.in/api/v1` + `dashboard.quickbihar.in/api/v1` → `127.0.0.1:5002` |

**FACT:** The Expo web build is currently **SEO-hostile**: `mobile/app.json:34-37` sets `web.output: "single"` (one `index.html` SPA shell), 100% client-side data fetching (`src/api/axiosInstance.ts` + TanStack Query + `useEffect`), zero per-route `<title>`/meta/OG/canonical/JSON-LD, no `+html.tsx`, no `+not-found.tsx`, no `generateStaticParams`, dynamic routes use opaque Mongo IDs (`app/product/[id].tsx`, `app/mall/[id].tsx`).

**FACT:** The backend already stores SEO-ready data but does not expose it for crawling: `Product.slug` (unique) + `Product.seo{metaTitle,metaDescription,keywords}` + `Category.seo` + `Store.seo` + `AppConfig.seo` + `CMSPage/BlogPost.seo` exist in Mongoose models, and `GET /api/v1/products/slug/:slug` already exists — but the mobile app only links `/product/:id`, category detail is id-only, mall detail is id-only, and CMS/blog/FAQ have **no public GET** (admin-only).

**RECOMMENDATION (minimal, no rewrite):** Keep the architecture. Make `quickbihar.in` SEO-capable with targeted changes:

1. `mobile/`: `single` → `static` output + `generateStaticParams` for a small set of indexable routes + a shared `Head`/metadata helper + human-readable slug URLs with id→slug redirects + `+not-found.tsx` + noindex guards on private routes.
2. `server/`: add slug lookups for category + mall, add public read endpoints for published CMS/blog/FAQ/policies, add `GET /sitemap.xml` + `GET /robots.txt` (or serve via nginx), add pagination caps + sitemap-friendly list endpoints.
3. Deploy/nginx: keep host split (apex → Expo, `dashboard.` → Next, `/api/` → Bun); add long-cache headers for `/_expo/`, correct SPA→static fallback, `www`→apex 301 (already present — verify), HTTPS/HSTS (already present — verify).
4. `web/` (dashboard): explicitly **noindex** all `/admin|/seller|/delivery|/auth` (add per-page `robots noindex` + keep `robots.ts` disallow); keep only `/`, legal pages indexable on the dashboard host.

**ASSUMPTION (needs validation):** Production Mongo contains ≥ dozens of approved/active products with usable `title/description/images/price`; `EXPO_PUBLIC_API_ORIGIN=https://quickbihar.in` is reachable at Expo static-export build time; team accepts a rebuild-on-publish cadence (no ISR/server in Expo static).

**What explicitly NOT to do:** Do NOT rewrite in Next.js, do NOT build a separate marketing site, do NOT index cart/checkout/orders/accounts/rider/auth, do NOT add PWA/i18n/analytics beyond the minimal items in §32/§33.

---

## 2. Actual Product Understanding

**FACT (from `readme.md:3-7,32-44`, `docs/developers-docs/`, route + model reads):**

- QuickBihar is a **hyperlocal, multi-vertical marketplace**: local stores sell to nearby customers; independent riders do last-mile delivery. Everything is **location-first** (pincode/GPS → serviceability check → only serviceable stores' products shown).
- Live vertical: **clothing/apparel** (`server/src/modules/clothing/`, `mobile/src/features/clothing/`, `mobile/app/(tabs)/clothing/*`). `food/` and `jewelery/` are scaffolded placeholders/roadmap, except `mobile/app/jewelery/**` which is a **mock-data demo** (local `data/products.ts`, `AsyncStorage jewelery_cart`, isolated `AuthContext`) — not backed by real catalog APIs.
- Core flow: discovery → cart → quote → Razorpay order → payment verify (stock deducted + per-seller **sub-orders** created only at verify) → rider broadcast → accept → pickup OTP → transit → deliver OTP → returns (window-gated) → Razorpay refund.
- Roles (`server/src/modules/common/rbac/rbac.types.ts`, `mobile/src/features/common/auth/store/authStore.ts`): `USER` (customer, mobile storefront), `SELLER` (web seller dashboard), `DELIVERY` (rider; `"RIDER"` is a legacy alias, not a separate role), `ADMIN`/`SUPER_ADMIN` (web admin dashboard). Post-login landing is role-based (`getRoleLandingRoute`).

**FACT — actual entities with real content (from models + public GETs):** `Product` (clothing, with variants/size/color/price/stock/ratings/reviews), `Category` (taxonomy, `slug` unique), `Mall` (shopping-mall directory with products + reviews), `Store` (seller storefronts, geo-indexed, no slug), `Banner` (transient promos), `Coupon` (transient), `Review/MallReview` (UGC), `CMSPage/BlogPost/FAQ/FlashSale` (exist in `adminFull.model.ts` but admin-only routes), `Order/SubOrder` (private transactional), `RefundPolicy/AppConfig` (policy/global meta).

**RECOMMENDATION:** SEO strategy follows this reality: index **products + categories + malls** (+ policy/legal/CMS only if/when given public routes). Everything location-personalized, cart/order/account/rider/auth-gated stays out of the index. Jewelery mock pages and food stubs get **noindex** until backed by real published data.

**ASSUMPTION:** Target searcher is a Bihar-local apparel shopper (city/pincode-qualified discovery). Validate with real order/pincode distribution before investing in programmatic city pages.

---

## 3. Current Repository Architecture

**FACT — inventory (top-level, verified by directory read):**

```text
Frontend:
- mobile/app/** — Expo Router routes (58 files; see §5)
- mobile/src/api/axiosInstance.ts — single Axios client (EXPO_PUBLIC_API_ORIGIN + /api/v1, JWT refresh queue)
- mobile/src/provider/QueryProvider.tsx — persisted TanStack Query (gcTime 24h, staleTime 5m)
- mobile/src/features/common/auth/store/authStore.ts — Zustand auth + RoleEnum + getRoleLandingRoute
- mobile/src/features/clothing/product/**, mobile/src/features/clothing/home/** — SEO-critical product/mall hooks+API+ screens
- mobile/src/features/Jewelery/** — mock-data vertical (local data/products.ts, CartContext, AuthContext)
- mobile/Dockerfile — bun build:web → nginx:alpine static SPA (try_files /index.html)
- mobile/app.json — web.output:single, scheme QuickBihar, EAS projectId, Google OAuth IDs

Backend:
- server/src/app.ts — Express 5 app (helmet/CORS/cookies/16kb parsers), 24 router mounts, health endpoints
- server/src/server.ts — Bun entry (connectDB, seeds, matchingService, notification worker)
- server/src/modules/clothing/products/** — product.router/controller/service/dao/model (+review.model)
- server/src/modules/common/category|store|mall|banner|coupon|seller|order|delivery|cart|wishlist|admin|auth|rbac|appConfig|refundPolicy|user|savedAddress|... — one folder per domain
- server/src/config/env.config.ts — Zod fail-fast env validation
- server/src/middlewares/auth.middleware.ts, rateLimit.middleware.ts — JWT/RBAC + 10/min, 5/min, 6/10min limiters

Dashboard:
- web/src/app/** — Next.js 16 App Router (/admin, /seller, /delivery, /auth/*, /, legal pages)
- web/src/proxy.ts — Next 16 cookie route guard (NOT a security boundary; backend enforces)
- web/src/app/robots.ts — allow / + disallow /admin /seller /delivery /api (no sitemap ref)
- web/src/app/layout.tsx, page.tsx, */page.tsx — only metadata in the repo
- web/Dockerfile — 3-stage node:20-alpine → .next/standalone server.js :3000

Deploy/docs:
- docker-compose.yml — redis :internal, server 127.0.0.1:5002:8000, web 127.0.0.1:3002:3000, mobile-web 127.0.0.1:7001:80
- vps-nginx/quickbihar.conf — host Nginx TLS + apex/www/dashboard split + /api /socket.io /_expo /_next routing
- .github/workflows/docker-ci-cd.yml — push to master/main → build 3 images → self-hosted runner deploy
- docs/developers-docs/ (19 files, current truth) + docs/archive/ (pre-auth-redesign, archived 2026-09-04 per docs/archive/README.md)
- readme.md, DEPLOYMENT_GUIDE.md, rule.md (server class→function refactor rules)
```

**FACT — discrepancy the prompt did not anticipate:** the prompt describes "the existing Expo application" as if it were the whole product. The repo is a monorepo where Expo is only the storefront surface. All SEO recommendations below respect the real three-service deployment instead of treating Expo as standalone.

---

## 4. Current Expo/Web Configuration

**FACT (verified `mobile/app.json`, `mobile/package.json`, `mobile/metro.config.js`, `mobile/babel.config.js`, `mobile/tsconfig.json`, `mobile/Dockerfile`):**

- `expo ^56.0.0`, `expo-router ~56.2.9`, `react-native-web ~0.21.0`, `react 19.2.3`, `react-dom 19.2.3`.
- `web.output: "single"` — the ONLY web key besides `favicon`. No `bundler`, no `baseUrl`, no `metadata{title,description,lang,themeColor}`, no `router`, no `preferStatic`.
- `build:web: npx expo export --platform web` → `mobile/dist/` (`index.html + metadata.json + _expo/ + assets/ + favicon.ico`).
- Metro: default expo config + `unstable_enablePackageExports` + `webm/lottie` assets + web shim for `expo-haptics` (`src/shims/expo-haptics.web.ts`).
- Babel: `babel-preset-expo` + production `transform-remove-console{exclude:error,warn}`.
- TS: `extends expo/tsconfig.base`, `strict:true`, `moduleSuffixes [.native,.web,""]`, `paths @/* → ./*`.
- No `app.config.js|ts`, no `+html.tsx`, no `+not-found.tsx`, no `unstable_settings`, no `generateStaticParams` anywhere.
- Dockerfile serves `dist/` via nginx with `try_files $uri $uri/ /index.html` — correct for `single`, wrong for `static` (must change together with output mode).

**RECOMMENDATION:** Change `web.output` to `"static"` (per-route HTML prerender) as the SEO enablement switch. This is the one config change that unlocks crawlable HTML; everything else (metadata helper, `generateStaticParams`, noindex guards) builds on it. Keep Metro/babel/tsconfig as-is.

**ASSUMPTION:** Expo SDK 56 static export supports the routes used here (Stack + Tabs, no API routes needed). Validate with a local `npx expo export --platform web` smoke test before committing to the mode change (§30 deployment plan step 1–2).

---

## 5. Current Routing Architecture

**FACT — all 58 files under `mobile/app/` (verified by find):**

```text
- app/_layout.tsx — root Stack(headerShown:false) + providers (SafeArea/Query/Theme/Sheets/Socket/Toast) + initializeAuth + configureGoogleSignIn + web-only <style> shell
- app/index.tsx — module dispatcher: useModuleStore isHydrated → Redirect activeModule.route (default /(tabs)/clothing/home)
- app/(tabs)/_layout.tsx — Stack(index, clothing)
- app/(tabs)/index.tsx — Redirect /(tabs)/clothing
- app/(tabs)/clothing/_layout.tsx — Tabs(home, search, cart, account + hidden rider + hidden checkout)
- app/(tabs)/clothing/home.tsx → HomeScreen(rootSlug=clothing) — PUBLIC shopping home
- app/(tabs)/clothing/search.tsx → SearchHeader + router.push /product/[id] — PUBLIC discovery
- app/(tabs)/clothing/cart.tsx — PUBLIC shell, auth deferred to checkout — TRANSACTIONAL
- app/(tabs)/clothing/checkout.tsx (href:null hidden) → CheckoutScreen — AUTH-expected — TRANSACTIONAL
- app/(tabs)/clothing/account.tsx — soft-guarded (login CTA if !isAuthenticated) — AUTH
- app/(tabs)/clothing/rider.tsx — hard role guard (DELIVERY|RIDER else Redirect home) — AUTH+ROLE
- app/Onboarding/index.tsx → router.replace /auth — PUBLIC
- app/auth/{index,login,register,forgot-password,reset-password-confirm,legacy-email-capture}.tsx — PUBLIC auth flows
- app/account/_layout.tsx — Stack titles (addresses, address-form, wishlist, notifications, reset-password, set-password)
- app/account/{addresses,address-form,orders,wishlist,notifications,profile-info,reset-password,set-password}.tsx — AUTH
- app/checkout.tsx → CheckoutScreen — AUTH-expected — TRANSACTIONAL
- app/order/[id].tsx + app/order-detail.tsx → OrderDetailScreen (Bearer API) — AUTH TRANSACTIONAL
- app/order-success.tsx — AUTH TRANSACTIONAL
- app/track-order/[id].tsx — useEffect getOrderById + role + socket + Leaflet map — AUTH TRANSACTIONAL
- app/product/[id].tsx → ProductDetailScreen(useProductById GET /products/public, enabled !!id) — PUBLIC (key SEO candidate)
- app/mall/index.tsx (Stack.Screen title:Malls — the ONLY route title in the app) + app/mall/[id].tsx (usePublicMalls) — PUBLIC directory/detail
- app/top-selling.tsx → TopSellingScreen — PUBLIC listing
- app/food/index.tsx → FoodHomeScreen (stub reusing HomeHeader) — PUBLIC stub
- app/rider/index.tsx → RiderWorkspaceScreen (token API) — AUTH+ROLE
- app/jewelery/{index,(tabs)/index,collections,search,cart,wishlist,profile,account,try-on,product/[id]} + jewelery/auth/{sign-in,sign-up,otp,forgot-password,reset-password} — PUBLIC mock vertical (local data, AsyncStorage jewelery_cart/wishlist, isolated AuthContext)
```

**FACT — dynamic routes (5, all `[id]`, all `useLocalSearchParams()` CSR):** `app/product/[id].tsx`, `app/mall/[id].tsx`, `app/order/[id].tsx`, `app/track-order/[id].tsx`, `app/jewelery/product/[id].tsx`. No `[slug]`, no `[...segments]`.

**FACT — metadata today:** only `Stack.Screen options.title` in `app/mall/index.tsx` (`Malls`) and `app/account/_layout.tsx` (address titles). No `Head`/`Helmet`/`expo-router/head`, no `document.title` writes, no meta/OG/canonical/robots/JSON-LD, no `manifest.json` source.

**RECOMMENDATION:** Keep the route tree. Add: (a) `app/+not-found.tsx`, (b) slug-capable product route (keep `[id]` as compat redirect → canonical slug URL), (c) new public `category/[slug]` route (no such route exists today — required for taxonomy SEO), (d) mall slug support, (e) metadata helper used by every public route, (f) noindex guard on every auth/transactional route.

---

## 6. Public vs Private Route Classification

**FACT — classification from guard evidence (`authStore` + `<Redirect>`/`router.push` + `verifyJWT` on the APIs they call):**

```text
PUBLIC + INDEXABLE (after fixes):
- /(tabs)/clothing/home (+ /,(tabs)) — shopping home; needs static HTML + unique title/desc
- /(tabs)/clothing/search — discovery; indexable as listing hub (canonical without query)
- /product/[id] → migrate to /product/:slug — PDP; PRIMARY index target
- /mall, /mall/[id] → migrate detail to slug — directory/detail; index
- /top-selling — listing; index (canonical, no query)
- (NEW) /category/:slug — does not exist; required for taxonomy SEO

PUBLIC + NON-INDEXABLE (keep crawlable=false, no sitemap):
- /Onboarding, /auth/*, /jewelery/auth/* — thin/duplicate auth; noindex,nofollow
- /(tabs)/clothing/cart, /checkout, /(tabs)/clothing/checkout — transactional; noindex + no sitemap
- /food — stub; noindex until real catalog exists
- /jewelery/** (all, incl. jewelery/product/[id]) — mock data; noindex until backed by published API data

AUTHENTICATED / TRANSACTIONAL / USER-SPECIFIC (noindex,nofollow, no sitemap, must not leak into HTML):
- /account/* (8), /(tabs)/clothing/account, /order/[id], /order-detail, /order-success, /track-order/[id]
- /(tabs)/clothing/rider, /rider — role-gated rider workspace

DYNAMIC (id-based today → slug-based after §13):
- /product/[id], /mall/[id], /order/[id], /track-order/[id], /jewelery/product/[id]

STATIC (pre-renderable after static output):
- /, /(tabs), home, search, mall index, top-selling, product slug pages (bounded set), category slug pages, mall slug pages
```

**RECOMMENDATION:** Encode this table as the source of truth for `robots` directives + sitemap inclusion + `generateStaticParams` scope. Any new route must be classified here before it ships.

---

## 7. Current Backend/API Architecture

**FACT — mounts (`server/src/app.ts`, 24 routers) and public surface (verified per-router reads):**

```text
PUBLIC GET (no auth) — SEO-relevant:
- GET /api/v1/products/public (page,limit[NO MAX], search/vertical/category/subCategory/gender/brand/price flags/sortBy) — forces isActive+APPROVED+!deleted; returns _id+slug+title/desc/images/price/ratings/seo/timestamps
- GET /api/v1/products/trending, /local (requires pincode OR lat+lng), /slug/:slug, /:id, /:id/similar, /:id/reviews (paginated, APPROVED only, with stats distribution)
- GET /api/v1/categories/public (NO pagination, ?vertical only), GET /api/v1/categories/:id (ID ONLY, no slug route)
- GET /api/v1/stores/nearby (geo $near, radius default 5km), /serviceability, /:id (ID ONLY, no slug; 24-hex else 404)
- GET /api/v1/malls, /malls/top (hardcoded limit 100/10), /malls/:id (ID ONLY despite slug unique; returns mall+products[24]+reviews[50]+matchingMalls[5])
- GET /api/v1/banners (?placement, windowed isActive+APPROVED+dates) + POST /:id/click — transient, not indexable
- GET /api/v1/coupons/public/applicable — transient, not indexable
- GET /api/v1/size-charts/* (4 GETs, unintentionally public) — utility, not indexable
- GET /api/v1/app-config/ (singleton incl. seo{metaTitle,metaDescription,keywords}) — global meta source
- GET /api/v1/refund-policies/active, GET /api/v1/auth/config — policy/supporting
- PATCH /api/v1/users/fcm-token is PUBLIC (anomaly — see §33)

AUTH-ONLY (verifyJWT + role/permission) — never index:
- cart/*, wishlist/*, addresses/*, payment-methods/*, orders (quote/create/verify/me/:id/sub-orders/*), delivery/*, onboarding/*, seller/*, admin/*, rbac/*, notifications user/mutation, fulfillment Event list-mine, labels/:id
```

**FACT — known backend bugs/blockers found during audit:**

1. `GET /api/v1/stores/my-stores` is shadowed by earlier `GET /:id` (`:id` matches `my-stores`, regex throws 404) — effectively unreachable (`server/src/modules/common/store/store.route.ts`).
2. `generateAccessToken` hard-codes `expiresIn "1d"`, ignoring `ENV.ACCESS_TOKEN_EXPIRY` (`server/src/modules/common/user/user.model.ts`).
3. No `Cache-Control/ETag` on catalog; only RBAC 24h Redis cache + reset-token keys + in-memory rain cache; no catalog response cache.
4. No global rate limiter; catalog/sitemap endpoints uncapped (`?limit=10000` DoS-able on products/public); in-memory `express-rate-limit` only (no Redis store).
5. Admin CMS/blog/FAQ/flash-sale/announcement/warehouse/shipping have **zero public GET** — content exists but is uncrawlable.

**RECOMMENDATION:** Reuse existing public product/slug/category/mall/app-config endpoints for SEO rendering. Smallest backend deltas: slug lookups for category+mall, public published-content reads, sitemap/robots endpoints, pagination caps, catalog cache headers (§26).

---

## 8. Current Database/Data Architecture

**FACT — models with SEO-critical fields (all `timestamps:true` unless noted):**

- `server/src/modules/clothing/products/product.model.ts` → `Product`: `title req, slug req UNIQUE (slugify(title)+-+random36(5)), description, shortDescription, brand, category req, images[{url,fileId}] req, price/originalPrice req, variants[{size,color,price,stock,sku}] req, ratings{average,count}, tags[], seo{metaTitle,metaDescription,keywords}, vertical CLOTHING|FOOD|JEWELERY idx, isFeatured/isTrending/isNewArrival, isActive, isDeleted (soft-delete), approvalStatus DRAFT|PENDING|APPROVED|REJECTED (default APPROVED)`. Indexes incl. `{vertical,isActive,isDeleted,approvalStatus,createdAt}`, text `{title^10,category^5,subCategory^5,brand^3,tags^2,description}`.
- `review.model.ts` → `Review`: `productId+userId idx, rating 1-5, title≤120, comment≤2000 req, isVerifiedBuyer, status APPROVED|PENDING|REJECTED (default APPROVED)`.
- `server/src/modules/common/category/category.model.ts` → `Category`: `title UNIQUE req, slug UNIQUE lowercase req (no random suffix; dup → 400), image req, description?, parentId idx, vertical idx, isActive, isFeatured, seo{...}`. **Hard delete, no approvalStatus/isDeleted.**
- `server/src/modules/common/mall/mall.model.ts` → `Mall`: `name idx req, slug UNIQUE lowercase idx req, description, address{city...}, logoUrl/coverImageUrl/images[], rating, isFeatured idx, featuredRank, isActive idx, status PENDING|APPROVED|REJECTED (default APPROVED)` + `mallReview.model.ts`.
- `server/src/modules/common/store/store.model.ts` → `Store`: **NO slug.** `name, description, logoUrl/bannerUrl/storeImages[], type (StoreType) idx, address{pincode...}, seo{storeTitle,metaTitle,metaDescription}, currentLocation Point 2dsphere (default Patna coords), isOpen/isActive/isVerified`.
- `server/src/modules/common/banner|coupon/*` → transient (windows/limits, no slug).
- `server/src/modules/common/appConfig/appConfig.model.ts` → singleton `seo{...}` + policies/contact/social/appearance.
- `server/src/modules/common/admin/adminFull.model.ts` → `CMSPage{title,slug UNIQUE,content,excerpt,status DRAFT|PUBLISHED|ARCHIVED,isActive,seo,publishedAt}`, `BlogPost{...same + tags,isFeatured}`, `FAQ{question,answer,category,status}`, `FlashSale{name,slug UNIQUE,productIds,startsAt,endsAt,status}` — **all admin-only routes today**.
- Private: `User (email/phone unique, roleId, isBlocked)`, `Cart (userId unique, TTL 30d)`, `Wishlist ({userId,productId} unique)`, `SavedAddresses`, `PaymentMethod`, `Order/SubOrder`, delivery/rider, fulfillment events, notification device/outbox, onboarding applications.

**RECOMMENDATION:** No SEO-specific DB fields needed in v1 — generate titles/descriptions/OG from existing `title/slug/description/images/price/ratings/seo` + `AppConfig.seo` fallback. Only additive change worth considering later: `Product.canonicalSlug + slugHistory[]` if title-change URL churn proves real (§27).

---

## 9. Existing SEO Implementation

**FACT — exhaustive grep (`seo|meta|sitemap|robots|canonical|schema|json-ld|og:|twitter:|hreflang|generateMetadata|manifest`):**

- `web/`: `src/app/layout.tsx` (metadataBase `https://dashboard.quickbihar.in`, title template, description, canonical → dashboard host, OG without images), `src/app/page.tsx` (landing title/description), 3 legal pages (`robots:{index:true,follow:true}`), `src/app/robots.ts` (allow `/`, disallow `/admin/ /seller/ /delivery/ /api/`, **no `sitemap` field**). No `sitemap.ts`, no `manifest`, no `generateMetadata`, no JSON-LD. `web/public/` has only svg placeholders — no OG images.
- `mobile/`: **zero** SEO implementation (see §5). Only `app.json web.favicon` + `dist/favicon.ico` artifact + a non-standard `<meta viewport>` inside `LivingPixelOcean.tsx` canvas component.
- `server/`: SEO **data** only (per-model `seo{}` + slug generators in `products.service.ts`, `category.service.ts`, `admin.utils.ts uniqueSlugFor`, `seller.service.ts`), plus `GET /app-config` global seo. No `GET /sitemap.xml|/robots.txt|/rss|/feed`, no canonical headers; `express.static(public)` serves no SEO files.
- Docs: `docs/developers-docs/features/products.md:191` notes "slug random suffix — bookmarks/SEO links break (no redirect)" — confirms the redirect gap.

**RECOMMENDATION:** Do not duplicate `web/` dashboard metadata onto the storefront. Build storefront metadata fresh in `mobile/` (§15) and sitemap/robots in `server/` or nginx (§17–§18). Reuse the existing `seo{}` fields as content sources.

---

## 10. Existing Deployment Architecture

**FACT (verified `docker-compose.yml`, `mobile/Dockerfile`, `web/Dockerfile`, `server/Dockerfile`, `vps-nginx/quickbihar.conf`, `.github/workflows/docker-ci-cd.yml`, `DEPLOYMENT_GUIDE.md`):**

- Compose: `redis` (internal), `server 127.0.0.1:5002:8000`, `web 127.0.0.1:3002:3000`, `mobile-web 127.0.0.1:7001:80`; `quickbihar-network` bridge; all localhost-only.
- `mobile/Dockerfile`: `bun install → bun run build:web (expo export) → nginx:alpine` serving `/usr/share/nginx/html` with `try_files $uri $uri/ /index.html`; healthcheck `wget --spider :80/`.
- `web/Dockerfile`: 3-stage `node:20-alpine`, `ARG NEXT_PUBLIC_API_URL=/api/v1 NEXT_PUBLIC_SOCKET_URL=/`, `npm run build` → `.next/standalone + .next/static`, `node server.js :3000`.
- `server/Dockerfile`: `oven/bun:1`, `bun install --frozen-lockfile`, `CMD bun run src/server.ts :8000` (runs source, not `dist/`).
- Host nginx (`vps-nginx/quickbihar.conf`, 241 lines): `:80` ACME + `→https` 301; `:443 www` → apex 301; `:443 quickbihar.in` → `mobile-web:7001` (`/api/→:5002` 90s, `/socket.io/→:5002` 86400s, `/_expo/static/` + static-asset regex → 1yr immutable, `/` → SPA); `:443 dashboard.quickbihar.in` → `web:3002` (`/api/,/socket.io/` same, `/_next/` no cache header, `/` → dashboard). Security: HSTS preload, `X-Frame SAMEORIGIN`, `nosniff`, `Referrer strict-origin-when-cross-origin`, gzip lvl6. TLS via `vps-nginx/certs/`.
- CI: push `master|main` → build+push 3 images (`:prod`, `:<sha>`) → self-hosted `quickbihar` runner `rsync → compose pull → up -d --remove-orphans → prune`.
- Env: mobile prod `EXPO_PUBLIC_API_ORIGIN=https://quickbihar.in` (inlined at export); web prod `/api/v1` + `/` (same-origin); server CORS allowlist hardcodes both prod hosts + `ENV.CORS_ORIGIN` (live adds VPS IP + localhost/emulator hosts). Server env Zod fail-fast.

**FACT — stale docs:** `readme.md:56-58` still shows removed `deploy/+nginx/` layout and a `proxy :80` service; arch diagram shows single-domain path routing (`/mall|/product→Expo`, `/admin→Next`) which matches neither current compose nor `vps-nginx/quickbihar.conf` (subdomain split). Trust the config files, not the diagram.

**RECOMMENDATION:** Keep host split. Minimum deploy deltas: adjust inner nginx `try_files` for static output, add `/_expo/` + hashed-asset immutable caching parity on dashboard host, add `Cache-Control` for `/sitemap.xml|/robots.txt`, keep everything else.

---

## 11. SEO Opportunities Discovered

**FACT — ranked by (existing data × existing route × intent fit):**

1. **Product detail (PDP)** — `app/product/[id].tsx` + `GET /products/slug/:slug|/:id` + `seo{}` + reviews UGC. Highest intent ("buy <garment> in Patna"). Gap: id-URLs + CSR-only + no meta. Fix value: highest.
2. **Category hubs** — `Category` model has `slug+seo` but **no public route at all**. Gap blocks all taxonomy crawling. New `/category/:slug` route = highest leverage-per-effort after PDP.
3. **Mall directory** — `app/mall{,/index}` + `GET /malls|/top|:id` + `slug` in DB but id-only API/route. Local-intent queries ("malls in Patna/Gaya"). Fix: slug lookup + meta.
4. **Home / top-selling / search hubs** — already public; need static HTML + hub→PDP/category/mall internal links.
5. **Policy/support content** — `RefundPolicy/active`, `AppConfig` policies, `CMSPage/BlogPost/FAQ` (model-ready, route-blocked). Publish read-only GETs → trust + long-tail content.
6. **Images** — product/mall images exist but no alt text pipeline; `expo-image` used in only 8 files; most PDP images are RN `Image`/FlashList with placeholder fallbacks.

**RECOMMENDATION:** Phase 1 = PDP + category + mall + hubs + sitemap/robots/meta. Defer stores (no slug/URL), banners/coupons/flash-sales (transient), jewelery/food (mock/stub), size-charts (utility).

---

## 12. Indexable Page Strategy

| Page type | Route (after) | Data source | Public | Index? | Unique? | Substantial? | Canonical | Sitemap? |
|---|---|---|---|---|---|---|---|---|
| Home | `/`, `/(tabs)/clothing/home` | `banners?placement + categories/public + products/trending + malls/top` | yes | **yes** | yes (curated local feed) | yes if server-rendered hubs | `https://quickbihar.in/` | yes (1) |
| Search hub | `/(tabs)/clothing/search` | categories + trending (NOT user query) | yes | **yes (hub shell only)** | medium | thin unless curated | self, strip `?q` | yes (1) |
| Top-selling | `/top-selling` | `GET /products/trending` | yes | **yes** | medium | yes if ≥ N items rendered in HTML | self | yes (1) |
| PDP | `/product/:slug` (NEW canonical; `/product/:id` 301s) | `GET /products/slug/:slug` + `/:id/reviews` + `/:id/similar` | yes (only if `isActive+APPROVED+!isDeleted`) | **yes iff gate passes + has image + desc≥threshold** | yes | yes | self slug URL | yes (bounded set) |
| Category hub | `/category/:slug` (NEW) | `GET /categories/public` entry + `GET /products/public?category=` items | yes (only if `isActive` + has ≥1 public product) | **conditional yes** | yes | conditional | self | yes iff indexed |
| Mall index | `/mall` | `GET /malls` | yes | **yes** | yes | yes | self | yes (1) |
| Mall detail | `/mall/:slug` (NEW canonical; `/:id` 301s) | `GET /malls/slug/:slug` (NEW) + products[24] + reviews | yes (only if `isActive+APPROVED`) | **conditional yes** | yes | yes | self | yes iff indexed |
| Policy/support (CMS/blog/FAQ/returns) | TBD public paths (NEW, only after public GETs exist) | `refund-policies/active`, `app-config`, published CMS/blog/FAQ | yes | **yes** | yes | yes | self | yes |
| Cart/checkout/order/account/track/rider/auth/onboarding/food-stub/jewelery-mock | existing paths | private/mock | no/mock | **NO — noindex,nofollow** | — | — | self (noindex) | **no** |

**RECOMMENDATION:** Gate every dynamic page with `Entity exists → public → published/approved → has unique content → stable URL → index`, else `noindex` + exclude from sitemap (§29). Thin/empty categories, unpublished/inactive/deleted entities, location-empty `local` results never index.

---

## 13. Dynamic Route Strategy

**FACT — today:** 5× `[id]` CSR routes, all Mongo ObjectId, no slugs in URLs, no redirects, no 404/410 distinction (missing content renders client error states with HTTP 200 under SPA fallback).

| Route | Entity | Source | Public? | Stable slug? | Human-readable? | Dup risk | Plan |
|---|---|---|---|---|---|---|---|
| `app/product/[id].tsx` | `Product` | `GET /products/:id` (public w/ gate) | yes | **yes in DB (`slug` unique) but unused in URL** | no | yes (`/slug/:slug` + `/:id` serve same entity) | **Canonical `/product/:slug`; keep `/product/:id` as 301 → slug; add `GET /products/slug/:slug` usage in app; on title-change regenerate + keep redirect (§27 optional history)** |
| `app/mall/[id].tsx` | `Mall` | `GET /malls/:id` | yes | **yes in DB, no slug API** | no | will duplicate once slug added | **Add `GET /malls/slug/:slug`; canonical `/mall/:slug`; `/:id` 301s** |
| (NEW) `/category/:slug` | `Category` | `GET /categories/public` + products filter | yes | yes (`slug` unique, no suffix) | yes | low | **Slug-only; unknown slug → 404** |
| `app/order/[id].tsx`, `app/track-order/[id].tsx` | `Order` | Bearer APIs | no | n/a | n/a | n/a | **Keep `[id]`; noindex; no sitemap; no slug work** |
| `app/jewelery/product/[id].tsx` | mock jewelery | local `data/products.ts` | mock | no | no | n/a | **Keep; noindex until real backend vertical exists** |

**RECOMMENDATION — URL rules:** lowercase slugs; IDs never in canonical URLs; unknown/invalid IDs/slugs → real 404 page + 404 status on static host; unpublished/inactive/deleted → 404 (not silent 200, not 410 in v1); title changes keep old slug working (redirect) rather than breaking; pagination/filter/sort query params canonicalize to the clean collection URL (§16).

**ASSUMPTION:** `Product.slug` values are URL-safe as generated (`slugify` + random suffix). Audit existing slugs for uppercase/legacy values before launch; normalize at read (redirect) not by mass DB rewrite.

---

## 14. Rendering Strategy

**FACT:** Today Google gets an **empty SPA shell**: `web.output:single` emits one `index.html`; every indexable page fetches via `axiosInstance` inside `useQuery`/`useEffect` AFTER load (`useProductById`, `usePublicMalls`, `useSearchProducts`, `track-order` `Promise.all[...]`, `SocketListenerProvider` even early-returns on web). No SSG/SSR, no `generateStaticParams`, no per-route HTML.

**RECOMMENDATION — switch to Expo static prerender, bounded scope:**

```text
mobile/app.json: web.output "single" → "static"
+ generateStaticParams on: /product/:slug (bounded), /category/:slug (all active),
  /mall/:slug (all approved), plus static prerender of /, /mall, /top-selling, search hub
+ route-level data fetch at export time via the SAME public GETs (no new APIs except slug lookups + caps)
+ client hydration preserves native behavior (TanStack Query cache reuses prerendered payload)
+ auth/transactional/user-specific routes stay CSR + noindex (no generateStaticParams, no prerendered PII)
```

- Product pages: prerender bounded set (e.g. latest/approved N, nightly rebuild) — NOT unbounded full-catalog export on day one (§28 caps this).
- `local`/pincode-personalized content NEVER prerenders (it requires user location); PDP/category/mall prerender location-agnostic core (title/desc/images/price/ratings/reviews), with serviceability checked client-side post-hydration.
- Sockets/push stay web-disabled (`SocketListenerProvider` + `usePushNotifications` already early-return on web — keep).

**ASSUMPTION:** `EXPO_PUBLIC_API_ORIGIN` is reachable from the export builder (CI builder has egress to `https://quickbihar.in/api/v1`). If not, inject a build-time `EXPO_PUBLIC_BUILD_API_ORIGIN` pointing at `http://server:8000/api/v1` inside compose/CI (§30).

---

## 15. Metadata Strategy

**FACT:** No reusable metadata system exists. `Stack.Screen options.title` is the only title mechanism (2 files), and it does not emit `<meta>`/OG/canonical/robots/JSON-LD under `single`.

**RECOMMENDATION — one helper + per-type templates (all from real data, never one global string):**

- New `mobile/src/lib/seo.ts` (proposed): `buildMetadata({title, description, canonical, image, robots, ogType})` + `getDefaultMeta()` (falls back to `GET /app-config seo{}`) + truncation (title ≤60, desc 150–160) + absolute-URL canonical builder for `https://quickbihar.in`.
- Render via the Expo static head mechanism available in SDK 56 (`expo-router/head` `Head` component or route `Head` export — confirm in spike; fallback: `+html.tsx` shell injection). Every indexable route sets: unique `<title>`, `meta[name=description]`, `link[rel=canonical]`, `meta[name=robots]`, OG (`og:title/description/type/url/image`, `og:site_name QuickBihar`, `og:locale en_IN`), Twitter `summary_large_image`, viewport (keep existing), theme-color, favicon (existing asset).
- Templates: PDP `"{title} — {brand} | Buy Online in Bihar | QuickBihar"` + `"{shortDescription || description→160} … ₹{price} …"`; category `"{title} | Shop {title} Online in Bihar | QuickBihar"`; mall `"{name}, {city} | Stores, Offers & Reviews | QuickBihar"`; hubs unique per page; legal/CMS from their `seo{}`/title+excerpt.
- Robots: indexable → `index, follow`; everything in §6 non-indexable → `noindex, nofollow` BOTH as meta tag AND (for dashboards) `X-Robots-Tag` belt-and-braces.

**ASSUMPTION:** SDK 56 static export hoists per-route head tags into prerendered HTML. Prove in the spike (§38 step 1); if it does not, add minimal `+html.tsx` shell that renders the helper's tags (no other shell changes).

---

## 16. Canonical URL Strategy

**FACT — duplicate sources today:** `/:id` vs `/slug/:slug` (products); soon `mall/:id` vs `/mall/:slug`; `www` vs apex (nginx already 301s www→apex — keep); `HTTP→HTTPS` 301s (already); SPA fallback serves every unknown path as 200 `index.html`; trailing-slash, case, filter/sort/pagination query variants have no canonical rule.

**RECOMMENDATION — single canonical policy for `https://quickbihar.in`:**

1. Apex canonical: `https://quickbihar.in` (no `www`, `https` only). Keep nginx `www→apex` 301 + HSTS preload.
2. One URL per entity: `/product/:slug`, `/mall/:slug`, `/category/:slug`. `/product/:id` and `/mall/:id` 301 → slug URL (client redirect + `link rel=canonical` to slug; true 301 once static host redirect map exists — §21).
3. Collections: canonical is the clean path (`/top-selling`, `/mall`, `/category/:slug`) — `?page|?sort|?q|?pincode|?lat|?lng` never canonical, never in sitemap.
4. Trailing slash: no-slash canonical (`/mall` not `/mall/`); normalize with redirect, not duplicate render.
5. Case: lowercase canonical; uppercase → lowercase 301.
6. `AppConfig`/dashboard hosts never canonical for storefront content (`dashboard.quickbihar.in` canonical stays self-scoped).

---

## 17. robots.txt Strategy

**FACT:** No `robots.txt` serves from `quickbihar.in` today (Expo `dist/` has none; `express.static(public)` has none; only `web/src/app/robots.ts` exists and it serves the **dashboard host**, not the storefront).

**RECOMMENDATION:**

- Serve storefront `robots.txt` from the API or static host (pick one owner — server `GET /robots.txt` is simplest since sitemap is dynamic):
```text
User-agent: *
Allow: /
Disallow: /auth/
Disallow: /account/
Disallow: /checkout
Disallow: /order/
Disallow: /track-order/
Disallow: /rider
Disallow: /*?*pincode*
Disallow: /*?*lat*
Disallow: /*?*q=*
Sitemap: https://quickbihar.in/sitemap.xml
```
- Non-prod (`NODE_ENV!=production` / staging hosts): `User-agent: * / Disallow: /` + `X-Robots-Tag: noindex` (§34).
- Keep `web/src/app/robots.ts` for the dashboard host but ADD `sitemap:` field scoping dashboard sitemap (legal pages only) and per-page `noindex` on `/admin|/seller|/delivery|/auth` (§25) — robots.txt alone is not privacy.
- Never rely on robots.txt to hide PII; auth + noindex remain the enforcement.

---

## 18. Sitemap Strategy

**FACT:** No sitemap exists anywhere (`sitemap.*` glob = 0 hits outside this plan).

**RECOMMENDATION — server-owned dynamic sitemap (single owner, always fresh, no Expo build dependency):**

- `GET /sitemap.xml` (sitemap index) → `sitemap-products.xml + sitemap-taxonomy.xml + sitemap-static.xml`, all with `<lastmod>` from `updatedAt`, all absolute `https://quickbihar.in` URLs, all passing the §12 gate.
  - `sitemap-static.xml`: `/`, `/mall`, `/top-selling`, search hub, policy/legal/CMS (handful, `changefreq weekly`).
  - `sitemap-taxonomy.xml`: every active `Category.slug` with ≥1 public product + every approved/active `Mall.slug` (`daily/weekly`).
  - `sitemap-products.xml`: approved/active/non-deleted products with image+desc, paginated internally, hard cap per file 50k URLs / 50MB (split `sitemap-products-*.xml` when exceeded; product count ASSUMED <50k in v1 — add splitting logic anyway).
- Exclude: auth/account/cart/checkout/orders/track/rider/food-stub/jewelery-mock/banners/coupons/internal search/filtered/paginated/user-specific URLs.
- Deleted/unpublished → drop at next generation (short `max-age`, e.g. 1h, plus rebuild hook on publish — §28).
- Add `GET /sitemap.xml` rate-limit exemption tuned for crawlers + `Cache-Control: public, max-age=3600`.
- Reference from `robots.txt` + submit in Search Console (§31).

**ASSUMPTION:** Catalog is small enough that on-demand DB queries per sitemap request are fine with the §26 pagination caps + indexes. If products exceed ~100k, move to nightly pre-generated static sitemap.

---

## 19. Structured Data Strategy

**FACT:** Zero JSON-LD in the repo. Available honest fields per entity:

| Page | Candidate schema | Fields present in DB/API | Missing / must omit |
|---|---|---|---|
| PDP `/product/:slug` | `Product` + `AggregateRating`/`Review` (only when data exists) | `name(title), description, image[], brand, sku(variants.sku), offers{price,priceCurrency INR,availability from totalStock/isActive}, aggregateRating{ratingValue,reviewCount} from ratings{}, review[] from GET /:id/reviews (APPROVED only)` | Omit `aggregateRating/review` when `ratings.count==0`; NEVER fabricate ratings/reviews/prices; `offers.url` = canonical slug URL |
| Category `/category/:slug` | `CollectionPage` + `ItemList` (products) | `name, description, itemListElement (name/url/image from products/public)` | Omit if empty category (page itself noindexed anyway) |
| Mall detail `/mall/:slug` | `ShoppingCenter` (or `Place` fallback) + `AggregateRating` | `name, description, image, address{line1,city,state,pincode}, aggregateRating(rating,reviewCount)` | Omit rating when `reviewCount==0`; hours only if `Store.timings`-grade data present (do not invent) |
| Home/org | `Organization` + `WebSite` (once, on `/`) | `AppConfig store{storeName,appTitle}, contact, socialLinks, logo/favicon` | Omit `sameAs` URLs not in DB; no fake founding/employee data |
| Breadcrumbs | `BreadcrumbList` | route hierarchy (Home › Category › Product; Home › Malls › Mall) | Always matches visible breadcrumbs (§20) |

**RECOMMENDATION:** Emit JSON-LD only on indexable pages, only with visible-content-matched values, only when required fields exist. Validate every template with Rich Results Test before launch (§35).

---

## 20. Internal Linking Strategy

**FACT — existing navigable relationships:** home carousels → product/mall (`CarouselSlide` + `redirectType product|category|collection|external`); `SearchResults`/`HomeCategories` → `/product/:id`; mall detail → `products[24]` + `matchingMalls[5]`; product → `/:id/similar[10]`; `TopSellingScreen` list; jewelery `ProductCard → /jewelery/product/:id` (mock, noindex).

**RECOMMENDATION (no invented IA — wire what exists):**

- PDP: breadcrumbs `Home › Category › Product` + `similar` rail (link, not just cards) + brand/category links to `/category/:slug`.
- Category hub: breadcrumbs + paginated product grid with crawlable `<a href=/product/:slug>` (not `onPress`-only divs on web) + link back to home + sibling categories.
- Mall index→detail→products + `matchingMalls` cross-links; mall detail breadcrumbs `Home › Malls › {Mall}`.
- Home/search/top-selling hubs link to all three (category tiles, trending products, featured malls) so crawlers reach depth-2 without JS interaction.
- Paginated collections use crawlable prev/next links with canonical pinned to page 1 clean URL.

---

## 21. 404/Redirect Strategy

**FACT:** No `+not-found.tsx`; SPA fallback returns 200 `index.html` for every unknown path (SEO poison: soft-404s index as duplicates); no redirect map; `track-order`/order failures render client error UI with 200.

**RECOMMENDATION:**

- Add `mobile/app/+not-found.tsx` (branded 404, links home/category/malls, `noindex`) AND make the static host return real 404 status for unknown `.html` paths (nginx `error_page 404 /404.html` after static export; verify export emits it).
- Deleted/unpublished/invalid product|mall|category slug → render 404 UI + 404 status (v1; graduate to 410 for deliberately removed products only if ops commits to tracking tombstones — not required day one).
- ID→slug migration: `/product/:id` + `/mall/:id` render canonical link + client `Redirect` to slug URL; add static-host 301 map for top URLs if nginx is in front of `dist/` (preferred) else client redirect + canonical (accepted v1 trade-off, documented in Search Console).
- API failure during prerender → fail that page's prerender (skip + log), never emit a 200 shell with empty content into the index (§28).

---

## 22. Image SEO Strategy

**FACT:** Remote images come from API `product.image.url/fileId`, `avatar.url`, `mall.*` (ImageKit-backed uploads server-side; no `ik.imagekit.io`/Cloudinary SDK found client-side). Client: `expo-image` in 8 files only; most catalog images are RN `Image`/FlashList with NO `alt`, no `priority/placeholder/blurhash`, fallback `via.placeholder.com` in wishlist; uploads via `expo-image-picker` + `POST /delivery/proof-upload`.

**RECOMMENDATION:**

- Every indexable image gets a real `alt` from data (`product.title + variant` / `mall.name + city` / `category.title`) — templated in the prerender path where DOM `alt` actually emits; never keyword-stuff.
- PDP LCP image: `priority`/eager + explicit dimensions; below-fold rails lazy; remote ImageKit URLs request sized variants (confirm transform params with `server/src/config/imagekit.config.ts` before launch).
- OG images reuse the canonical product/mall/category image absolute URL (§15).
- Broken/missing image → local placeholder asset (stop hotlinking `via.placeholder.com`), plus prerender gate: products without ≥1 image are sitemap-excluded until fixed.

---

## 23. Performance/Core Web Vitals Strategy

**FACT — concrete risks in code (not generic advice):** full Expo RN-web runtime + Reanimated/Carousel/Lottie/Video/FlashList shipped to every page; `QueryProvider` 24h persist + 5m stale with `refetchOnWindowFocus:false` (good); no image sizing/placeholders (CLS risk); web-only `<style> html,body,#root{height:100dvh;overflow:hidden}` (mobile-app shell, fine for app, constrains web scroll — audit before static); `babel remove-console` prod-only (good); nginx already gzips + 1yr-immutables `/_expo/static/` + asset regex on apex host (good) but `/_next/` on dashboard host has no cache header; no `Cache-Control` on API catalog.

**RECOMMENDATION (measured, in order):**

1. LCP: prerendered HTML already contains title/image/price (post-§14); `priority` hero image; keep web font set minimal (audit `expo-font` usage; `display:swap`).
2. CLS: explicit image dimensions + skeleton-free prerender (content present, no layout pop); audit `100dvh/overflow:hidden` shell against scrollable SEO pages.
3. INP: keep heavy sheets/carousels code-split off first paint on PDP/category; no new animation libs.
4. TTFB: nginx gzip (keep) + sitemap/API `Cache-Control` + catalog query index coverage (already indexed; verify with `explain()` on products/public sort paths).
5. Budgets: Lighthouse ≥90 performance on `/`, PDP, category, mall detail before launch (§35); bundle diff on every PR touching `mobile/`.

---

## 24. Accessibility Improvements

**FACT:** No a11y audit exists; RN-web emits divs by default; headings/semantics depend on `Text` usage per screen; no focus/keyboard pass recorded.

**RECOMMENDATION (SEO-adjacent only):** one semantic heading hierarchy per indexable page (`h1` = product/category/mall title, single), crawlable anchor links (not press-only views) for all internal links (§20), labeled form controls on search/auth, `alt` per §22, visible focus states on web, contrast check on price/CTA. No broad redesign.

---

## 25. Authentication & Privacy Considerations

**FACT — auth reality (`mobile/src/features/common/auth/*`, `server/src/modules/common/auth/*`, `server/src/middlewares/auth.middleware.ts`, `web/src/proxy.ts`):** email/password + OTP + Google (`@react-native-google-signin` + `GoogleSignin.configure(webClientId)` in `_layout`), JWT access(1d hard-coded)/refresh(10d) rotation with DB match, reset via 15m aud-scoped JWT + Redis single-use key, RBAC `RoleEnum{USER,SELLER,DELIVERY,ADMIN,SUPER_ADMIN}` + `RIDER` alias, `verifyJWT|verifyOptionalJWT|isAdmin|isSeller|isDelivery|isSellerOrAdmin`, proxy cookie-presence guard (explicitly not a security boundary), SecureStore(native)/localStorage(web) token vault, deep-link reset tokens via query params, push deep-links to `/product/:id|/mall*`.

**RECOMMENDATION:** Crawlers never authenticate: all `verifyJWT` routes + soft-guarded account/rider/order/track screens stay `noindex,nofollow` + out of sitemap; protected-route crawler hits must render the login/public shell WITHOUT user data (never redirect-loop, never leak `401` bodies into HTML); `PATCH /users/fcm-token` public anomaly gets auth or strict rate-limit before launch (§33); dashboard `/admin|/seller|/delivery` get per-page `noindex` in addition to `robots.ts` disallow (client `"use client"` blank shells return 200 today).

---

## 26. API Changes

**FACT → smallest sufficient deltas (reuse > new):**

| # | Change | Owner file(s) | Why existing API insufficient |
|---|---|---|---|
| A1 | `GET /api/v1/categories/slug/:slug` (public, active-only) | `server/src/modules/common/category/category.router.ts + controller + service + dao` | Detail is id-only; taxonomy URLs need slug lookup |
| A2 | `GET /api/v1/malls/slug/:slug` (public, approved+active; same enriched payload as `/:id`) | `server/src/modules/common/mall/mall.router.ts + controller + service` | `slug` unique in DB but no slug route |
| A3 | Public published reads: `GET /api/v1/cms/pages/slug/:slug`, `GET /api/v1/cms/posts/slug/:slug`, `GET /api/v1/cms/faqs`, `GET /api/v1/refund-policies/active` (exists — keep) | `server/src/modules/common/admin/*` (new public router reusing `admin.service` read fns + `status PUBLISHED + isActive` gate) | CMS/blog/FAQ models have `slug+seo+status` but zero public GET |
| A4 | `GET /sitemap.xml` (+ index + shards) and `GET /robots.txt` (env-aware) | `server/src/app.ts` (mount) + new `server/src/modules/common/seo/seo.router|controller|service.ts` | Neither exists; server ownership keeps sitemap fresh without Expo rebuilds |
| A5 | Pagination caps + `totalPages`: `products/public` clamp `limit≤50` (reviews already `≤50`); categories-public add `page|limit` passthrough parity with admin `≤100` | `server/src/modules/clothing/products/product.dao.ts`, `category.dao.ts` | Unbounded `?limit=` DoS + crawler abuse |
| A6 | `Cache-Control: public, max-age=60` (catalog lists) / `max-age=300` (detail) + `ETag` | public GET controllers or middleware | No HTTP caching today |
| A7 | Sitemap/crawler rate-limit bucket (~120/min) + keep auth strict limiters unchanged | `server/src/middlewares/rateLimit.middleware.ts` | No catalog limiter; in-memory store noted (Redis store optional later) |
| A8 | Fix `GET /stores/my-stores` shadow (move above `/:id`) + decide store indexability (defer public store pages to v2) | `server/src/modules/common/store/store.route.ts` | Unreachable route; stores lack slug/URL — do NOT add store SEO URLs in v1 |

Do NOT create duplicate product/category/mall list APIs; do NOT expose private order/user/cart/wishlist/address data in any SEO endpoint.

---

## 27. Database Changes

**FACT:** All metadata needed for v1 can be generated from existing fields (`title/slug/description/images/price/ratings/seo/updatedAt` + `AppConfig.seo`). No schema change is required to launch.

**RECOMMENDATION — v1: zero migrations.** Optional v2 (only if URL churn proves real — `products.md:191` already warns title-change breaks links): add `Product.slugHistory: string[] + Product.canonicalSlug` with backfill from current `slug`, unique index on `slugHistory`, redirect resolver checking history. Rollback = drop fields/index (reads fall back to `slug`). No `SEO title/description` columns (use existing `seo{}`), no `publishedAt` columns (use `updatedAt` for `<lastmod>`), no store slug (deferred with store pages).

---

## 28. Frontend Changes

**FACT → planned `mobile/` edits (native behavior preserved; TanStack Query + auth + Razorpay splits untouched):**

- `mobile/app.json`: `web.output single→static` (+ verify `favicon`, add `metadata{lang:en, themeColor, description placeholder}` only if SDK 56 consumes it — cosmetic, not load-bearing).
- `mobile/Dockerfile` + inner nginx: replace SPA `try_files /index.html` with static-aware `try_files $uri $uri.html $uri/ /index.html` + `error_page 404 /404.html` + keep asset immutables.
- NEW `mobile/src/lib/seo.ts`: canonical builder, truncation, robots helper, JSON-LD builders, `seoGate(entity)` (exists+public+approved+content check).
- NEW/EDIT per-route head wiring: `/`, `home`, `search` hub, `/top-selling`, `/mall`, `/mall/[id]`→slug, `/product/[id]`→slug-compat, NEW `/category/[slug]`, NEW `app/+not-found.tsx`.
- EDIT data hooks for build-time fetch: `useProducts(useProductById)`, `useMalls`, `useCategories` — add slug-based fetchers hitting A1/A2; keep CSR fallback post-hydration.
- EDIT `LivingPixelOcean`, `SocketListenerProvider`, `usePushNotifications` web guards: keep/extend (no sockets/push/canvas-viewport hacks on prerendered SEO pages).
- EDIT image components on PDP/mall/category: `alt` + dimensions + priority (see §22).
- EDIT internal links (§20) to `<Link href=/product/:slug>` crawlable anchors on web.
- MUST NOT CHANGE: `axiosInstance` auth/refresh logic, `authStore` roles, `openRazorpayCheckout.{web,native}`, SecureStore vault, rider/order/checkout flows, jewelery mock contexts (noindex instead of refactor), native navigation/gestures.

---

## 29. Platform Compatibility

**FACT — split files (4) + ~50 `Platform.OS/select` hits + DOM usages (verified):** `GoogleSignInButton.web.tsx`, `openRazorpayCheckout.web.ts (window.Razorpay/document script)` vs `.native.ts`, `shims/expo-haptics.web.ts`; `Platform.OS===web` style/padding branches in `_layout`, tabs layouts, cart/product/order/search styles; `SocketListenerProvider` + `usePushNotifications` web early-returns; `LivingPixelOcean` `document/window` guarded by `Platform.OS!==web return null`; `authStorage` localStorage-on-web.

**RECOMMENDATION:** Prerender path must be DOM-free (no `window/document/localStorage/navigator` at module top-level on indexable routes); keep all existing `Platform` branches; run the §35 cross-platform matrix (`Android + iOS + Web`) on every SEO PR — especially Razorpay split, Google button split, tab-bar heights, `useTopPad` insets, SecureStore vs localStorage, deep links (`QuickBihar://` + reset-token query + push `/product|/mall` links updated to slug URLs).

---

## 30. Deployment Plan

**FACT — sequence adapted to the real botones (compose + host nginx + self-hosted runner):**

```text
1. Dev web build: npx expo export --platform web with web.output:static locally; confirm per-route HTML contains title/meta/canonical/JSON-LD + gated noindex on private routes.
2. Local SEO validation: serve dist/ via nginx static config (not npx serve SPA); curl status codes (200 indexable, 404 unknown, id→slug redirect); Lighthouse; Rich Results Test on PDP/category/mall HTML files.
3. Backend deploy first: ship A1–A8 behind existing auth (public GETs additive; my-stores reorder backwards-compatible); verify /sitemap.xml, /robots.txt, slug lookups, caps, cache headers on staging data.
4. Expo static deploy: CI builds mobile-web image (EXPO_PUBLIC_API_ORIGIN=https://quickbihar.in or build-time internal origin if egress blocked); push :prod/:sha; runner pull + up -d mobile-web only.
5. Domain: verify apex serves prerendered HTML; www→apex 301; dashboard.* untouched; HTTPS+HSTS intact (vps-nginx/quickbihar.conf already correct — no DNS change).
6. robots.txt + sitemap.xml live-check (curl both hosts; storefront sitemap referenced, dashboard sitemap scoped).
7. Search Console: verify property, submit sitemaps, inspect /, PDP slug, category, mall URLs (§31).
8. Monitoring week 1–2: coverage/indexing, canonical-inspection, CWV, 404 log triage, redirect map additions.
9. Production regression: Android/iOS smoke (auth, cart→Razorpay sandbox→verify, rider accept→deliver, push deep-links) + web checkout smoke.
```

If the builder cannot reach `https://quickbihar.in/api/v1` at export time, set a build-only `EXPO_PUBLIC_BUILD_API_ORIGIN=http://server:8000/api/v1` in CI (never baked into runtime client — runtime stays same-origin).

---

## 31. Google Search Console Plan

1. Property: Domain property `quickbihar.in` (covers apex + www + dashboard) via DNS TXT (Hostinger) — preferred over URL-prefix.
2. Verification: DNS TXT; keep ownership with ops + dev owners.
3. Sitemaps: submit `https://quickbihar.in/sitemap.xml` (index) — NOT dashboard URLs; separately submit dashboard sitemap if one is added for legal pages.
4. URL Inspection: `/`, 3× PDP slugs, 1× category, 1× mall, `/top-selling` — confirm `URL is on Google`, canonical = slug URL, no `Duplicate without user-selected canonical`.
5. Monitoring: Coverage (404/soft-404/redirect errors from §21), Pages (why-not-indexed triage for gated PDPs), CWV, Manual Actions/Security, Links (internal link pickup from §20).
6. No ranking promises: success = technically discoverable/crawlable/indexable (§42); rankings depend on competition/authority/content/demand.

---

## 32. Analytics Plan

**FACT:** Zero analytics SDKs (grep `posthog|mixpanel|amplitude|segment|appsflyer|gtag|fbq|clarity` = 0; only a `// Track click analytics` comment with no call in `CarouselSlide.tsx`).

**RECOMMENDATION (minimal, web-only):** add one privacy-respecting page-view counter for the storefront static pages (e.g. Plausible/Umami self-host or GA4 — team picks ONE) loaded only on web prerendered routes, cookieless mode, no PII, no native SDK, no event duplication with future app analytics. Defer funnel/checkout instrumentation until after SEO launch. If the team prefers zero JS, server access-log + Search Console suffices for v1 — do not introduce analytics unnecessarily.

---

## 33. Security Considerations

- `PATCH /users/fcm-token` is PUBLIC (no `verifyJWT`) — either require auth or add strict rate-limit + token-format validation before launch (spam/device-spoofing vector; crawlers will find it via sitemap-adjacent probing).
- Sitemap/build-time API loops must use unauthenticated public GETs only — never bake service credentials, JWTs, or admin cookies into export; cap + timeout + retry with jitter; log partial failures (§28/§41).
- `noindex` + auth on all user/order/address/payment/rider/admin/seller surfaces; robots.txt is advisory only.
- CORS allowlist already correct (apex+www+dashboard + env); Socket.IO mirrors it — keep; do not open `*` in prod.
- Secrets (`IMAGEKIT/RAZORPAY/FIREBASE/RESEND/MONGO/JWT`) are server-`ENV`-only (Zod fail-fast) — never `EXPO_PUBLIC_*`; audit that no SEO helper leaks them into prerendered HTML.
- Unbounded `?limit=` (products/public) + uncapped sitemap = crawler DoS — fixed by A5/A7.
- `my-stores` shadow bug (A8) is also an access-shape bug — fix ordering so `/:id` 404 regex cannot swallow named sub-routes.

---

## 34. Edge Cases

*(Routing/Rendering/SEO/Data/Auth/Platform/Deployment/Security/Performance — resolved per section, summarized:)* Invalid/missing/trailing-slash/duplicate/changed-slug/deleted/unpublished → §13+§21 (slug canonical, 404 status, no soft-200). API down/empty/partial/slow/malformed/stale at build → skip page + log, never emit thin 200 (§28). Duplicate/missing/wrong title/desc/canonical, accidental noindex/index, orphans, thin/duplicate-query pages → helper defaults + gates + sitemap exclusion (§12/§15/§18). Missing image/desc/slug, dup slug, unicode, overlong strings → gates + truncation + placeholder (§22/§12). Logged-in/out, expired session, crawler on protected route, personalized content → public shell + noindex, no PII in HTML (§25). Android/iOS/web divergence, native-only deps, web-only Razorpay/DOM, static-build incompatibilities → §29 matrix. Wrong env/API-origin, HTTP, domain/redirect loops, SPA-fallback leftovers, asset paths, cache/CDN, staging indexed → §30 + staging `Disallow:/` + `X-Robots-Tag` + build-origin fallback. Key exposure, PII indexing, token leakage, crawler abuse, build secret bake → §33. Bundles, images, fonts, CLS, API waterfalls, slow first render → §23 budgets.

---

## 35. Testing Strategy

**Functional:** navigation (tabs→PDP→cart→checkout→verify→orders→track), dynamic slug + id-compat redirects, auth (login/register/Google/OTP/reset/legacy-capture/role landing), transactional flows (quote→Razorpay→verify→sub-orders→rider→returns), native gestures/back-button/deep-links unchanged.
**SEO:** view-source per indexable route (title/desc/canonical/robots/OG/Twitter/JSON-LD present + unique); `curl -I` status codes (200/301/404, no soft-200); `robots.txt` + `sitemap.xml` validity (XSD + URL Inspector); structured-data Rich Results Test; `noindex` on all §6 private routes; Search Console coverage/canonical/CWV.
**Performance:** Lighthouse ≥90 perf on `/`, PDP, category, mall; LCP/CLS/INP field check post-launch; bundle-size diff gate; image-dimension/alt audit.
**Cross-platform:** `Android + iOS + Web` smoke per SEO PR (Razorpay split, Google split, tabs, insets, SecureStore/localStorage, push links to slug URLs).
**Search engine:** §31 end-to-end (verify → submit → inspect → monitor → triage).

---

## 36. File-by-File Change Plan

*Format: File / Current / Why / Planned / Deps / Risk / Testing. Only real paths. "MUST NOT CHANGE" list at end.*

- **File:** `mobile/app.json` — **Current:** `web.output:single`, no web metadata. **Why:** single emits one SPA shell (uncrawlable). **Planned:** `output:static` (+ optional benign web metadata). **Deps:** `mobile/Dockerfile` inner nginx, `vps-nginx/quickbihar.conf` fallback. **Risk:** medium (build-mode switch). **Testing:** local export + per-route HTML + native smoke.
- **File:** `mobile/Dockerfile` — **Current:** nginx SPA `try_files /index.html`. **Why:** wrong fallback for static. **Planned:** static `try_files $uri $uri.html $uri/ /index.html` + `error_page 404 /404.html` + immutable assets. **Deps:** app.json mode. **Risk:** low. **Testing:** `curl -I` unknown path → 404; assets → 1yr cache.
- **File:** `mobile/app/+not-found.tsx` (NEW) — **Current:** absent. **Why:** no 404 route. **Planned:** branded 404 + hub links + noindex. **Deps:** static 404.html emission. **Risk:** none. **Testing:** unknown slug → 404 UI+status.
- **File:** `mobile/src/lib/seo.ts` (NEW) — **Current:** absent. **Why:** no metadata system. **Planned:** canonical/truncation/robots/JSON-LD/gate helpers. **Deps:** `AppConfig.seo` fallback. **Risk:** low. **Testing:** unit (truncation/gates) + view-source.
- **File:** `mobile/app/product/[id].tsx` — **Current:** CSR id-PDP, no meta. **Why:** primary index target but id-URL + CSR. **Planned:** keep as compat (fetch by id → 301/Redirect to `/product/:slug` + canonical). **Deps:** A-product slug API (exists), seo helper. **Risk:** low. **Testing:** `/product/:id` → slug; canonical self.
- **File:** `mobile/app/product/[slug].tsx` (NEW; or repurpose `[id]` with slug detection — prefer NEW for clarity) — **Current:** absent. **Why:** canonical slug PDP. **Planned:** `generateStaticParams` (bounded) + prerender + PDP JSON-LD. **Deps:** `GET /products/slug/:slug`, reviews, similar. **Risk:** medium (build-time data). **Testing:** view-source PDP fields + rich-results.
- **File:** `mobile/app/category/[slug].tsx` (NEW) — **Current:** no category route. **Why:** taxonomy uncrawlable. **Planned:** `generateStaticParams` all active slugs + grid + CollectionPage JSON-LD. **Deps:** A1 + products/category filter. **Risk:** low. **Testing:** empty category → noindex + excluded.
- **File:** `mobile/app/mall/[id].tsx` — **Current:** CSR id detail. **Why:** id-URL + CSR. **Planned:** compat redirect → `/mall/:slug`. **Deps:** A2. **Risk:** low. **Testing:** same as product compat.
- **File:** `mobile/app/mall/slug-route` (NEW `app/mall/[slug].tsx` alongside, or rename) — **Current:** absent. **Why:** canonical mall URL. **Planned:** prerender + ShoppingCenter JSON-LD. **Deps:** A2. **Risk:** low. **Testing:** view-source + sitemap entry.
- **File:** `mobile/app/(tabs)/clothing/home.tsx`, `app/index.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/clothing/search.tsx`, `app/top-selling.tsx`, `app/mall/index.tsx` — **Current:** CSR hubs, (mostly) no titles. **Why:** hub crawlability + internal linking. **Planned:** prerender + unique meta + hub→PDP/category/mall anchors. **Deps:** existing public list APIs. **Risk:** low. **Testing:** hub HTML contains links to sampled slugs.
- **File:** `mobile/src/features/clothing/product/hooks/useProducts.ts + api/product.api.ts` — **Current:** id-based CSR hooks. **Why:** need slug fetchers for prerender. **Planned:** add `useProductBySlug/getProductBySlug` (reuse `GET /slug/:slug`). **Deps:** none new. **Risk:** low. **Testing:** hook unit + prerender integration.
- **File:** `mobile/src/features/clothing/home/hooks/useMalls.ts + api/mall.api.ts`, `mobile/src/features/common/category/hooks/useCategories.ts + api/category.api.ts` — **Current:** id/list CSR. **Why:** slug + static params sources. **Planned:** add slug fetchers + `getAllSlugsForStaticParams`. **Deps:** A1/A2. **Risk:** low. **Testing:** params list matches DB slugs.
- **File:** `mobile/src/components/*` image usages on PDP/mall/category (`SearchResults.tsx`, `HomeCategories.tsx`, `ProductDetail/styles` consumers) — **Current:** no alt/dimensions. **Why:** CLS + image SEO. **Planned:** alt + dimensions + priority hero. **Deps:** API image URLs. **Risk:** low. **Testing:** Lighthouse CLS + alt audit.
- **File:** `server/src/modules/common/category/category.router.ts + controller + service + dao` — **Current:** `public` + `/:id` only. **Why:** A1 slug lookup. **Planned:** add `GET /slug/:slug` (active-only) BEFORE `/:id`. **Deps:** model `slug` unique. **Risk:** low (route order!). **Testing:** slug 200, unknown 404, `/:id` still works.
- **File:** `server/src/modules/common/mall/mall.router.ts + controller + service` — **Current:** `/:id` only. **Why:** A2 slug lookup. **Planned:** add `GET /slug/:slug` (approved+active, enriched payload). **Deps:** model `slug`. **Risk:** low. **Testing:** same.
- **File:** `server/src/modules/common/admin/*` + NEW `server/src/modules/common/seo/*` (or `cmsPublic.router.ts`) — **Current:** CMS/blog/FAQ admin-only. **Why:** A3 published reads. **Planned:** public router reusing read fns + `PUBLISHED+isActive` gate. **Deps:** `adminFull.model`. **Risk:** low (additive). **Testing:** drafts 404, published 200, no admin fields leaked.
- **File:** NEW `server/src/modules/common/seo/seo.router|controller|service.ts` + `server/src/app.ts` mount — **Current:** absent. **Why:** A4 sitemap/robots. **Planned:** index + shards + env-aware robots. **Deps:** product/category/mall DAOs, A5 caps. **Risk:** medium (crawler load). **Testing:** XSD validity + caps + cache headers.
- **File:** `server/src/modules/clothing/products/product.dao.ts`, `server/src/modules/common/category/category.dao.ts` — **Current:** uncapped/to-`total` pagination. **Why:** A5 DoS/crawler guard. **Planned:** clamp + `totalPages`. **Deps:** callers tolerate extra field. **Risk:** low. **Testing:** `?limit=10000` → clamped.
- **File:** `server/src/middlewares/rateLimit.middleware.ts` — **Current:** 3 auth/onboarding limiters. **Why:** A7 crawler bucket. **Planned:** add sitemap/public-list bucket. **Deps:** mount paths. **Risk:** low. **Testing:** burst test.
- **File:** `server/src/modules/common/store/store.route.ts` — **Current:** `my-stores` shadowed. **Why:** A8 fix. **Planned:** reorder above `/:id`. **Deps:** auth middleware order. **Risk:** low. **Testing:** `my-stores` 200 authed, `/:id` still 404-guarded.
- **File:** `web/src/app/robots.ts` — **Current:** no sitemap ref. **Why:** dashboard hygiene. **Planned:** add `sitemap:` + keep disallows. **Deps:** none. **Risk:** none. **Testing:** `/robots.txt` on dashboard host.
- **File:** `web/src/app/{admin,seller,delivery}/** + auth/**` layouts/pages — **Current:** no per-page robots. **Why:** 200 blank shells indexable if robots ignored. **Planned:** `metadata robots:{index:false,follow:false}` (or `X-Robots-Tag` via headers). **Deps:** Next 16 metadata API (check `node_modules/next/dist/docs/` per `web/AGENTS.md`). **Risk:** low. **Testing:** response header/meta on dashboard login pages.
- **File:** `vps-nginx/quickbihar.conf` — **Current:** SPA-oriented apex `/`. **Why:** static fallback + SEO headers. **Planned:** static `try_files` parity, `/sitemap.xml|/robots.txt` proxy/cache rules, keep 301s/HSTS/gzip. **Deps:** mobile-web inner nginx. **Risk:** medium (host nginx). **Testing:** `nginx -t` + curl matrix (§10 DEPLOYMENT_GUIDE commands).

**MUST NOT CHANGE (SEO work must not touch):** `mobile/src/api/axiosInstance.ts` auth/refresh, `mobile/src/features/common/auth/store/authStore.ts` roles, `mobile/src/features/common/order/lib/openRazorpayCheckout.*`, `mobile/src/lib/authStorage.ts` vault semantics, `mobile/src/features/Delivery/**` + rider state machine, `server/src/modules/common/order/*` pricing/verify flows, `server/src/config/env.config.ts` required vars, `server/Dockerfile` CMD, `docker-compose.yml` ports/networks, `mobile/src/features/Jewelery/context/*` (noindex instead of refactor), native `android/ios` configs + EAS profiles.

---

## 37. Dependency Changes

**FACT:** All rendering/metadata/sitemap needs are satisfiable with existing deps (`expo-router static`, `axios`, `mongoose`, `express`). No new package is required for v1.

| Package | Why required | Why existing deps cannot solve it | Android | iOS | Web | Maintenance |
|---|---|---|---|---|---|---|
| *(none v1)* | — | `expo-router` static + `Head` covers meta; server `express` serves sitemap/robots; `zod` validates new query params | none | none | none | none |
| OPTIONAL v2: `expo-router/head` (if not already re-exported by `expo-router@56.2.9`) | per-route head tags | Only if spike shows `Stack.Screen title` cannot emit meta/OG/canonical | none | none | head emission | track SDK upgrades |
| DEFERRED: analytics (Plausible/GA4), PWA (`expo-web` manifest), i18n (`expo-localization`) | explicitly out of v1 scope | No demand in codebase (zero i18n/analytics/PWA today) | — | — | — | revisit post-launch |

Do not add `react-helmet`, `next-sitemap`, RSS, PWA, or i18n packages in v1.

---

## 38. Implementation Order

```text
Spike (1–2 days, PLAN-VALIDATION, no prod writes):
 S0. npx expo export --platform web with web.output:static on a branch; confirm per-route HTML + Head emission + generateStaticParams + 404.html behavior in SDK 56. If Head does not hoist, design +html.tsx fallback now (not mid-launch).
Phase 1 — crawlable core (backend + static + meta):
 1. A5 caps + A7 limiter + A8 my-stores reorder (safe, independent).
 2. A1/A2 slug lookups + mobile slug fetchers + compat redirects (id→slug) + canonical links.
 3. NEW /category/:slug + mall slug route + +not-found.tsx + seo.ts helper + hub meta + internal-link anchors.
 4. app.json static + Dockerfile/nginx static fallback + local export validation.
 5. A4 sitemap/robots + nginx rules + Search Console submit.
Phase 2 — content depth:
 6. A3 published CMS/blog/FAQ reads + policy pages + WebSite/Organization/Breadcrumb JSON-LD + OG images.
 7. Image alt/dimensions/priority pass + mall/product review surfacing for rich snippets.
Phase 3 — harden + measure:
 8. Dashboard noindex headers + staging Disallow + fcm-token auth decision + Lighthouse≥90 + rich-results green + regression matrix.
```

First shippable = end of Phase 1 (indexable PDP/category/mall/hubs + sitemap + canonical + Search Console).

---

## 39. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Expo static `Head`/`generateStaticParams` behaves differently in SDK 56 than assumed | med | high | S0 spike first; fallback `+html.tsx`; keep `single` rollback = revert 2 files |
| Build-time API unreachable / catalog too large (thousands→millions) | med | high | bounded `generateStaticParams` + caps + skip-and-log + sitemap (not export) as discovery fallback; nightly rebuild cadence |
| Title-change slug churn breaks backlinks (known: `products.md:191`) | med | med | id→slug compat forever; v2 `slugHistory` only if triage shows real 404 volume |
| Static export bakes location/user data or secrets into HTML | low | high | prerender only unauthenticated public GETs; audit HTML for tokens/PII; secrets never `EXPO_PUBLIC_*` |
| `www`/trailing-slash/case/query duplicates dilute canonical | low | med | §16 policy + redirect map + Search Console canonical inspection |
| Dashboard 200 blank shells indexed (client components, no per-page noindex) | med | med | per-page `noindex` + `X-Robots-Tag` + robots disallow (defense in depth) |
| Native regression (Razorpay/Google/tabs/insets/SecureStore/deep-links) | low | high | §35 cross-platform matrix per PR; MUST-NOT-CHANGE list enforced in review |
| Staging indexed / prod mis-env (`EXPO_PUBLIC_API_ORIGIN`, CORS, HTTP) | low | med | staging `Disallow:/` + noindex; deploy checklist curls from DEPLOYMENT_GUIDE §6 |

---

## 40. Open Questions

1. Catalog scale TODAY (`db.products.countDocuments({isActive:true,approvalStatus:APPROVED,isDeleted:false})`) + p95 `description`/image completeness — sets `generateStaticParams` bound + thin-page threshold. (ASSUMPTION: hundreds–low-thousands.)
2. S0 spike result: does SDK 56 static hoist per-route head + `generateStaticParams` for `[slug]` under Tabs/Stack as used here? (ASSUMPTION: yes.)
3. Canonical host final: apex `https://quickbihar.in` confirmed? Keep `www→apex` 301 (already in nginx — confirm live, not just config).
4. Category URL shape: flat `/category/:slug` vs nested parent/child — decide from `parentId` depth in prod data.
5. Store pages v2: add `Store.slug` + public storefront pages, or keep stores as feed-only? (v1 = deferred.)
6. CMS/blog/FAQ launch set: which published slugs ship day one, and their public URL base?
7. Analytics single choice (Plausible vs Umami vs GA4 vs none) + consent posture.
8. `PATCH /users/fcm-token` public: add auth or rate-limit? (recommend auth).
9. Jewelery/food: confirm they stay `noindex` through launch (recommend yes).
10. Rebuild cadence + owner: who triggers static rebuild + sitemap refresh on product publish/unpublish?

---

## 41. Final Recommended Architecture

```text
quickbihar.in (apex, https, www→apex 301, HSTS preload)
  ├── /,/mall,/top-selling,search-hub,/category/:slug,/product/:slug,/mall/:slug  →  Expo STATIC prerender (mobile/dist, inner nginx)
  ├── /auth/*,/account/*,/checkout,/order/*,/track-order/*,/rider,/food-stub,/jewelery/**  →  same Expo bundle, CSR + noindex,nofollow
  ├── /api/v1/*,/socket.io/*  →  Bun Express :5002 (+ NEW /sitemap.xml,/robots.txt,/categories/slug/:slug,/malls/slug/:slug,/cms/*, caps, cache, limiter)
  └── dashboard.quickbihar.in  →  Next.js :3002 (all /admin|/seller|/delivery|/auth noindex; only / + legal indexable)
```

**Answers to the 16 required questions:**

1. **Can Expo serve the web app? FACT:** yes as the app shell today (`single` SPA on apex). **RECOMMENDATION:** yes for SEO too AFTER `single→static` + bounded prerender — no rewrite justified; the only true SSR host in the repo (`web/` Next) serves the wrong subdomain/product surface for storefront SEO.
2. **What must change:** `web.output`, static fallback, metadata helper, slug URLs + compat redirects, category route, `+not-found`, A1–A8 backend adds, nginx SEO rules, Search Console.
3. **Indexable:** `/`, home, search hub shell, `/top-selling`, `/product/:slug` (gated), `/category/:slug` (gated), `/mall` + `/mall/:slug` (gated), published policy/CMS/blog/FAQ.
4. **Not indexed:** auth/account/cart/checkout/orders/track/rider/food-stub/jewelery-mock/banners/coupons/filtered/query/paginated/user-specific/dashboard-auth.
5. **Dynamic rendering:** build-time prerender of gated public entities via existing public GETs; location-personalized + private stays CSR.
6. **Metadata:** `mobile/src/lib/seo.ts` templates from entity `seo{}`/title/desc/images/price/ratings + `AppConfig.seo` fallback; unique per URL.
7. **Sitemap:** server-owned `GET /sitemap.xml` index + shards, gated, capped, cached 1h, referenced by robots + Console.
8. **robots.txt:** server/env-aware storefront file (§17) + dashboard `robots.ts` + per-page noindex.
9. **Canonicals:** apex https, slug-only entity URLs, id→slug 301, clean collection URLs, lowercase no-slash (§16).
10. **Backend:** A1–A8 additive only (§26).
11. **Database:** no v1 migration; optional v2 `slugHistory` (§27).
12. **Frontend:** §28 edits; native/auth/payments/rider/jewelery-contexts untouched.
13. **Deploy:** static export + inner/host nginx fallback + cache/301 rules; no DNS change; CI same 3-image flow (§30).
14. **Risks:** §39 (spike-first, bounded prerender, no-secret bake, matrix-tested).
15. **First:** S0 spike → caps/limiter → slug lookups + compat → category/mall-slug/not-found/seo-helper → static switch → sitemap/robots → Console (§38).
16. **NOT changed:** §36 must-not-change list (auth/refresh, roles, Razorpay split, vault, order/verify state machines, rider, env contracts, ports/networks, jewelery mocks, native configs).

---

## 42. Success Criteria

```text
✓ mobile/ exports with web.output:static; per-route HTML contains unique title/meta/canonical/OG/JSON-LD (view-source verified)
✓ Android/iOS flows intact (auth, cart→Razorpay→verify→sub-orders→rider→returns, deep-links) — §35 matrix green
✓ Gated public pages crawlable without JS (curl HTML contains product/category/mall core content)
✓ Private/mock/transactional pages emit noindex,nofollow and are absent from sitemap
✓ /product/:id and /mall/:id resolve to canonical slug URLs (redirect + canonical)
✓ Sitemap index + shards valid, capped, lastmod-correct; robots.txt correct per env; sitemap submitted
✓ Unknown/deleted/unpublished slugs return real 404 (no soft-200); empty/thin pages noindexed + excluded
✓ No PII/tokens/secrets in prerendered HTML; fcm-token anomaly dispositioned
✓ Lighthouse ≥90 performance on /, PDP, category, mall detail; LCP/CLS/INP acceptable; no console-secret leaks
✓ quickbihar.in serves prerendered HTML (apex), www 301s, HTTPS+HSTS intact, dashboard.* unaffected
✓ Search Console property verified; coverage shows indexed slug URLs with correct canonicals; no soft-404/redirect-error spikes
```

No ranking position is promised. This plan delivers technical eligibility + discoverability; rankings depend on competition, content depth, authority, and demand.

---

*End of plan. Awaiting explicit approval before any implementation (per §53 no-implementation rule of the source brief).*




Mostly yes, but I won't call it perfect — here's the honest scorecard:

**Proven working ✅**
- Sitemap/robots serve live and valid (tested against a booted server), with correct env-aware robots, cache + rate-limit headers, pagination clamps, slug lookups, 404s
- Static export produces per-route HTML with real hoisted meta (title/description/canonical/OG/robots seen in output files)
- Dashboard noindex confirmed in built HTML; private app routes tagged; JSON-LD matches visible content
- Full server `tsc` zero errors; edited test suite passes; auth/onboarding/settlements suites green

**Not yet proven ❌**
- **Nothing is deployed** — all verification was local. CI export, VPS deploy, and real Google crawling haven't happened
- **The catalog is empty** (0 products/categories/malls in prod). Technical SEO with zero indexable entities earns zero traffic. This is the single biggest "is SEO working" blocker and it's a content problem, not a code problem
- Detail-page meta renders client-side post-hydration; Google handles that, but it means Bing/social scrapers see shells until the catalog + rebuild cadence exist
- No Search Console data, no rankings, no CWV field data — those only come weeks after deploy

So: the implementation is complete and locally verified, but "SEO works" can only be claimed after deploy + content + indexing are observed. Don't mistake shipped code for working SEO — the next milestones are populate the catalog, deploy, submit the sitemap, and watch coverage.