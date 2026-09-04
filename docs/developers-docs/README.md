# QuickBihar.in — Developer Documentation

> **Last updated:** 2026-09-04
> **Audience:** New developers, senior engineers, and anyone onboarding to this codebase.
> **Tone:** English-first, code-anchored. Every claim is verified against the actual source.

---

## What this is

This is the developer documentation for the `quickbihar.in` monorepo — a hyperlocal multi-vertical commerce platform. The currently-live vertical is `clothing`; `food` and `jewelery` are scaffolded but not production-ready.

The platform is built as three apps:

| App | Tech | Role |
|-----|------|------|
| `server/` | Bun + Express 5 + Mongoose 9 + TypeScript | The brain — API, DB, realtime, queues, payments |
| `web/` | Next.js 16 + React 19 + Tailwind 4 | Admin / Seller / Delivery portals |
| `mobile/` | Expo SDK 56 + React Native 0.85 + expo-router | Customer + Rider app |

The docs are reverse-engineered from the source. Anything that can't be verified in the code is flagged with a `⚠️` warning. If you find the docs contradicting the code, **the code is the truth** — please open a PR to fix the doc.

---

## How to read

If you are **new to the project**, read in this order:

```
1. getting-started/overview.md            — what we're building and why
2. getting-started/folder-structure.md     — where everything lives
3. getting-started/system-architecture.md  — how the 3 apps talk
4. features/authentication.md             — how sessions work (Google-first now)
5. features/authorization-rbac.md         — roles, permissions, route gates
6. features/orders.md                     — the core commerce flow
7. features/payments.md                   — Razorpay, COD, pricing engine
```

Then dive into whatever you need: `apps/server.md` for the backend layer, `data/database.md` for schemas, `features/products.md` for the catalog, etc.

If you are **looking for something specific**, jump straight from the index below.

---

## Index

### 🏛️ Getting started

| Doc | What you'll find |
|-----|------------------|
| [overview.md](./getting-started/overview.md) | The product, the verticals, the business model, the honest "what's not built yet" notes |
| [folder-structure.md](./getting-started/folder-structure.md) | Every folder's purpose, what is safe to edit, what is not |
| [system-architecture.md](./getting-started/system-architecture.md) | How the 3 apps communicate, the high-level diagram, the deployment topology |

### 💻 Apps

| Doc | What you'll find |
|-----|------------------|
| [web-dashboard.md](./apps/web-dashboard.md) | The Next.js admin / seller / delivery portals |
| [server.md](./apps/server.md) | The Express + Mongoose backend — layers, conventions, request lifecycle |
| [mobile-app.md](./apps/mobile-app.md) | The Expo customer + rider app — navigation, modules, build flow |
| [api-flow.md](./apps/api-flow.md) | A single API request from middleware stack to DB and back |

### 🗄️ Data

| Doc | What you'll find |
|-----|------------------|
| [database.md](./data/database.md) | All MongoDB collections, fields, indexes, and relations |
| [caching.md](./data/caching.md) | Redis usage, in-memory caches, the reset-token replay store |

### ⚙️ Features

| Doc | What you'll find |
|-----|------------------|
| [authentication.md](./features/authentication.md) | Google OAuth (primary) + password (secondary), JWT, refresh rotation, cookies |
| [google-oauth.md](./features/google-oauth.md) | Google Cloud Console setup, all URLs/URIs, .env templates, audience checks |
| [authorization-rbac.md](./features/authorization-rbac.md) | Roles, permission matrix, middleware gates |
| [products.md](./features/products.md) | Product model, variants, stock, approval flow |
| [orders.md](./features/orders.md) | Order → SubOrder split, the Phase 9 phone-call confirmation step, fulfillment |
| [payments.md](./features/payments.md) | Razorpay, COD, signature verify, refunds, the HYBRID_MARKETPLACE_V1 pricing engine |
| [file-uploads.md](./features/file-uploads.md) | ImageKit + multer image upload |
| [notifications.md](./features/notifications.md) | Push (FCM/Expo), BullMQ worker, socket gateway, outbox pattern |

### 🔧 Operations

| Doc | What you'll find |
|-----|------------------|
| [environment.md](./operations/environment.md) | Every env var, Zod fail-fast validation, required vs optional, production secrets |

---

## Golden rules (read these first)

1. **The code is the truth.** If this doc contradicts the code, the code wins. Open a PR to fix the doc.
2. **`common` vs `clothing` seam.** `server/src/modules/common/*` is vertical-agnostic (shared by every business type). `server/src/modules/clothing/*` is clothing-only. This distinction is the most important thing to get right when adding a new vertical.
3. **Database is the source of truth for realtime.** Socket.IO is only the notification path. The real state always lands in the DB (FulfillmentEvent + NotificationOutbox) first. The mobile app is allowed to trust the DB and treat sockets as best-effort.
4. **Money is in paise, not rupees.** Razorpay works in paise (₹1 = 100 paise). The pricing engine uses `roundMoney` to avoid rounding bugs.
5. **Stock is secured before a sub-order is confirmed.** Every sub-order sits in `PENDING_SELLER_CONFIRMATION` until the seller calls the customer; once the seller confirms, the parent Order rolls up to `CONFIRMED`. Stock was already atomically deducted in `finalizePendingConfirmation` immediately after payment — see [orders.md](./features/orders.md).

---

## How the docs are organized

- **Folders group by concern**, not by doc number. New docs slot into the folder that matches their topic without renumbering anything.
- **Cross-references are relative paths** — click a link in GitHub, VS Code, or any markdown viewer and you land on the right file.
- **English only.** Code comments may still be in Hinglish in some places (intentional — engineers find it readable), but docs are English so a global team can onboard.

---

## Verification note

Every claim in these docs has been verified against the codebase as of **2026-09-04**. Anything that couldn't be verified in the code is flagged with a `⚠️` warning and a one-line reason. If you find one of these notes, it means the team wants a human to look at that specific spot before relying on the doc.
