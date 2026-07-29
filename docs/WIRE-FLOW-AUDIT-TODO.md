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
| **Rider** | Web dashboard **and** mobile | web `/delivery/dashboard`, mobile `/rider` + `(tabs)/clothing/rider` | ✅ Full lifecycle wired. ⚠️ Web active-order panel uses **wrong status strings**; proof-of-delivery is a stub. |
| **Admin** | Web dashboard **and** mobile | web `/admin/dashboard`, mobile `/admin/*` | ✅ Web is comprehensive & real-API. ⚠️ **SUPER_ADMIN is locked out of the admin API.** Mobile has 2 dead cards. |

**Backbone health:** Auth/JWT + RBAC, order lifecycle, seller settlement, and the geospatial rider-matching engine are all genuinely implemented end-to-end. Role enums and REST routing are **consistent** across all three layers. The problems are concentrated in: multi-vertical support, a handful of broken routes/guards, COD, and real-time delivery through nginx.

---

## ⭐ TASK 1 (DO FIRST) — Restructure modules into `common` + `clothing` (multi-vertical foundation)

> **Goal:** stop clothing from being hardwired everywhere. Extract everything shared across verticals into a `common` module, and isolate clothing-specific code into its own `clothing` module. Food & jewelery are **NOT implemented now** — this refactor just creates the structure so they can be dropped in later without rewrites.
> **This is a pure restructure — no behavior change.** Do it before the multi-vertical roadmap (§ below); that roadmap depends on this split.

**Guiding rule for the split:**
- **`common`** = anything a food or jewelery vertical would reuse unchanged: auth, user/profile, address, cart, order/checkout/payment, coupon, notification, banner, category, delivery/rider, admin, RBAC, socket, settlements.
- **`clothing`** = anything apparel-specific: products with `size`/`color` variants, size charts, apparel attributes (fit/pattern/material/collar/sleeve), clothing store config, clothing home/product-listing UI.

- [ ] **T1.1 — Mobile:** split `mobile/src/features/Clothings/*`.
  - Move shared features → `mobile/src/features/common/` (account, address, profileInfo, notification, cart, order, coupon).
  - Keep apparel features → `mobile/src/features/clothing/` (home, product, mall, banner, category, size charts). Rename `Clothings` → `clothing`.
  - Fix imports; activate the vestigial `rootSlug` prop (`HomeScreen.tsx:24`) as the vertical key so the tree is vertical-parameterized.
- [ ] **T1.2 — Server:** reorganize `server/src/modules/*`.
  - `modules/common/` (or keep flat but clearly grouped): auth, user, rbac, order, cart, coupon, notification, banner, category, delivery, deliveryBoy, fulfillment, admin, socket, savedAddress, paymentMethod.
  - `modules/clothing/`: products (variant/size/color), sizeChart, clothing store config.
  - Keep route paths stable (`/api/v1/...`) to avoid breaking clients during the move.
- [ ] **T1.3 — Web:** mirror the split in `web/src/features/*` — shared dashboard panels vs clothing-specific product form/attributes.
- [ ] **T1.4 — Leave FOOD/JEWELERY as empty placeholders only** (folders/enums stubbed, no logic) — user will implement later.
- [ ] **T1.5 — Regression pass:** typecheck + run the app for all 4 roles after the move; no functional change expected.

> ⚠️ Note: this is a big mechanical refactor touching many imports. Recommend doing it on its own branch, in one focused pass, with a full typecheck before merge. The 3 CRITICAL fixes below are independent and can go before or after — but if the app is live, do C1–C3 first since they're tiny and unblock production.

---

## 🔴 CRITICAL — breaks a core flow in production

- [ ] **C1. nginx does not proxy `/socket.io/` → all realtime breaks behind the proxy.**
  Server serves Socket.io on default `/socket.io/` (`server/src/modules/socket/socket.service.ts:55`), but `nginx/default.conf` only proxies `/api/`, `/web/`, `/_next/`. Socket handshakes fall through to the static `mobile-web` container. **Fix:** add a `location /socket.io/ { proxy_pass http://server:8000; }` block with `Upgrade`/`Connection` headers. Without this, live order tracking, rider job offers, and notifications all silently fail in prod.

- [ ] **C2. Post-purchase navigation is broken (dead route).**
  `OrderSuccessScreen.tsx:38` (back handler) and `:187` ("Continue Shopping") both `router.replace("/(tabs)/home")`, which doesn't exist. Correct route is `/(tabs)/clothing/home`. Every paid order dead-ends. **Fix:** point both to the real home route.

- [ ] **C3. SUPER_ADMIN is locked out of the entire admin API.**
  `isAdmin = validateRole(RoleEnum.ADMIN)` matches only `"ADMIN"` (`server/src/middlewares/auth.middleware.ts:49`), so SUPER_ADMIN users get 403 on every `/api/v1/admin` route. **Fix:** `isAdmin` should accept `[ADMIN, SUPER_ADMIN]` (as `isSellerOrAdmin` already does).

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
- [ ] **H6. Rider web "Active Orders" uses wrong status strings.** `ActiveOrdersPanel.tsx:42-44,66-71,297` filters on `RIDER_REACHED_STORE`, `RIDER_ARRIVING`, etc., but the contract (`delivery.api.ts:3-21`, `DeliveryHelpers.tsx:7-18`) uses `REACHED_STORE`, `ARRIVING_AT_STORE`, `OUT_FOR_DELIVERY`. Active jobs get filtered out and workflow buttons never render. **Fix:** align to canonical `DeliveryStatus`.
- [ ] **H7. COD is architected but unreachable.** `createOrder` always creates a Razorpay order; the only COD detector is `razorpayOrderId === "COD"` which is never set (`order.service.ts:382`). The whole COD subsystem (rider liability, admin settle-COD, `codSettlement.model`) is dead. **Fix:** add a COD path in `createOrder`/`quoteOrder` that skips Razorpay and flags `isCod`.
- [ ] **H8. No role-based landing after login (mobile).** Login/OTP always redirect every role to the shopping home (`mobile/src/features/common/auth/hooks/useAuth.ts:40,92`). Admin/rider must hunt for their hidden tab. **Fix:** branch on role → `/admin` or `/rider`.
- [ ] **H9. Mobile admin dashboard cards dead-end.** `admin/lib/adminData.ts:67,74` link to `/admin/users` and `/admin/security` — routes don't exist. **Fix:** build the screens or remove/disable the cards.
- [ ] **H10. `DELETE /users/:id` is permanently broken.** `validatePermission` reads `req.params.roleId` but the route param is `:id` (`user.router.ts:23`, `rbac.middleware.ts:9`) → always throws 400. **Fix:** correct the param name/guard.

---

## 🟡 MEDIUM — correctness, resilience, security

- [ ] **M1. Payment/stock race leaves inconsistent state.** `verifyPayment` sets `CONFIRMED` before the stock loop; an out-of-stock variant throws 409 with payment captured and no sub-orders (`order.service.ts:270-289`). Comment admits refund "not implemented." **Fix:** validate stock before marking CONFIRMED, or auto-refund on failure.
- [ ] **M2. Return flow is incomplete.** `customerRequestReturn` → `RETURN_INITIATED` exists, but no seller-approve / rider-pickup / `RETURNED` / `REFUNDED` transitions (`subOrder.service.ts:1595`, `returnRequest.model.ts:46`). ~14 `SubOrderStatus` values are declared but never assigned (`subOrder.model.ts:4-45`). **Fix:** implement the return state machine or trim dead states.
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

- [ ] **L1.** Duplicate `userRouter` mount (`server/src/app.ts:76,90`) — remove the dead second mount.
- [ ] **L2.** Dead controller fns `updateOrderStatus`/`updateOrderLocation` never routed (`delivery.controller.ts:252,264`).
- [ ] **L3.** Dead web mock module `web/src/features/dashboard/api/dashboard.api.ts` (+ `useDashboard`, `AdminProductTable`, `ProductFormDialog`) — not imported by any route; delete to avoid accidental reuse.
- [ ] **L4.** Orphaned duplicate mobile route `app/account/track-orders/[id].tsx` (live route is `/track-order/[id]`).
- [ ] **L5.** Rename misleading mobile `*MockData.ts` files — they now hold real UI/filter config, not mock products.
- [ ] **L6.** Socket.io CORS hardcoded `origin:"*"` (`socket.service.ts:57`) — tighten for prod.
- [ ] **L7.** Copy-pasted socket-event literals not in the shared constant files (`notification_updated`, `notification_status_update`) — drift risk; add to all three `socketEvents.ts`. `SUBORDER_STATUS_UPDATE` + `riders_matching` room are dead.
- [ ] **L8.** Debug logs: raw OTP (`auth.service.ts:169`) and user email on every `isSellerOrAdmin` (`auth.middleware.ts:62`) — remove.
- [ ] **L9.** `"RIDER"` magic-string fallback not in `RoleEnum`; mobile rider tab cross-imports a route file (`rider.tsx:3,9`). Add `RIDER`/tidy import.
- [ ] **L10.** Razorpay placeholder logo `https://your-logo-url.png` (`CheckoutScreen.tsx:233`).
- [ ] **L11.** Verify announcement `audience` plural forms (`ALL/USERS/SELLERS/DELIVERY`, `adminManagement.api.ts:604`) are accepted server-side.

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
1. **TASK 1** — module restructure into `common` + `clothing` (foundation for everything vertical).
2. C1, C2, C3 (unblock prod: realtime, checkout, super-admin) — tiny, can be done before Task 1 if app is live.
3. H6, H7, H8, H9, H10 + M1 (fix broken role flows + payment safety).
4. M3–M11 (resilience/security/UX).
5. Multi-vertical roadmap as a dedicated milestone (depends on Task 1).
6. L-series cleanup alongside.
