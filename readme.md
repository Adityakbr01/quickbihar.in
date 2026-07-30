# QuickBihar.in

QuickBihar.in is a **hyperlocal, multi-vertical commerce platform** built as a three-app monorepo: a customer storefront, a web dashboard for admins and sellers, and a backend API with realtime delivery orchestration.

Clothing is the live vertical today. The codebase has been deliberately restructured around a **`common` (vertical-agnostic) + `clothing` (apparel-specific)** seam so that **food** and **jewelery** verticals can be added later without rewrites.

> **Status:** Clothing ships end-to-end — discovery → cart → checkout → payment → multi-seller fulfillment → rider delivery → returns. The `food` and `jewelery` folders exist as scaffolded placeholders on the [roadmap](#roadmap), not yet implemented.

---

## Table of contents

- [Overview](#overview)
- [Monorepo layout](#monorepo-layout)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [The `common` vs `clothing` seam](#the-common-vs-clothing-seam)
- [Roles and surfaces](#roles-and-surfaces)
- [Backend module map](#backend-module-map)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [Testing](#testing)
- [Build and deployment](#build-and-deployment)
- [Core product flows](#core-product-flows)
- [Conventions](#conventions)
- [Documentation](#documentation)
- [Roadmap](#roadmap)

---

## Overview

QuickBihar is a marketplace where local stores sell to nearby customers, and independent riders handle last-mile delivery. Everything is location-first: customers only see products from stores that can actually deliver to their pincode/GPS, and orders split per-seller into sub-orders that are fulfilled and tracked independently.

There are four user surfaces backed by one API:

| Surface | App | Users | Purpose |
| --- | --- | --- | --- |
| Storefront | `mobile/` (Expo → Android/iOS + web export) | Customers | Browse, cart, checkout, track orders, returns |
| Admin dashboard | `web/` (Next.js) | Admin / ops | Catalog, sellers, riders, orders, notifications, settings |
| Seller dashboard | `web/` (Next.js) | Sellers | Store setup, products, orders, payouts, inventory |
| Rider workspace | `mobile/` (+ web paths) | Riders | Accept jobs, pickup, deliver, COD settlement, returns |

---

## Monorepo layout

```
quickbihar.in/
├── mobile/          Expo Router app (customer storefront + rider workspace)
├── server/          Bun + Express + Mongoose API, Socket.IO, BullMQ workers
├── web/             Next.js dashboard (admin + seller + delivery)
├── docs/            Architecture, TRD, launch readiness, wire-flow audit
├── deploy/          Deployment configs
├── nginx/           Reverse-proxy config (default.conf)
├── docker-compose.yml
└── readme.md
```

Each app is an independent package with its own `package.json`, dependencies, and TypeScript config — there is no root workspace/package manager. Install and run each app from its own directory.

---

## Tech stack

**`mobile/` — Expo storefront & rider app**

- Expo SDK ~56, React Native 0.85, React 19, **expo-router** (typed routes)
- **Zustand** (auth/global state), **TanStack Query** + AsyncStorage persistence (server cache)
- **Axios** REST client, **Socket.IO client** for realtime order/delivery updates
- **react-hook-form + Zod** forms, **react-native-razorpay** checkout
- Reanimated 4, Hugeicons, Lottie; run scripts use **Bun** (`bun expo start`)

**`server/` — Bun + Express API**

- **Bun** runtime, **Express 5**, **Mongoose 9** (MongoDB)
- **Socket.IO** realtime, **BullMQ + ioredis** (Redis-backed queues/workers)
- **JWT** access/refresh auth + custom **RBAC** (roles & permissions)
- **Razorpay** (payments/refunds), **ImageKit** (media), **Firebase Admin** (FCM push), **Resend** (email)
- **PDFKit / bwip-js** (invoices & barcodes), **Zod** validation
- TypeScript path alias: `@/*` → `src/*`

**`web/` — Next.js dashboard**

- **Next.js 16** (App Router), React 19, **Tailwind CSS 4**, shadcn / Radix / Base UI
- **TanStack Query** + **Zustand**, **react-hook-form + Zod**
- **Recharts** (analytics), **Socket.IO client**, **xlsx** (exports), **sonner** (toasts)

> ⚠️ `web/AGENTS.md`: this Next.js version has breaking changes vs. common knowledge — read the relevant guide in `web/node_modules/next/dist/docs/` before writing web code.

**Shared infrastructure:** MongoDB Atlas · Redis · Nginx reverse proxy · Docker Compose · GitHub Actions CI/CD → Docker Hub → self-hosted VPS.

---

## Architecture

All traffic enters through Nginx and is routed by path:

```
                         ┌─────────────────────────────┐
  Customer / Rider ─────▶│                             │──▶ /,  /mall, /product, /checkout ─▶ Expo static storefront
  Admin / Seller   ─────▶│   Nginx reverse proxy       │──▶ /admin, /seller, /delivery, /_next ─▶ Next.js (web :3000)
                         │   quickbihar.in             │──▶ /api/v1  ─────────────────────────▶ Bun + Express API (:8000)
                         │                             │──▶ /socket.io ───────────────────────▶ Socket.IO (realtime)
                         └─────────────────────────────┘
                                                              │
                        MongoDB Atlas · Redis · ImageKit · Razorpay · Firebase FCM · Resend
```

- **REST** over `/api/v1` is the source of truth; **Socket.IO** is layered on top for realtime UX (order/delivery/notification events).
- Clients recover missed realtime updates by replaying the **fulfillment event feed** — sockets improve UX, but DB state is authoritative.
- Full diagrams (system, data ownership, per-role flows, deployment) live in [`docs/ARCHITECTURE_AND_FLOWS.md`](docs/ARCHITECTURE_AND_FLOWS.md).

---

## The `common` vs `clothing` seam

To support future verticals, shared code is separated from apparel-specific code on every layer. New verticals (food, jewelery) are dropped into their own folders without touching `common`.

**Server** — `server/src/modules/`
- `common/` — auth, user, rbac, order, cart, coupon, notification, banner, category, delivery, deliveryBoy, fulfillment, admin, socket, savedAddress, paymentMethod, onboarding, appConfig, label, mall, refundPolicy, wishlist, store, seller
- `clothing/` — products, sizeChart

**Mobile** — `mobile/src/features/`
- `common/` — account, address, admin, banner, cart, category, coupon, notification, order, profileInfo, refundPolicy, trackOrder, wishlist, auth
- `clothing/` — home, product, search, sizeChart
- `Delivery/`, `Onboarding/` — cross-role features; `Food/`, `Jewelery/` — placeholders

**Web** — `web/src/features/` (`auth`, `dashboard`, `seller`, `delivery`, `onboarding`). Clothing coupling here is embedded inside shared admin/seller panels; files are marked `// CLOTHING-SPECIFIC — see multi-vertical milestone` for later extraction.

---

## Roles and surfaces

Roles are defined in the server `RoleEnum` and drive RBAC seeding (`server/src/db/rbacSeed.ts` upserts one Role per enum member):

| Role | Where they work | Notes |
| --- | --- | --- |
| `USER` | Mobile storefront | Default customer |
| `SELLER` | Web seller dashboard | Store owner; clothing store type today |
| `DELIVERY` | Mobile rider workspace | Rider. `"RIDER"` is a legacy **alias** (`RIDER_ROLE_ALIAS`), intentionally *not* a separate enum member so it never seeds a phantom role |
| `ADMIN` | Web admin dashboard | Operations |
| `SUPER_ADMIN` | Web admin dashboard | Full access |

Post-login landing is role-based (`getRoleLandingRoute`): admins → admin tab, riders → rider tab, everyone else → shopping home.

---

## Backend module map

```
auth → user
onboarding → store → products → cart → order
store → order → delivery → fulfillment → notification
admin → rbac / onboarding / order / delivery
```

Key domain concepts:

| Concept | Meaning |
| --- | --- |
| Parent order | Customer-level order with all items + payment |
| Sub-order | Per-seller split of a parent order (multi-seller → multiple sub-orders) |
| Store serviceability | Whether a store can deliver to a given pincode/GPS point |
| Rider offer | A delivery job broadcast to eligible riders |
| Fulfillment event | Durable realtime event used to recover missed updates after disconnects |
| COD liability | Rider wallet value tracking cash collected but not yet deposited |

---

## Getting started

**Prerequisites**

- [Bun](https://bun.sh) (server runtime + mobile dev scripts)
- Node.js 20+ (web / Expo tooling)
- MongoDB (Atlas or local) and Redis
- Accounts/keys for Razorpay, ImageKit, Firebase (FCM), Resend

**Install** (per app — no root install):

```bash
cd server && bun install
cd ../web && npm install
cd ../mobile && npm install
```

**First-run server setup** (seed RBAC roles/permissions and the admin account):

```bash
cd server && bun run rbac:seed
```

---

## Environment variables

The server validates its env at boot with Zod — see [`server/src/config/env.config.ts`](server/src/config/env.config.ts) (missing/invalid values exit the process). Create `server/.env`:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `8000` | API port |
| `MONGODB_URI` | **yes** | — | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | **yes** | — | JWT signing secrets (min 8 chars) |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` | no | `1d` / `10d` | JWT lifetimes |
| `CORS_ORIGIN` | no | `*` | Comma-separated allowlist (also mirrored to Socket.IO) |
| `REDIS_URL` | no | `redis://localhost:6379` | BullMQ / realtime support |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | seeded defaults | Bootstrap admin (change in prod) |
| `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL_ENDPOINT` | **yes** | — | Media storage |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **yes** | — | Payments / refunds |
| `RAZORPAY_WEBHOOK_SECRET` | no | — | Webhook signature verification |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | **yes** | — | FCM push |
| `RESEND_API_KEY` | no | — | Transactional email |

Tunable business rules also live here: rider matching radius, COD liability cap, return window (`RETURN_WINDOW_DAYS`), rider payout tiers, and `MARKETPLACE_COMMISSION_PERCENT`.

**Web** (`web/.env`): `NEXT_PUBLIC_API_URL` (e.g. `/api/v1`) and `NEXT_PUBLIC_SOCKET_URL` (e.g. `/`).

**Mobile:** API origin is configured in the app's Axios instance / Expo config — point it at your API host for device/emulator testing.

---

## Running locally

**Server** (`server/`, http://localhost:8000):

```bash
bun run dev
```

**Web** (`web/`, http://localhost:3000):

```bash
npm run dev
```

**Mobile** (`mobile/`):

```bash
bun run dev        # expo start -c
npm run android    # native Android
npm run ios         # native iOS
npm run web         # web preview
```

Bring up Redis quickly with Docker if you don't have it locally:

```bash
docker run -p 6379:6379 redis:alpine
```

Useful server maintenance scripts: `bun run db:import`, `bun run rbac:seed`, `bun run repair:partner-roles`, `bun run settlements:sync-indexes`, `bun run settlements:backfill`.

---

## Testing

Server tests run on Bun's test runner ([`server/src/_tests_`](server/src/_tests_)):

```bash
cd server
bun run test:auth
bun run test:onboarding
bun run test:rbac
bun run test:settlements
bun run test:all
```

Type-check any app without emitting:

```bash
node_modules/.bin/tsc --noEmit
```

> Note: running the auth/onboarding/rbac suites together can show shared-state failures that don't reproduce when the files are run individually — prefer per-file runs when triaging.

---

## Build and deployment

Production runs as Docker containers behind Nginx, orchestrated by [`docker-compose.yml`](docker-compose.yml):

| Service | Container | Port | Role |
| --- | --- | --- | --- |
| `redis` | quickbihar-redis | 6379 (internal) | Queues / realtime support |
| `server` | quickbihar-server | 8000 | Bun + Express API |
| `web` | quickbihar-web | 3000 | Next.js dashboard |
| `mobile-web` | quickbihar-mobile-web | — | Expo web export (storefront) |
| `proxy` | quickbihar-proxy | 80 | Nginx reverse proxy |

```bash
docker compose up -d --build
```

**CI/CD:** pushing to `master` triggers GitHub Actions to build the server and web images, publish to Docker Hub, then a self-hosted VPS runner pulls and runs `docker compose up -d` behind Nginx. Per-app production builds: `bun run build` (server), `npm run build` (web), `npm run build:web` / EAS profiles (mobile).

**Single-domain launch targets:** API `https://quickbihar.in/api/v1`, socket `https://quickbihar.in`, CORS `https://quickbihar.in,https://www.quickbihar.in`, TLS via Certbot before public launch. Full checklist in [`docs/LAUNCH_READINESS.md`](docs/LAUNCH_READINESS.md).

---

## Core product flows

Detailed sequence/state diagrams for each flow are in [`docs/ARCHITECTURE_AND_FLOWS.md`](docs/ARCHITECTURE_AND_FLOWS.md). In short:

- **Discovery** — customer provides pincode/GPS → serviceability check → local-first product feed (only active, approved products from stores that can deliver).
- **Checkout** — quote → order create → Razorpay order → payment → **verify**. Stock is deducted and per-seller sub-orders are created only at payment verification; all critical gates (serviceability, store-open, stock, coupon) are re-checked server-side.
- **Fulfillment** — sub-order broadcast to eligible riders → accept → pickup (OTP/proof) → in-transit → delivery (OTP/proof), tracked as a rider state machine.
- **Returns** — return request within window → rider pickup + QC → seller receipt → Razorpay refund.
- **Realtime** — order/delivery/notification events over Socket.IO, mirrored to a durable notification outbox (push via FCM, in-app, email via Resend); consumers are idempotent by event id.

---

## Conventions

- **Path aliases:** `@/*` maps to each app's source root (`src/*` on server, project root on mobile/web). Prefer alias imports over deep relative paths; never import one route file from another.
- **Function-based modules (server):** services/controllers are plain exported functions, not classes or singletons — see [`rule.md`](rule.md) for the full refactor guide (namespace imports, Zod error pattern, JSDoc headers).
- **Socket events:** three parallel `socketEvents.ts` files (server/mobile/web) must stay in sync; use the `SocketEvents` constants, never raw string literals.
- **Roles:** add real roles to `RoleEnum` (they get seeded); use `RIDER_ROLE_ALIAS` for the legacy `"RIDER"` string rather than a bare literal.
- **Server-side validation is authoritative:** frontend checks are UX only; re-validate stock, serviceability, and store-open state on quote and order.
- **Commits:** each commit message ends with a `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

## Documentation

| Doc | Contents |
| --- | --- |
| [`docs/ARCHITECTURE_AND_FLOWS.md`](docs/ARCHITECTURE_AND_FLOWS.md) | System architecture, module map, per-role flows, deployment diagrams |
| [`docs/TRD.md`](docs/TRD.md) | Technical requirements |
| [`docs/LAUNCH_READINESS.md`](docs/LAUNCH_READINESS.md) | Production launch checklist |
| [`docs/WIRE-FLOW-AUDIT-TODO.md`](docs/WIRE-FLOW-AUDIT-TODO.md) | Live wire-flow audit: known issues (C/H/M/L) and fix status |
| [`rule.md`](rule.md) | Module refactoring rules (class → function-based) |

---

## Roadmap

The platform is architected for three verticals. **Clothing** is live; **food** and **jewelery** are the next milestone (placeholder folders already scaffolded). Planned work, in order:

1. **Schema generalization (server):** extend `StoreType`/`sellerType` to `CLOTHING | FOOD | JEWELERY`; make product `variants`/`size`/`color` conditional per vertical; add food fields (veg/nonveg, expiry, weight) and jewelery fields (metal, purity, hallmark, gemstone).
2. **Seller onboarding:** vertical selector + per-vertical product forms.
3. **Web dashboards:** render product forms dynamically by `store.type`.
4. **Mobile:** vertical-parameterized feature tree; add `food` and `jewelery` route trees.
5. **Catalog:** per-vertical category discriminator.

Open correctness/security items (payment races, credential hardening, HTTPS/domain migration, return state machine, etc.) are tracked in [`docs/WIRE-FLOW-AUDIT-TODO.md`](docs/WIRE-FLOW-AUDIT-TODO.md).

