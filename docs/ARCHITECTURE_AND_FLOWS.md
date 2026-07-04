# QuickBihar Architecture and Product Flows

This document explains the QuickBihar app for a new developer: what each app does, how the services connect, how each role moves through the system, and which edge cases must be protected.

## Product Surface

QuickBihar has four main user surfaces:

| Surface | App | Primary users | Purpose |
| --- | --- | --- | --- |
| Storefront | Expo Router app in `mobile/` exported to web and built for Android/iOS | Customers | Browse local products, manage cart, checkout, track orders, request returns |
| Admin dashboard | Next.js app in `web/` | Admin / operations team | Manage catalog, sellers, riders, orders, notifications, system settings |
| Seller dashboard | Next.js app in `web/` | Sellers / store owners | Store setup, products, orders, payouts, inventory |
| Rider workspace | Expo app and dashboard paths | Delivery riders | Accept delivery jobs, pickup, deliver, COD settlement, returns |

## System Architecture

```mermaid
flowchart TB
    customer["Customer\nExpo Web / Android / iOS"]
    admin["Admin Dashboard\nNext.js"]
    seller["Seller Dashboard\nNext.js"]
    rider["Rider App / Rider Dashboard\nExpo / Next.js"]

    nginx["Nginx Reverse Proxy\nquickbihar.in"]
    storefront["Expo Static Storefront\nmobile/dist"]
    dashboard["Next.js Dashboard Container\nweb :3000"]
    api["Bun + Express API\nserver :8000"]
    socket["Socket.IO\nRealtime channel"]

    mongo["MongoDB Atlas\nPrimary database"]
    redis["Redis\nBullMQ + realtime support"]
    imagekit["ImageKit\nProduct/document media"]
    razorpay["Razorpay\nPayments + refunds"]
    firebase["Firebase FCM\nPush notifications"]
    resend["Resend\nEmail notifications"]

    customer --> nginx
    admin --> nginx
    seller --> nginx
    rider --> nginx

    nginx -->|"/, /mall, /product, /checkout"| storefront
    nginx -->|"/admin, /seller, /delivery, /_next"| dashboard
    nginx -->|"/api/v1"| api
    nginx -->|"/socket.io"| socket

    storefront -->|REST| api
    dashboard -->|REST| api
    customer -->|Socket.IO| socket
    seller -->|Socket.IO| socket
    rider -->|Socket.IO| socket
    admin -->|Socket.IO| socket

    socket --> api
    api --> mongo
    api --> redis
    api --> imagekit
    api --> razorpay
    api --> firebase
    api --> resend
```

## Backend Module Map

```mermaid
flowchart LR
    auth["auth\nlogin/register/tokens"]
    user["user\nprofiles"]
    store["store\nsetup/serviceability"]
    products["products\ncatalog/discovery"]
    cart["cart\nitems/pricing"]
    order["order\ncheckout/payment/sub-orders"]
    delivery["delivery\nrider matching/workspace"]
    fulfillment["fulfillment\nrealtime events/outbox"]
    notification["notification\npush/in-app"]
    admin["admin\noperations/reporting"]
    onboarding["onboarding\nseller/rider approval"]
    rbac["rbac\nroles/permissions"]

    auth --> user
    onboarding --> store
    store --> products
    products --> cart
    cart --> order
    store --> order
    order --> delivery
    delivery --> fulfillment
    fulfillment --> notification
    admin --> rbac
    admin --> onboarding
    admin --> order
    admin --> delivery
```

Important backend concepts:

| Concept | Description |
| --- | --- |
| Parent order | Customer-level order containing all cart items and payment information |
| Sub-order | Seller/store-level split of a parent order. Multi-seller orders become multiple sub-orders |
| Store serviceability | Whether a store can deliver to a selected pincode/GPS point |
| Rider offer | A delivery job broadcast to eligible riders |
| Fulfillment event | Realtime event used to recover missed updates after disconnects |
| COD liability | Rider wallet value tracking cash collected but not deposited |

## Data Ownership

```mermaid
erDiagram
    USER ||--o{ ADDRESS : owns
    USER ||--o| SELLER : "may be"
    USER ||--o| DELIVERY_PROFILE : "may be"
    SELLER ||--o| STORE : owns
    STORE ||--o{ PRODUCT : lists
    USER ||--o{ CART : owns
    CART ||--o{ CART_ITEM : contains
    USER ||--o{ ORDER : places
    ORDER ||--o{ SUB_ORDER : splits_into
    SUB_ORDER ||--o{ RIDER_OFFER : broadcasts
    DELIVERY_PROFILE ||--o{ RIDER_OFFER : receives
    ORDER ||--o{ NOTIFICATION : emits
```

## Customer Discovery Flow

```mermaid
flowchart TD
    start["Customer opens storefront"] --> location{"Has pincode or GPS?"}
    location -->|No| ask["Ask for pincode / location"]
    location -->|Yes| serviceability["GET /stores/serviceability"]
    ask --> serviceability
    serviceability --> available{"Any active setup-complete store serves area?"}
    available -->|No| unavailable["Show service unavailable / notify me"]
    available -->|Yes| localProducts["GET /products/local"]
    localProducts --> feed["Show local-first products\nnearest/trending/seller filters"]
    feed --> product["Product detail"]
    product --> cart["Add to cart"]
```

Discovery rules:

| Rule | Why it matters |
| --- | --- |
| Store must be active, open, and setup-complete | Avoid selling from unavailable merchants |
| Pincode or GPS must match store reach | Prevent showing products that cannot be delivered |
| Products must be active and approved | Avoid unreviewed or deleted catalog |
| Local products are store-filtered | Keeps the marketplace hyperlocal |

## Customer Order Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant App as Storefront / Mobile
    participant API as API
    participant DB as MongoDB
    participant RZP as Razorpay
    participant Seller as Seller
    participant Rider as Rider

    C->>App: Select address and checkout
    App->>API: POST /api/v1/orders/quote
    API->>DB: Load products, stores, coupons, address
    API->>API: Validate stock, store open status, serviceability
    API-->>App: Quote or blocked reason
    C->>App: Pay now
    App->>API: POST /api/v1/orders
    API->>API: Repeat hard serviceability and store-open gate
    API->>RZP: Create Razorpay order
    API->>DB: Save pending payment order
    API-->>App: Razorpay order data
    App->>RZP: Open checkout
    RZP-->>App: Payment response
    App->>API: POST /api/v1/orders/verify
    API->>RZP: Verify signature
    API->>DB: Deduct stock and create seller sub-orders
    API-->>Seller: Socket new sub-order
    API-->>Rider: Matching starts
    API-->>C: Order confirmed
```

Customer order edge cases:

| Edge case | Required behavior |
| --- | --- |
| Address has no GPS pin | Block checkout and ask user to update address |
| Cart has products from unserviceable store | Quote/order must fail with item/store-level message |
| Store closes before payment | Quote/order must fail before Razorpay order creation |
| Product stock changes during payment | Verify step must reject, avoid negative stock, trigger support/refund path |
| Payment cancelled | Keep order pending/failed, do not deduct stock |
| Payment signature invalid | Reject verification and show support message |
| Coupon becomes invalid | Recalculate quote and block stale discount |
| Multi-seller cart | Split into separate sub-orders after payment |
| User disconnects during checkout | Order remains pending until payment verification succeeds |

## Admin Flow

```mermaid
flowchart TD
    login["Admin login"] --> dashboard["Admin dashboard"]
    dashboard --> users["Manage users / roles / RBAC"]
    dashboard --> sellers["Review seller onboarding"]
    dashboard --> riders["Review rider KYC documents"]
    dashboard --> catalog["Manage categories, banners, policies"]
    dashboard --> orders["Monitor orders and sub-orders"]
    dashboard --> manualOps["Manual rider assignment / COD settlement"]
    dashboard --> notifications["Send notifications / campaigns"]
    dashboard --> reports["Reports, payouts, operations"]
```

Admin responsibilities:

| Area | Admin action |
| --- | --- |
| Seller onboarding | Approve/reject seller application and store readiness |
| Rider onboarding | Review driving license, Aadhaar, PAN, RC, profile photo independently |
| Catalog governance | Create approved categories, banners, policies, size charts |
| Fulfillment operations | Watch stuck orders, offline riders, no-rider scenarios |
| Finance operations | Monitor seller settlement and rider COD liability |
| Notifications | Trigger order, marketing, and support notifications |

Admin edge cases:

| Edge case | Required behavior |
| --- | --- |
| Seller submits incomplete store setup | Keep products/order acceptance blocked |
| Rider document rejected | Only rejected document should need re-upload |
| Rider offline mid-trip | Admin alert and customer delay notification |
| Order stuck without rider | Manual assign, merchant self-delivery, or cancel/refund path |
| COD liability exceeded | Block rider from new COD jobs until settled |
| Suspicious user/seller/rider | Block account via RBAC/admin controls |

## Seller Flow

```mermaid
flowchart TD
    register["Seller registration"] --> approval["Admin approval"]
    approval --> storeSetup["Store setup\naddress, hours, service areas, policies"]
    storeSetup --> setupComplete{"Setup complete?"}
    setupComplete -->|No| blocked["Products/order acceptance blocked"]
    setupComplete -->|Yes| products["Create products"]
    products --> categoryGate{"Category assigned and valid?"}
    categoryGate -->|No| productBlocked["Product creation blocked"]
    categoryGate -->|Yes| live["Products visible after approval"]
    live --> order["Receive sub-orders"]
    order --> pack["Pack and handover to rider"]
    pack --> settlement["Delivery complete -> settlement"]
```

Seller edge cases:

| Edge case | Required behavior |
| --- | --- |
| Store is closed early | Customer checkout must block affected items |
| Store inactive or not setup-complete | Products should not appear in local discovery |
| Product category removed/inactive | Product creation/update should fail |
| Image upload fails | Product creation/update should fail cleanly |
| Seller has one-store limit | Prevent duplicate store creation |
| Return arrives damaged or mismatched | Seller validation and dispute workflow needed |

## Rider Flow

```mermaid
stateDiagram-v2
    [*] --> PendingKYC
    PendingKYC --> Approved: Admin approves documents
    PendingKYC --> Rejected: Admin rejects one or more documents
    Rejected --> PendingKYC: Rider re-uploads rejected docs
    Approved --> Offline
    Offline --> Online: Rider toggles availability
    Online --> Offered: Job broadcast received
    Offered --> Assigned: Rider accepts
    Offered --> Online: Rider rejects / timeout
    Assigned --> ArrivingStore
    ArrivingStore --> AtStore
    AtStore --> PickedUp: Pickup OTP/proof
    PickedUp --> InTransit
    InTransit --> NearCustomer
    NearCustomer --> Delivered: Delivery OTP/proof
    Delivered --> Online
```

Rider matching and delivery rules:

| Rule | Why it matters |
| --- | --- |
| Rider must be approved, verified, online | Prevent untrusted fulfillment |
| Rider capacity limits apply | Avoid overloading one rider |
| COD liability limit applies | Reduce cash risk |
| GPS/location needed for matching | Enables nearest rider selection |
| OTP/proof checkpoints | Reduces false pickup/delivery claims |

Rider edge cases:

| Edge case | Required behavior |
| --- | --- |
| No rider accepts in first radius | Expand broadcast radius and/or alert admin |
| Rider accepts then disconnects | Reassign or escalate after timeout |
| Rider GPS lost mid-trip | Admin alert and customer delay message |
| COD liability too high | Block new COD acceptance |
| Wrong pickup OTP | Do not mark picked up |
| Wrong delivery OTP | Do not mark delivered |
| Rider cancels after accepting | Return order to matching pool and audit action |

## Return / Exchange Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant API as API
    participant Rider as Rider
    participant Seller as Seller
    participant RZP as Razorpay

    C->>API: Request return with reason/proof
    API->>API: Check return window and item eligibility
    API-->>Rider: Broadcast return pickup task
    Rider->>C: Pickup item and perform QC checklist
    Rider->>Seller: Return item to seller
    Seller->>API: Confirm receipt / validation
    API->>RZP: Trigger refund if approved
    API-->>C: Refund notification
```

Return edge cases:

| Edge case | Required behavior |
| --- | --- |
| Return window expired | Reject request with policy message |
| Item not returnable | Reject based on policy/category |
| Missing proof photo | Require upload when policy needs proof |
| QC fails at pickup | Mark return rejected/disputed |
| Seller rejects receipt | Open admin dispute path |
| Refund fails | Retry or manual admin refund path |

## Realtime and Notification Flow

```mermaid
flowchart LR
    api["API service"] --> socket["Socket.IO event"]
    api --> outbox["Notification outbox"]
    outbox --> firebase["Firebase push"]
    outbox --> inapp["In-app notification"]
    outbox --> email["Resend email"]

    socket --> admin["Admin dashboard"]
    socket --> seller["Seller dashboard"]
    socket --> rider["Rider app"]
    socket --> customer["Customer app"]
```

Realtime edge cases:

| Edge case | Required behavior |
| --- | --- |
| Client misses socket event | Recover from fulfillment event feed |
| Push notification fails | Keep in-app notification/outbox state |
| Duplicate event delivery | Consumers must be idempotent by event id |
| Socket auth token expires | Refresh token and reconnect |

## Deployment Flow

```mermaid
flowchart TD
    push["Push to master"] --> actions["GitHub Actions"]
    actions --> buildServer["Build server Docker image"]
    actions --> buildWeb["Build web Docker image"]
    buildServer --> dockerhub["Docker Hub"]
    buildWeb --> dockerhub
    dockerhub --> runner["Self-hosted Oracle VPS runner"]
    runner --> compose["docker compose pull + up -d"]
    compose --> nginx["Nginx reverse proxy"]
    nginx --> public["quickbihar.in"]
```

Production deployment checklist:

| Item | Required value |
| --- | --- |
| API URL | `https://quickbihar.in/api/v1` for single-domain launch |
| Socket URL | `https://quickbihar.in` |
| CORS | `https://quickbihar.in,https://www.quickbihar.in` |
| Redis | Internal Docker network only |
| MongoDB Atlas | VPS public IP allowlisted |
| SSL | Certbot/Let’s Encrypt active before public launch |
| Razorpay | Test keys for staging, live keys only after smoke tests |
| Expo web export | Use `--max-workers 2` on Windows if `EMFILE` occurs |

## Developer Entry Points

| Task | Start here |
| --- | --- |
| Add customer API | `server/src/modules/*` and `mobile/src/features/*/api` |
| Add admin dashboard feature | `web/src/features/dashboard` |
| Add seller dashboard feature | `web/src/features/seller` |
| Add rider feature | `server/src/modules/delivery`, `mobile/src/features/Delivery` |
| Change checkout logic | `server/src/modules/order`, `server/src/modules/store/serviceability.service.ts`, `mobile/src/features/Clothings/order` |
| Change serviceability | `server/src/modules/store/serviceability.service.ts` |
| Change payment | `server/src/utils/razorpay.util.ts`, `mobile/src/features/Clothings/order/lib/openRazorpayCheckout.*.ts` |
| Change deployment | `docker-compose.yml`, `deploy/nginx/quickbihar.path-based.conf`, `.github/workflows/docker-ci-cd.yml` |

## Developer Mental Model

1. Customers should only see products from stores that can deliver to their selected location.
2. Quote and order creation must repeat critical validations because frontend checks are only UX.
3. Payment verification is the point where stock is deducted and sub-orders are created.
4. Every multi-seller order becomes independent sub-orders for seller/rider operations.
5. Rider work is state-machine driven: offered, assigned, pickup, transit, delivered.
6. Admin is the recovery layer for edge cases: stuck delivery, KYC rejection, refund dispute, COD risk.
7. Socket events improve UX, but database state remains the source of truth.
