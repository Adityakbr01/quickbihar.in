# QuickBihar — Wire-Flow Audit & Fix TODO

> Full-stack audit across **server** (Node/TS/Express/Mongo), **mobile** (Expo RN), **web** (Next.js).
> Roles: **USER** (customer), **SELLER**, **RIDER/DELIVERY**, **ADMIN / SUPER_ADMIN**.
> Generated: 2026-07-29.

---

## 0. How each role is wired today (the actual flow)

| Role | Client | Entry | State of wiring |
|------|--------|-------|-----------------|
| **User** | Mobile app | `/(tabs)/clothing/*` | ✅ Full shopping flow real-API: home → product → cart → checkout (Razorpay) → order-success → track-order. |
| **Seller** | Web dashboard | `/seller/dashboard` | ✅ Broad & functional (products, orders, inventory, coupons, payouts) — **but clothing-only**. No mobile seller app. |
| **Rider** | Web dashboard **and** mobile | web `/delivery/dashboard`, mobile `/rider` + `(tabs)/clothing/rider` | ✅ Full lifecycle wired. ✅ Web active-order panel status strings fixed (H6, `91a1e1b`). ⚠️ proof-of-delivery is a stub (M7). |
| **Admin** | Web dashboard **and** mobile | web `/admin/dashboard`, mobile `/admin/*` | ✅ Web is comprehensive & real-API. ⚠️ **SUPER_ADMIN is locked out of the admin API.** Mobile has 2 dead cards. |

**Backbone health:** Auth/JWT + RBAC, order lifecycle, seller settlement, and the geospatial rider-matching engine are all genuinely implemented end-to-end. Role enums and REST routing are **consistent** across all three layers. The problems are concentrated in: multi-vertical support, a handful of broken routes/guards, COD, and real-time delivery through nginx.

---

## ⭐ TASK 1 (DO FIRST) — Restructure modules into `common` + `clothing` (multi-vertical foundation) — ✅ DONE

> **Goal:** stop clothing from being hardwired everywhere. Extract everything shared across verticals into a `common` module, and isolate clothing-specific code into its own `clothing` module. Food & jewelery are **NOT implemented now** — this refactor just creates the structure so they can be dropped in later without rewrites.
> **This is a pure restructure — no behavior change.** Do it before the multi-vertical roadmap (§ below); that roadmap depends on this split.
> **Status:** completed in 3 commits — mobile `6d04bec`, server `a95070f`, web `2d95a8f`. Each verified against a clean-master baseline (typecheck parity + build).

**Guiding rule for the split:**
- **`common`** = anything a food or jewelery vertical would reuse unchanged: auth, user/profile, address, cart, order/checkout/payment, coupon, notification, banner, category, delivery/rider, admin, RBAC, socket, settlements.
- **`clothing`** = anything apparel-specific: products with `size`/`color` variants, size charts, apparel attributes (fit/pattern/material/collar/sleeve), clothing store config, clothing home/product-listing UI.

- [x] **T1.1 — Mobile:** split `mobile/src/features/Clothings/*` (committed `6d04bec`, 176 renames).
  - → `features/common/` (13): account, address, admin, banner, cart, category, coupon, notification, order, profileInfo, refundPolicy, trackOrder, wishlist. (`auth` was already in common.)
  - → `features/clothing/` (4, renamed from `Clothings`): home, product, search, sizeChart.
  - Boundary-crossing relative imports rewritten to `@/src/features/{common,clothing}/…` aliases; Food/Jewelery placeholder screens repointed to `@/src/features/clothing/home/…`. tsc parity confirmed (96→96 errors, 0 new TS2307).
  - ↩ Deferred: activating the vestigial `rootSlug` prop as the vertical key (`HomeScreen.tsx:24`) — belongs to the multi-vertical milestone, not this pure move.
- [x] **T1.2 — Server:** reorganize `server/src/modules/*` (committed `a95070f`, 168 renames).
  - Added `@/* → src/*` tsconfig path alias (Bun resolves natively — zero new deps); converted all cross-module + `src/`-level relative imports to depth-independent `@/` aliases.
  - `modules/clothing/`: products (variant/size/color), sizeChart.
  - `modules/common/` (24): admin, appConfig, auth, banner, cart, category, coupon, delivery, deliveryBoy, fulfillment, label, mall, notification, onboarding, order, paymentMethod, rbac, refundPolicy, savedAddress, seller, socket, store, user, wishlist.
  - Route mount paths (`/api/v1/…`) unchanged. Dropped the duplicate `userRouter` mount (L1). Verified: tsc = 0, `bun build` bundles 159 modules, test pass/fail identical to master (13/10 — the 10 are pre-existing env/DB failures).
  - ↩ Deferred tech debt: extract a `StoreType` vertical registry and the common→clothing back-edges (products imported by cart/wishlist/order/coupon/seller/admin/mall). `store`/`seller` currently sit whole in `common/` with clothing bits referenced via alias.
- [x] **T1.3 — Web:** light pass (committed `2d95a8f`). Deleted the dead dashboard mock cluster and added `CLOTHING-SPECIFIC` markers to the coupled surface (2 inline on hardcoded `sellerType`, 6 file headers). Real feature-folder separation deferred — the coupling is embedded inside shared admin/seller panels and can't be cleanly extracted until the food/jewelery conditional logic exists. Verified: tsc = 0, `next build` green (all 12 routes).
- [x] **T1.4 — FOOD/JEWELERY left as empty placeholders** — mobile keeps its `Food`/`Jewelery` placeholder screens (repointed to clothing home header); server/web add nothing until the vertical is built. Structure is now ready to drop them in.
- [x] **T1.5 — Regression pass:** typecheck + build verified on all three layers against clean-master baselines (no functional change). Full 4-role runtime smoke test remains a manual pre-merge step for the user.

> ⚠️ Note: this is a big mechanical refactor touching many imports. Recommend doing it on its own branch, in one focused pass, with a full typecheck before merge. The 3 CRITICAL fixes below are independent and can go before or after — but if the app is live, do C1–C3 first since they're tiny and unblock production.

---

## 🔴 CRITICAL — breaks a core flow in production

- [x] **C1. nginx does not proxy `/socket.io/` → all realtime breaks behind the proxy.** ✅ FIXED (`4e05e01`) — added `/socket.io/` proxy block with Upgrade/Connection headers.
  Server serves Socket.io on default `/socket.io/` (`server/src/modules/socket/socket.service.ts:55`), but `nginx/default.conf` only proxies `/api/`, `/web/`, `/_next/`. Socket handshakes fall through to the static `mobile-web` container. **Fix:** add a `location /socket.io/ { proxy_pass http://server:8000; }` block with `Upgrade`/`Connection` headers. Without this, live order tracking, rider job offers, and notifications all silently fail in prod.

- [x] **C2. Post-purchase navigation is broken (dead route).** ✅ FIXED (`4e05e01`) — both back-handler and "Continue Shopping" now target `/(tabs)/clothing/home`.
  `OrderSuccessScreen.tsx:38` (back handler) and `:187` ("Continue Shopping") both `router.replace("/(tabs)/home")`, which doesn't exist. Correct route is `/(tabs)/clothing/home`. Every paid order dead-ends. **Fix:** point both to the real home route.

- [x] **C3. SUPER_ADMIN is locked out of the entire admin API.** ✅ FIXED (`4e05e01`) — `validateRole` made rest-param (`...roleIds`) and `isAdmin = validateRole(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)`.
  `isAdmin = validateRole(RoleEnum.ADMIN)` matched only `"ADMIN"` (`server/src/middlewares/auth.middleware.ts:49`), so SUPER_ADMIN users got 403 on every `/api/v1/admin` route.

---

## 🟠 HIGH — role/flow is broken or a major requirement is missing

### Multi-vertical (food / jewelery) — the biggest gap
The platform is **clothing-only at the schema level**. Food & jewelery cannot be modeled or ordered without breaking. This is architectural, not a quick fix — see §"Multi-vertical roadmap" below.

- [ ] **H1. Store/seller type enums are clothing-only.** `StoreType` = `[CLOTHING]` (`server/src/modules/store/store.schema.ts:4`); seller `sellerType` = `[CLOTHING]` (`seller.model.ts:139`). Web hardcodes `sellerType:"CLOTHING"` at registration (`web/.../PartnerRegisterForm.tsx:149`, `onboarding.api.ts:34`).
- [ ] **H2. Product schema requires apparel fields.** Every product requires `variants`, every variant requires `size` **and** `color` (`server/src/modules/products/product.model.ts:5,68,185`). SKUs are `size-color`. Food/jewelery fail validation.
- [ ] **H3. Order/sub-order line items require `size` + `color`** (`subOrder.model.ts:135`, `order.type.ts:92`) → checkout breaks for non-apparel even if a product existed.
- [ ] **H4. No FOOD/JEWELERY RBAC domain.** `DomainEnum` = `[CLOTHING, GLOBAL]` (`rbac.types.ts:29`). No per-vertical permission/catalog scoping.
- [ ] **H5. Mobile app has zero seller/food/jewelery surface.** Whole tree is `features/Clothings/*` + `(tabs)/clothing/*`. `rootSlug` prop exists but is vestigial (`HomeScreen.tsx:24`).

### Other HIGH
- [x] **H6. Rider web "Active Orders" uses wrong status strings.** ✅ FIXED (`91a1e1b`) — client-side `activeOrders` filter now uses the shared canonical `activeStatuses`; Step 1/2/3 conditionals and the cancel trigger switched to `ASSIGNED`/`ARRIVING_AT_STORE`/`REACHED_STORE`. Dropdown `<option>` values intentionally kept as SubOrderStatus (`RIDER_*`) — they are server `?status=` query params matched against `SubOrder.status`, the same vocabulary the mobile rider app relies on; documented inline.
  Was: `ActiveOrdersPanel.tsx:42-44,66-71,297` filtered on `RIDER_REACHED_STORE`, `RIDER_ARRIVING`, etc., but the contract (`delivery.api.ts:3-21`, `DeliveryHelpers.tsx:7-18`) uses `REACHED_STORE`, `ARRIVING_AT_STORE`, `OUT_FOR_DELIVERY`. Active jobs got filtered out and workflow buttons never rendered.
- [x] ✅ **FIXED (bcb709a) — H7. COD is architected but unreachable.** `createOrder` always created a Razorpay order; the only COD detector is `razorpayOrderId === "COD"` which was never set. The whole COD subsystem (rider liability, admin settle-COD, `codSettlement.model`) was dead. **Fix applied:** `order.validator` accepts `paymentMethod` (`ONLINE`|`COD`, default ONLINE); `verifyPayment`'s post-confirmation pipeline (stock, coupons, sub-order split, emits) extracted into shared `finalizeConfirmedOrder(order)`; `createOrder` branches on COD → skips Razorpay, persists CONFIRMED + `"COD"` sentinel, runs the same pipeline (sub-order `isCod` now keys off per-seller payable). Mobile: `CreateOrderData.paymentMethod`; CheckoutScreen payment-method selector + COD short-circuit to order-success (null razorpayOrder). Server typecheck clean.
- [x] ✅ **FIXED (1b1d2df) — H8. No role-based landing after login (mobile).** Login/OTP redirected every role to the shopping home (`useAuth.ts:40,92`). **Fix applied:** added `getRoleLandingRoute(role)` in `authStore.ts` (predicates mirror the tab guards in `admin.tsx`/`rider.tsx`/`_layout.tsx`: ADMIN → `/(tabs)/clothing/admin`, DELIVERY|RIDER → `/(tabs)/clothing/rider`, else home); `useLogin` + `useVerifyOTP` now `router.replace(getRoleLandingRoute(user.role))`. Shared predicate guarantees no guard-redirect bounce.
- [x] ✅ **FIXED (4335315) — H9. Mobile admin dashboard cards dead-end.** `adminData.ts:67,74` linked to `/admin/users` and `/admin/security` — routes don't exist. **Fix applied:** both cards marked `comingSoon: true` (routes removed); `AdminStatCard` renders coming-soon cards dimmed (0.5), non-pressable, with a "Coming soon" badge. Full screens deferred (User Management depends on the H10 route fix); no more dead-end navigation.
- [x] ✅ **FIXED (6cd9a3c) — H10. `DELETE /users/:id` is permanently broken.** `validatePermission` read `req.params.roleId` but the route param is `:id` → always threw 400 (`user.router.ts:23`, `rbac.middleware.ts:9`). Renaming wouldn't help (a *user* id can't be a *role* id). **Fix applied:** rewrote `validatePermission` to gate on the authenticated caller's role (`req.user.roleId._id`, populated by `verifyJWT`) — mirroring the sibling `checkPermissions`. No route passes `:roleId` to this guard, so nothing else changes. Server typecheck clean.

---

## 🟡 MEDIUM — correctness, resilience, security

- [x] ✅ **FIXED (5681027) — M1. Payment/stock race leaves inconsistent state.** `verifyPayment` sets `CONFIRMED` before the stock loop; an out-of-stock variant threw 409 with payment captured and no sub-orders (`order.service.ts:270-289`). Comment admitted refund "not implemented." **Fix applied:** extracted `deductOrderStock` (all-or-nothing atomic deduction with rollback of prior SKUs; STOCK_UPDATE emitted only after full success). `verifyPayment` now deducts stock BEFORE marking CONFIRMED; on failure calls `refundAndFailOrder` (Razorpay refund → REFUNDED, or FAILED + loud log if refund throws). COD `createOrder` persists PENDING_PAYMENT → secures stock → promotes to CONFIRMED (FAILED on out-of-stock, no payment to refund). `finalizeConfirmedOrder` no longer touches stock.
- [x] ✅ **FIXED (d137be0) — M2. Return flow is incomplete.** `customerRequestReturn` → `RETURN_INITIATED` existed, but no seller-approve / rider-pickup / `RETURNED` / `REFUNDED` transitions (`subOrder.service.ts:1595`, `returnRequest.model.ts:46`); ~14 `SubOrderStatus` values were declared but never assigned. **Fix applied:** implemented the full state machine in `SubOrderService` — `sellerReviewReturn` (approve → `RETURN_APPROVED`, reject → back to `DELIVERED`), `listClaimableReturns` + `riderClaimReturn` (pull model; `findOneAndUpdate` guard → 409 on double-claim), `riderReturnPickup` (OTP + proof photo), `sellerConfirmReturnReceipt` (QC pass → `RETURNED`, fail → `DISPUTED`), `adminResolveReturnDispute`, and private `issueReturnRefund` (restores stock via `ProductDAO`, reverses seller settlement, then Razorpay refund → `REFUNDED` / `MANUAL_CASH` for COD / stays `RETURNED` + manual-reconcile flag on gateway failure — never crashes, mirrors `refundAndFailOrder`). `syncParentOrderStatus` now rolls the return states up (parent stays `DELIVERED` through the flow; all-refunded → `REFUNDED`). Added `SellerSettlementService.reverseSubOrderSettlement` (wallet claw-back). New routes: seller `return-review`/`return-receipt`, rider `return-tasks`/`return-claim`/`return-pickup`, admin `return-resolve` (+ Zod schemas, mirrored `ReturnRequest` status/timeline). Unwired `SubOrderStatus` values documented as reserved. Covered by `server/src/_tests_/return.test.ts` (happy path, reject, QC-fail→dispute→admin refund, double-claim 409, COD); `tsc --noEmit` clean.
- [ ] **M3. Web has no token-refresh flow.** `web/src/lib/axios.ts:32-38` just rejects on 401 — no `/auth/refresh-token` call, no queue (mobile does this correctly). Web users get silently logged out on expiry. **Fix:** port the mobile refresh interceptor.
- [ ] **M4. No server-side route protection on web.** Guards are client-only; no `middleware.ts`. Dashboard JS ships to anyone (backend still rejects the token, so data is safe, but it's weak). **Fix:** add Next.js `middleware.ts` role/redirect guard.
- [ ] **M5. `RIDER_OFFER_CLOSED` never emitted/consumed.** When one rider accepts, competing riders keep a stale offer modal (server `socketEvents.ts:23`; web never listens). **Fix:** emit on accept/expire + handle on all rider clients.
- [ ] **M6. Web missing `NEW_NOTIFICATION` listener.** Server emits it, mobile listens, web omits it entirely from `constants/socketEvents.ts` → web admin gets no realtime new-notification push. **Fix:** add constant + listener.
- [ ] **M7. Rider proof-of-pickup/delivery is a stub.** Text URL inputs with a hardcoded ImageKit URL and "Mock photo auto-injected"; signature is a plain text field (`ActiveOrdersPanel.tsx:318,328,400-417`). **Fix:** real camera/upload + signature capture.
- [ ] **M8. Prefilled real demo credentials in web login forms.** `SellerLoginForm.tsx:28-30`, `DeliveryLoginForm.tsx:28-30`. **Fix:** remove before production.
- [ ] **M9. Hardcoded plain-HTTP API origin (mobile).** `axiosInstance.ts:11` falls back to `http://80.225.194.37` (no TLS, raw IP). **Fix:** use HTTPS + a domain, drive via env.
- [ ] **M10. Matching score is effectively distance-only.** Rating/acceptance/completion/onlineHours are hardcoded constants (`matching.service.ts:743-756`); `logNoQualifiedRiders` runs 5 aggregations then discards them (commented-out body, `:559-624`). **Fix:** wire real rider metrics or simplify the formula and delete the dead diagnostics.
- [ ] **M11. Inconsistent role parsing (mobile).** `admin.tsx:25` uses only `user?.role?.name`, while `_layout.tsx`/`rider.tsx` handle both string and object forms → admin tab shows but screen may redirect away. **Fix:** centralize a `getRoleName(user)` helper.

---

## 🟢 LOW — cleanup, polish, hygiene

- [x] **L1.** ~~Duplicate `userRouter` mount (`server/src/app.ts:76,90`)~~ — dead second mount removed (Task 1, `a95070f`).
- [x] **L2.** ~~Dead controller fns `updateOrderStatus`/`updateOrderLocation` never routed (`delivery.controller.ts:252,264`).~~ — removed (`0d18552`).
- [x] **L3.** ~~Dead web mock module `web/src/features/dashboard/api/dashboard.api.ts` (+ `useDashboard`, `AdminProductTable`, `ProductFormDialog`)~~ — deleted (Task 1, `2d95a8f`).
- [x] **L4.** ~~Orphaned duplicate mobile route `app/account/track-orders/[id].tsx` (live route is `/track-order/[id]`).~~ — deleted (`0d18552`).
- [x] **L5.** ~~Rename misleading mobile `*MockData.ts` files — they now hold real UI/filter config, not mock products.~~ — renamed to `dealsConfig.ts` / `cartData.ts` (`0d18552`).
- [x] **L6.** ~~Socket.io CORS hardcoded `origin:"*"` (`socket.service.ts:57`) — tighten for prod.~~ — now mirrors the `ENV.CORS_ORIGIN` allowlist (`0d18552`).
- [x] **L7.** ~~Copy-pasted socket-event literals not in the shared constant files (`notification_updated`, `notification_status_update`) — drift risk; add to all three `socketEvents.ts`. `SUBORDER_STATUS_UPDATE` + `riders_matching` room are dead.~~ — consolidated behind `SocketEvents` across server/mobile/web; dead constant + room removed (`0d18552`).
- [x] **L8.** ~~Debug logs: raw OTP (`auth.service.ts:169`) and user email on every `isSellerOrAdmin` (`auth.middleware.ts:62`) — remove.~~ — removed (`0d18552`).
- [x] **L9.** ~~`"RIDER"` magic-string fallback not in `RoleEnum`; mobile rider tab cross-imports a route file (`rider.tsx:3,9`). Add `RIDER`/tidy import.~~ — added `RIDER_ROLE_ALIAS` const (server + mobile; deliberately **not** a `RoleEnum` member, so `rbacSeed.ts` won't upsert a phantom permission-less role) and dropped the route-to-route cross-import (`0d18552`).
- [x] **L10.** ~~Razorpay placeholder logo `https://your-logo-url.png` (`CheckoutScreen.tsx:233`).~~ — broken placeholder removed; `image` omitted until a hosted brand logo exists (`0d18552`).
- [x] **L11.** ~~Verify announcement `audience` plural forms (`ALL/USERS/SELLERS/DELIVERY`, `adminManagement.api.ts:604`) are accepted server-side.~~ — verified consistent across server validation + model and web (mobile has none); no code change needed (`0d18552`).

---

## 🧭 Multi-vertical roadmap (food / jewelery) — phased

This is the largest requirement and needs its own track. Suggested order:

1. **Schema generalization (server):**
   - Extend `StoreType`/`sellerType`/`DomainEnum` to `CLOTHING | FOOD | JEWELERY`.
   - Make product `variants` + `size`/`color` **conditional on vertical** (discriminator or per-vertical sub-schema). Add food fields (veg/nonveg, expiry, weight/volume) and jewelery fields (metal, purity, hallmark, gemstone).
   - Make order/sub-order line items not hard-require `size`/`color`.
2. **Seller onboarding:** vertical selector in `PartnerRegisterForm` + onboarding API; per-vertical product form.
3. **Web dashboards:** render the product form dynamically by `store.type`.
4. **Mobile:** generalize the `Clothings` feature tree into a vertical-parameterized structure (activate `rootSlug`), add `(tabs)/food` and `(tabs)/jewelery` route trees or a single dynamic `[vertical]` tree.
5. **Category/catalog:** add a vertical discriminator to categories.

> Recommendation: do the schema work behind a feature flag so clothing keeps working while food/jewelery are built.

---

## ⚡ Performance & UX quick wins (after correctness)

- **Perf:** the matching engine runs a background loop + 5 discarded aggregations per failed match (M10) — trim. Add DB indexes for the geospatial + capacity queries if not present. Web/mobile already use React Query — audit `staleTime`/`invalidateQueries` fan-out (`useFulfillmentRealtime` invalidates 3 caches per event).
- **UX:** role-based landing (H8), stale rider offer dismissal (M5), real proof-of-delivery (M7), and web token-refresh (M3) are the four that users will *feel* most.
- **Consistency:** collapse the two parallel status vocabularies (`DeliveryStatus` vs `SubOrderStatus`) into one source of truth to prevent future drift (L7 / backend §2 LOW).

---

### Suggested execution order
1. ✅ **TASK 1** — module restructure into `common` + `clothing` (foundation for everything vertical). **DONE** (`6d04bec`, `a95070f`, `2d95a8f`). Also cleared L1, L3.
2. **NEXT → C1, C2, C3** (unblock prod: realtime, checkout, super-admin) — tiny, independent.
3. H6, H7, H8, H9, H10 + M1 (fix broken role flows + payment safety).
4. M3–M11 (resilience/security/UX).
5. Multi-vertical roadmap as a dedicated milestone (depends on Task 1).
6. Remaining L-series cleanup alongside.
