# QuickBihar — Testing Stack & Quality Infrastructure

**Date**: October 17, 2026  
**Auditor**: QA Automation Engineer & DevOps Specialist  
**Standard**: Production Readiness Audit  

---

## 1. Testing Stack by Application Layer

| Application | Primary Test Engine | Quality Checks / Linters | Bundler / Build Verification | Command |
|---|---|---|---|---|
| **`server`** | `bun:test` | TypeScript strict mode, Zod schemas | `bun build --target bun` | `bun test` |
| **`user-web`** | Vite SSG Prerenderer (96 pages) | `oxlint`, `tsc -b` | Vite 8 + Rolldown/Babel | `npm run typecheck && npm run lint && npm run build` |
| **`dash-web`** | Component test harness | `oxlint`, `tsc -b` | Vite 8 + Rolldown/Babel | `npm run typecheck && npm run lint && npm run build` |
| **`mobile`** | `jest` / `jest-expo` | `eslint` (Expo configuration) | `bun expo prebuild` / `eas build` | `bun run lint` |

---

## 2. Detailed Tooling Analysis

### 2.1 Backend API (`server/`)
- **Native Test Runner**: Bun's built-in `bun:test` runner is utilized for blazing fast sub-second test execution.
- **Mocking**: Bun's native `mock` and `mock.module` primitives allow isolated unit and integration testing without external runner overhead.
- **Database Integration**:
  - Unit tests stub out DAOs (`ProductDAO`, `orderDAO`, `savedAddressDAO`) for deterministic unit checks.
  - Integration tests run against isolated MongoDB collections.
- **Coverage Areas**:
  - Authentication (JWT generation, password hashing, Google token verification).
  - RBAC permission enforcement middleware (`requirePermission`).
  - Order pricing calculations, distance calculations, rain weather surcharges.
  - Razorpay order creation, HMAC signature verification, and webhook handling.
  - Cancellation refunds and stock restoration.
  - Rider COD liability ceiling and deposit settlement.

---

### 2.2 Customer Storefront (`user-web/`)
- **Type Safety**: TypeScript 6.0 (`tsc -b`) verifies 100% type soundness across state, components, and API client layers.
- **Linting**: High-speed Rust-based `oxlint` validates syntax, React rules, and code standards in under 200ms across 340+ files.
- **Static Site Generation (SSG) Prerender Verification**:
  - `vite-prerender-plugin` prerenders 96 critical landing pages, product details, mall pages, and location directories at build time.
  - Any broken route, missing SEO tag, or hydration-breaking runtime error causes the build to fail immediately.

---

### 2.3 Dashboard (`dash-web/`)
- **Type Safety**: Complete TypeScript project references (`tsc -b`).
- **Code Standards**: `oxlint` enforcing modern React and hooks integrity.
- **Build Pipeline**: Production bundle compilation verifies all panels (Admin, Seller, Delivery, Inventory, Reports) build with zero unresolved references.

---

### 2.4 Mobile Storefront & Rider App (`mobile/`)
- **Linter**: `expo lint` utilizing `@react-native/eslint-config` and `eslint-config-expo`.
- **React Compiler Strict Rules**: Enforces component purity, prevents impure executions inside `useRef`, and mandates proper declaration ordering.

---

## 3. Standard Verification Commands

```bash
# 1. Backend tests and compilation
cd server && bun test
cd server && bun run build

# 2. Customer web storefront verification
cd user-web && npm run typecheck
cd user-web && npm run lint
cd user-web && npm run build

# 3. Operations dashboard verification
cd dash-web && npm run typecheck
cd dash-web && npm run lint
cd dash-web && npm run build

# 4. Mobile app code quality
cd mobile && bun run lint
```
