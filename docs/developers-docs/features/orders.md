# Orders

> Owner: `server/src/modules/common/order/`
> Related: [payments.md](./payments.md) · [products.md](./products.md) · [notifications.md](./notifications.md)

This document describes the order and sub-order lifecycle — the core commerce flow. The state machine in this module has been extended (Phase 9) to add a phone-call confirmation step between payment and the seller picking the order.

---

## Mental model

- A **parent Order** is the customer's view of the transaction — one per checkout, owns the payment record, the shipping address, and the totals.
- An Order is **split into N SubOrders**, one per seller, at payment time. Stock deduction, OTPs, seller-side actions, and delivery flow all hang off the SubOrder, not the Order.
- After payment, the customer immediately sees `CONFIRMED` regardless of the sub-order state. The seller-confirmation step is internal — the API masks it on the customer-facing read paths.
- Once all sub-orders are confirmed (or any one is declined), the parent Order rolls up its status from the children.

This separation exists because QuickBihar is a multi-seller marketplace — a single cart can hold items from different sellers, and each seller must independently confirm, pack, and hand off their items to a rider.

---

## State machine

### `OrderStatus` (parent)

```
PENDING_PAYMENT
   │
   ▼  payment success (Razorpay verify or COD create)
PENDING_SELLER_CONFIRMATION        ◀── all sub-orders in PENDING_SELLER_CONFIRMATION
   │
   ▼  every sub-order CONFIRMED → rollUpOrderConfirmationStatus
CONFIRMED
   │
   ▼  first sub-order enters PACKED / READY_FOR_PICKUP
PROCESSING
   │
   ▼  every sub-order DELIVERED → rollUpDeliveryStatus
DELIVERED
   │
   ▼
COMPLETED (terminal, time-based)

Any path can transition to:
   CANCELLED  — by the customer before shipment
   REJECTED   — seller declined at PENDING_SELLER_CONFIRMATION (roll-up only)
   REFUNDED   — post-cancel or return
   FAILED     — payment or processing failure
```

### `SubOrderStatus` (per seller)

```
PAYMENT_VERIFIED
   │
   ▼  finalizePendingConfirmation (immediate, on payment success)
PENDING_SELLER_CONFIRMATION
   │
   ├─► CONFIRMED     (seller hit /seller-confirm)
   │      │
   │      ▼
   │   PROCESSING → PACKED → READY_FOR_PICKUP
   │      │
   │      ▼
   │   RIDER_ASSIGNMENT_OPEN → RIDER_ASSIGNED → RIDER_ACCEPTED
   │      │
   │      ▼
   │   RIDER_ARRIVING → RIDER_REACHED_STORE → PICKED_UP (pickup OTP)
   │      │
   │      ▼
   │   IN_TRANSIT → NEAR_CUSTOMER → DELIVERED (delivery OTP) → COMPLETED
   │
   └─► REJECTED     (seller hit /seller-decline, rolls up the parent to REJECTED)
```

Return flow (M2): `RETURN_INITIATED → RETURN_APPROVED → RETURN_PICKUP_SCHEDULED → RETURN_PICKED_UP → RETURNED → REFUNDED`, with `DISPUTED` as the admin-resolved branch.

The full enum (and the "reserved but unused" statuses like `PAYMENT_VERIFIED`, `RIDER_REJECTED`, `STORE_CLOSED`, `PICKUP_FAILED`, `DELIVERY_FAILED`, etc.) is defined in [`server/src/modules/common/order/subOrder.model.ts`](../../../server/src/modules/common/order/subOrder.model.ts). Some of these are referenced by dashboards or persisted in old documents — do not delete them; new code should not assign them.

---

## Phase 9 — phone-call confirmation

The previous flow went straight from `PENDING_PAYMENT` to `CONFIRMED` on payment. We added a manual phone-confirmation step in Phase 9 because a measurable fraction of paid orders turned out to be unreachable customers, fraud, or pricing mistakes. The seller now calls the customer after payment to confirm the order before they start picking it.

### What changed

1. On payment success, every sub-order is now created in `PENDING_SELLER_CONFIRMATION` (not `CONFIRMED`).
2. **Pickup and delivery OTPs are generated at sub-order creation** (not at `RIDER_ACCEPTED`). The seller reads them to the customer on the call.
3. The parent Order's `status` starts at `PENDING_SELLER_CONFIRMATION`.
4. The customer never sees `PENDING_SELLER_CONFIRMATION` — see the masking section below.
5. Two new endpoints let the seller confirm or decline after the call.
6. When every sub-order transitions to `CONFIRMED`, the parent rolls up to `CONFIRMED` via `rollUpOrderConfirmationStatus`.

### Customer-facing masking

`maskOrderForCustomer` and `maskSubOrderForCustomer` (top of `order.service.ts`) collapse `PENDING_SELLER_CONFIRMATION` to `CONFIRMED` on every read path that returns data to a customer:

- `getMyOrders` (`GET /orders/me`)
- `getOrderById` (`GET /orders/:id`)
- `getSubOrderDetails` (`GET /orders/sub-orders/:id`) — customer view only
- The response of `verifyPayment` (`POST /orders/verify`)
- The response of `POST /orders/` for COD

Seller and admin paths (the `getAdminOrders`, `getAdminSubOrders`, and seller-panel endpoints) do **not** mask — they need to act on the real status.

```ts
const maskOrderForCustomer = (order: any) => {
  if (!order) return order;
  if (order.status === "PENDING_SELLER_CONFIRMATION") {
    order.status = "CONFIRMED";
  }
  // sub-orders on the parent are masked too
  if (Array.isArray(order.subOrders)) {
    order.subOrders = order.subOrders.map(maskSubOrderForCustomer);
  }
  return order;
};
```

### Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/v1/orders/sub-orders/:id/seller-confirm` | SELLER (owner) | Mark this sub-order as confirmed after the seller called the customer. Body: `{ note?: string }`. Persists `sellerConfirmation = { confirmedAt, confirmedBy, method: "phone_call", note }`. Triggers a roll-up. |
| `POST` | `/api/v1/orders/sub-orders/:id/seller-decline` | SELLER (owner) | Decline this sub-order (customer unreachable, fraud signal, out of stock discovered after payment, etc.). Body: `{ reason: string }`. Sets `status = REJECTED` and `rejectionReason = reason`. Triggers a roll-up; if all sub-orders are rejected, the parent becomes `REJECTED`. |

The seller panel (`web/src/features/seller/components/SellerOrdersPanel.tsx`) surfaces both actions and renders the `pickupOtp` / `deliveryOtp` so the seller can read them on the call.

### Roll-up logic

`rollUpOrderConfirmationStatus(parentOrderId, opts)` re-reads all sub-orders and computes the new parent status:

- If every sub-order is `REJECTED` → parent is `REJECTED`.
- If every sub-order is `CONFIRMED` → parent is `CONFIRMED`.
- Otherwise → parent stays at `PENDING_SELLER_CONFIRMATION`.

A similar `rollUpDeliveryStatus` exists for the delivery-side roll-up (every sub-order `DELIVERED` → parent `DELIVERED`).

---

## Order creation

### Quote → Create

1. `POST /api/v1/orders/quote` — computes the price with the pricing engine (HYBRID_MARKETPLACE_V1). Returns line items, subtotal, shipping, tax, commission, rider estimate, coupon discount, total. **Does not** lock stock or create records.
2. `POST /api/v1/orders/` — creates the order + sub-orders. Body: items, shipping address, coupon, payment mode (`ONLINE` or `COD`).
   - For `ONLINE` → creates a Razorpay order, persists `paymentInfo.razorpayOrderId`, returns `{ order, razorpayOrder }`. The order is in `PENDING_PAYMENT`.
   - For `COD` → calls `finalizePendingConfirmation` immediately, returns the order in `PENDING_SELLER_CONFIRMATION` (masked to `CONFIRMED` for the customer).
3. `POST /api/v1/orders/verify` — client posts the Razorpay signature; server verifies, marks payment captured, then calls `finalizePendingConfirmation`. Returns the masked order.

### Stock lock (the M1 invariant)

`finalizePendingConfirmation` is the only place that splits an order into sub-orders. It runs **after** payment is confirmed (or for COD, at create time). It:

1. Atomically deducts variant stock for every line item via `ProductDAO.deductStock` inside a session-scoped transaction. If any deduction fails, the entire operation rolls back and the order is marked `FAILED`.
2. Splits the items into per-seller sub-orders.
3. Generates `pickupOtp` and `deliveryOtp` for every sub-order (4-6 digit numeric, `crypto.randomInt`).
4. Sets every sub-order to `PENDING_SELLER_CONFIRMATION`.
5. Persists the timeline entry.

The order **never** reaches `CONFIRMED` until stock is atomically deducted. This was the M1 fix.

### Pricing snapshot

At create time, every order captures an `IOrderPricingSnapshot` so the post-purchase view (admin dispute, refund calculation) doesn't depend on the live pricing rules. The pricing engine itself is documented in [payments.md](./payments.md).

---

## Sub-order structure

```ts
interface ISubOrder {
  subOrderId: string;             // human-readable ID, e.g. "SUB-..."
  parentOrderId: ObjectId;
  sellerId: ObjectId;             // → User (SELLER)
  storeId: ObjectId;              // → Store
  items: ISubOrderOrderItem[];    // per-seller line items
  subtotal: number;               // sum of items
  tax: number;
  shippingFee: number;
  dynamicDeliverySurcharge: number;
  platformCommission: number;
  sellerNet: number;              // what the seller gets
  appNetAfterRider: number;       // what the platform keeps after rider
  pricingSnapshot: any;           // frozen pricing engine output
  payableAmount: number;          // customer's share (subtotal + tax + shipping)
  status: SubOrderStatus;
  packageDetails: {
    dimensions, weight, packageCount, isFragile, isCod, otpRequired, ...
  };
  delivery: {
    riderId?, riderProfileId?,
    status: DeliveryStatus,
    pickupOtp, deliveryOtp,        // generated at sub-order creation
    payoutAmount, distanceKm, bonuses,
    pickupPhoto?, deliveryPhoto?, deliverySignature?,
    events: any[]
  };
  sellerConfirmation?: {          // Phase 9 — set when seller hits /seller-confirm
    confirmedAt, confirmedBy, method, note
  };
  rejectionReason?: string;       // Phase 9 — set when seller hits /seller-decline
  timeline: ITimelineEvent[];     // per-sub-order audit log
}
```

---

## Customer actions

### Cancel

`POST /api/v1/orders/sub-orders/:id/cancel` lets a customer cancel a sub-order that hasn't shipped yet.

| Sub-order status at cancel time | What happens |
|--------------------------------|--------------|
| `PENDING_SELLER_CONFIRMATION`, `CONFIRMED`, `PROCESSING`, `PACKED` | `CANCELLED`. Stock restored. Razorpay auto-refund if online. COD: no payment to reverse. |
| `READY_FOR_PICKUP` or later | Refused — order is too far along. Customer must wait for delivery and use the return flow. |

### Return

`POST /api/v1/orders/sub-orders/:id/return` opens a `ReturnRequest` against a delivered sub-order. The return flow (M2) is a separate state machine: `RETURN_INITIATED → RETURN_APPROVED → RETURN_PICKUP_SCHEDULED → RETURN_PICKED_UP → RETURNED → REFUNDED`, with `DISPUTED` as the admin branch. See `ReturnRequest` model in [data/database.md](../data/database.md).

The return window is `RETURN_WINDOW_DAYS` (default 7) from `delivery.deliveredAt`.

---

## Seller panel

`web/src/features/seller/api/sellerManagement.api.ts` and the React Query hooks in `web/src/features/seller/hooks/useSellerManagement.ts` expose:

- `useSellerConfirmSubOrderMutation()` — calls `POST /orders/sub-orders/:id/seller-confirm`
- `useSellerDeclineSubOrderMutation()` — calls `POST /orders/sub-orders/:id/seller-decline`
- `useSellerSubOrdersQuery()` — lists the seller's sub-orders, filterable by status

The seller panel UI ([`SellerOrdersPanel.tsx`](../../../web/src/features/seller/components/SellerOrdersPanel.tsx)) shows a "Pending Confirmation" card with a Call button (tel: link to the masked customer phone), the OTPs, and Confirm/Decline actions. Customer phone is masked in the API response — the seller must click "Call" to dial.

---

## Admin actions

`server/src/modules/common/order/order.controller.ts` exposes admin handlers under `/admin/*`:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/all` | List all parent orders. |
| `GET` | `/admin/sub-orders` | List all sub-orders, filterable. |
| `PATCH` | `/admin/status/:id` | Override parent order status. |
| `POST` | `/admin/sub-orders/:id/assign` | Manually assign a rider. |
| `POST` | `/admin/sub-orders/:id/cod-settle` | Settle a COD sub-order. |
| `POST` | `/admin/sub-orders/:id/return-resolve` | Resolve a disputed return. |

All admin routes are gated by `isAdmin` (see [authorization-rbac.md](./authorization-rbac.md)).

---

## Realtime updates

Every status change writes a `FulfillmentEvent` (see [notifications.md](./notifications.md)) and a `NotificationOutbox` row. The server-side socket layer (`features/socket/socket.gateway.ts`) reads the outbox and emits to the customer's room. The DB is the source of truth — sockets are only the notification path. The mobile app subscribes to the customer's room on login and renders a push notification + the new status on the order detail screen.

---

## Customer-facing display

The mobile order detail screen (`mobile/src/features/common/order/screen/OrderDetailScreen.tsx`) shows:

- The masked status (always `CONFIRMED` after payment, never `PENDING_SELLER_CONFIRMATION`).
- The OTPs (both `pickupOtp` and `deliveryOtp`) once the sub-order is confirmed. The card explains when to share each one.
- The seller name, item list, expected delivery time, and the tracking timeline.

The web order detail page is equivalent (admin / seller view only — customers use the mobile app).

---

## Where to look in the code

- `server/src/modules/common/order/order.type.ts` — `OrderStatus`, `DeliveryStatus`, `IOrder` interface.
- `server/src/modules/common/order/order.model.ts` — parent Order schema.
- `server/src/modules/common/order/subOrder.model.ts` — `SubOrderStatus`, `ISubOrder`, schema.
- `server/src/modules/common/order/order.service.ts` — `createOrder`, `verifyPayment`, `finalizePendingConfirmation`, `sellerConfirmSubOrder`, `sellerDeclineSubOrder`, `rollUpOrderConfirmationStatus`, masking helpers.
- `server/src/modules/common/order/order.controller.ts` — HTTP handlers, masked reads for customer routes.
- `server/src/modules/common/order/order.router.ts` — routes (admin, user, seller).
- `server/src/modules/common/order/order.validator.ts` — Zod schemas including `sellerConfirmSubOrderSchema` and `sellerDeclineSubOrderSchema`.
- `server/src/modules/common/returnRequest/` — the return-flow module.
- `web/src/features/seller/components/SellerOrdersPanel.tsx` — seller-side pending-confirmation UI.
- `mobile/src/features/common/order/screen/OrderDetailScreen.tsx` — customer-facing order detail.

---

## Known gaps

- `OrderService` and `SubOrderService` are class-based; the rest of the codebase follows the function-based convention. Refactor pending.
- `rollUpOrderConfirmationStatus` re-reads every sibling sub-order on each transition. For large multi-seller orders, this is N+1-shaped. Acceptable today; cache the sub-order status projection when traffic grows.
- There is no general rate limiter on `POST /orders/sub-orders/:id/cancel` — a customer could spam it. A 1-req-per-second throttle would be cheap to add.
