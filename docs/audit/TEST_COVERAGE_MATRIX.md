# QuickBihar — Test Coverage Matrix & Traceability Report

**Date:** 2026-10-17  
**Scope:** Hyperlocal Marketplace (`server`, `user-web`, `dash-web`)  
**Overall Execution Result:** **83 Tests Passing / 0 Failing (100% Pass Rate)**

---

## 1. Role-Based Feature & Test Mapping

| User Role | Critical User Journey | Automated Test Suite | Test Count | Pass Status |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Registration, Login, Google Auth, Refresh Token, Logout | `server/src/_tests_/auth.test.ts` | 7 | **PASS (100%)** |
| **Customer** | Store Discovery, Geolocation Nearby Filter, Catalog Browsing | `server/src/_tests_/store.test.ts` | 8 | **PASS (100%)** |
| **Customer** | Top Selling Products Analytics & Display | `server/src/_tests_/topSelling.test.ts` | 1 | **PASS (100%)** |
| **Customer** | Order Cancellation, Payment Refund Calculation | `server/src/_tests_/cancellationRefund.test.ts` | 6 | **PASS (100%)** |
| **Customer** | Return Request, Return Claim, Return Refund Flow | `server/src/_tests_/return.test.ts` | 5 | **PASS (100%)** |
| **Seller** | Inventory Management, SKU Stock Updates, Audit Logs | `server/src/_tests_/sellerInventory.test.ts` | 3 | **PASS (100%)** |
| **Seller** | Delivered Sub-Order Settlements, Wallet Balancing | `server/src/_tests_/sellerSettlement.test.ts` | 4 | **PASS (100%)** |
| **Seller / Rider**| Partner Onboarding, Document Submission & Review | `server/src/_tests_/onboarding.test.ts` | 5 | **PASS (100%)** |
| **Rider** | Delivery Assignment, Geo-Claiming, Status Tracking | `server/src/_tests_/legacyDeliveryRoutes.test.ts` | 2 | **PASS (100%)** |
| **Admin** | Role & Permission Assignment, RBAC Enforcement | `server/src/_tests_/rbac.test.ts` | 5 | **PASS (100%)** |
| **Admin** | Partner Earnings, Commission Splits, Payouts | `server/src/_tests_/adminPartnerInsights.test.ts` | 20 | **PASS (100%)** |
| **System** | End-to-End Fulfillment, Order State Machine, Payment Webhook | Integration & Order State Tests | 17 | **PASS (100%)** |
| **TOTAL BACKEND** | **Entire Hyperlocal Marketplace Core** | **16 Test Suites** | **83** | **PASS (100%)** |

---

## 2. Frontend Automated Unit & Integration Test Suites

| Frontend Application | Test Suite Path | Functional Domain Verified | Test Count | Pass Status |
| :--- | :--- | :--- | :--- | :--- |
| **`user-web`** | `src/__tests__/cartStore.test.ts` | Cart calculations, multi-storefront module routing, totals, coupon isolation | 7 | **PASS (100%)** |
| **`user-web`** | `src/__tests__/seoSite.test.ts` | Brand constants, canonical URLs, query/hash normalization, apex origin | 6 | **PASS (100%)** |
| **`user-web`** | `src/__tests__/validation.test.ts` | Email formats, password complexity scoring, length validation | 9 | **PASS (100%)** |
| **`dash-web`** | `src/__tests__/rbac.test.ts` | Multi-role parsing, role normalization, admin bypass, permission matching | 11 | **PASS (100%)** |
| **`dash-web`** | `src/__tests__/authSchema.test.ts` | Sign-in Zod schema, partner phone enforcement, Google OAuth token rules | 9 | **PASS (100%)** |
| **TOTAL FRONTEND** | **Web Apps (user-web & dash-web)** | **5 Test Suites** | **42** | **PASS (100%)** |
| **TOTAL PLATFORM** | **Full System (Backend + Frontends)** | **21 Test Suites** | **125** | **PASS (100%)** |

---

## 3. Frontend Application Build & Compilation Matrix

| Application | Technology | Typecheck Command | Test Command | Build Command | Execution Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`user-web`** | React 19, Vite, TailwindCSS | `bun run typecheck` | `bun run test` | `bun run build` | **PASS (96 Static SSG Pages, 22 Tests Pass)** |
| **`dash-web`** | React 19, Vite, TypeScript | `bun run typecheck` | `bun run test` | `bun run build` | **PASS (3,963 Modules, 20 Tests Pass)** |
| **`server`** | Bun, Express, TypeScript | Native in Bun | `bun test` | `bun run build` | **PASS (176 Modules Minified, 83 Tests Pass)** |

---

## 3. Test Execution Command Reference
To re-run the complete verification suite locally at any time:

```bash
# 1. Backend Automated Test Suite
cd server
bun test

# 2. Backend Production Build
bun run build

# 3. Customer Web Application Build & Prerender
cd ../user-web
bun run build

# 4. Operations Dashboard Build
cd ../dash-web
bun run build
```
