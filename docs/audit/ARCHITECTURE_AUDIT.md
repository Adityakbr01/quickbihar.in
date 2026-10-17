# QuickBihar — Full Architecture Audit

**Date of Audit**: October 17, 2026  
**Auditor**: Senior E-Commerce Architect & Principal Systems Engineer  
**Status**: Comprehensive Baseline Verified  

---

## 1. System Overview & Monorepo Topology

QuickBihar is a hyperlocal, multi-vertical commerce platform structured as a multi-app monorepo with four distinct application packages backing one unified REST + WebSocket backend.

```
quickbihar.in/
├── user-web/       React 19 + Vite 8 customer storefront (Desktop & Mobile Web)
├── dash-web/       React 19 + Vite 8 dashboard (Admin, Seller & Delivery Web portal)
├── mobile/         Expo SDK 56 / React Native 0.85 (Customer storefront + Rider workspace)
├── server/         Bun runtime + Express 5 + Mongoose 9 API + Socket.IO + BullMQ
├── docs/           System documentation, TRD, and audit reports
├── vps-nginx/      Production reverse proxy configuration
└── docker-compose.yml
```

---

## 2. Discovered Applications & Boundaries

### 2.1 Customer Web Storefront (`user-web`)
- **Purpose**: Fast, accessible, SEO-optimized customer shopping storefront for clothing and jewelry verticals.
- **Runtime & Framework**: React 19.2.8, Vite 8.3.0, React Router v7, Tailwind CSS v4.
- **Entry Point**: `src/main.tsx` -> `src/App.tsx`.
- **Package Manager**: `npm` (with `package-lock.json`).
- **Build Command**: `npm run build` (`npm run generate:manifest && vite build`).
- **Dev Command**: `npm run dev` (`vite --host`).
- **Type-Check Command**: `npm run typecheck` (`tsc -b`).
- **Lint Command**: `npm run lint` (`oxlint`).
- **Test Command**: None configured by default; builds verified with SSG prerendering.
- **Key Dependencies**: `@tanstack/react-query`, `zustand`, `lucide-react`, `leaflet`, `lottie-react`, `zod`, `socket.io-client`, `vite-prerender-plugin`.
- **Deployment Target**: Static export via Nginx reverse proxy / CDN on self-hosted VPS.
- **Environment Variables**:
  - `VITE_API_URL` (REST endpoint, e.g., `https://quickbihar.in/api/v1`)
  - `VITE_SOCKET_URL` (Socket.IO endpoint)
  - `VITE_RAZORPAY_KEY_ID` (Razorpay public key ID)
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (Google OAuth Client ID)

---

### 2.2 Management Dashboard (`dash-web`)
- **Purpose**: Operations, seller store management, rider approvals, catalog management, and administrative oversight.
- **Runtime & Framework**: React 19.2.8, Vite 8.3.0, React Router v7, Tailwind CSS v4.
- **Entry Point**: `src/main.tsx` -> `src/App.tsx`.
- **Package Manager**: `npm` (with `package-lock.json`).
- **Build Command**: `npm run build` (`tsc -b && vite build`).
- **Dev Command**: `npm run dev` (`vite`).
- **Type-Check Command**: `npm run typecheck` (`tsc -b`).
- **Lint Command**: `npm run lint` (`oxlint`).
- **Key Dependencies**: `@tanstack/react-query`, `zustand`, `recharts`, `xlsx`, `socket.io-client`, `react-hook-form`, `zod`.
- **Deployment Target**: Static build served via Nginx on `dashboard.quickbihar.in` or `/admin`, `/seller`.
- **Environment Variables**:
  - `VITE_API_BASE_URL` (Backend API root)
  - `VITE_SOCKET_URL` (Realtime events socket)

---

### 2.3 Storefront & Rider Mobile App (`mobile`)
- **Purpose**: Native Android & iOS application for customers (discovery, cart, checkout, order tracking) and riders (job offers, pickups, deliveries, cash reconciliation).
- **Runtime & Framework**: React Native 0.85.3, Expo SDK 56.0.0, Expo Router v56.
- **Entry Point**: `expo-router/entry`.
- **Package Manager**: `bun` / `npm`.
- **Build Command**: `bun expo run:android --variant release` or EAS Build (`eas build`).
- **Dev Command**: `bun expo start -c`.
- **Lint Command**: `bun run lint` (`expo lint`).
- **Test Command**: `jest` (`bun test` compatible).
- **Key Dependencies**: `react-native-razorpay`, `@tanstack/react-query`, `zustand`, `expo-location`, `expo-notifications`, `socket.io-client`, `react-native-reanimated`.
- **Deployment Target**: Google Play Store (AAB/APK) and Apple App Store (IPA).

---

### 2.4 Backend API & Realtime Orchestrator (`server`)
- **Purpose**: Authoritative single source of truth for auth, products, orders, payments, hyperlocal dispatch, real-time tracking, and background workers.
- **Runtime & Framework**: Bun runtime, Express 5.2.1, Mongoose 9.4.1 (MongoDB), Socket.IO 4.8.3, BullMQ 5.78.0 (Redis).
- **Entry Point**: `src/server.ts` -> `src/app.ts`.
- **Package Manager**: `bun` (with `bun.lock`).
- **Build Command**: `bun run build` (`bun build src/server.ts --target bun --outdir ./dist --packages external --minify`).
- **Dev Command**: `bun run dev` (`bun run --watch src/server.ts`).
- **Test Command**: `bun test`.
- **Production Start Command**: `bun run start` (`bun run dist/server.js`).
- **Key Dependencies**: `razorpay`, `firebase-admin`, `imagekit`, `resend`, `ioredis`, `pdfkit`, `bcryptjs`, `jsonwebtoken`, `zod`.
- **Required Environment Variables**:
  - `PORT`: HTTP port (default 8000)
  - `MONGO_URI`: MongoDB connection string
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection for queues and cache
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: Session security tokens
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: Payment gateway secrets
  - `GOOGLE_CLIENT_ID`: Google OAuth credential
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: Push notifications
  - `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`: Media uploads
  - `RESEND_API_KEY`: Email notifications

---

## 3. Realtime & Background Infrastructure

1. **Socket.IO Engine (`socket.service.ts`)**:
   - Manages live rooms: Order rooms (`order:{orderId}`), Sub-order rooms (`suborder:{subOrderId}`), Admin broadcast (`admin`), Seller broadcast (`seller:{sellerId}`), Rider broadcast (`delivery:{riderId}`).
   - Emits live events: `ORDER_STATUS_UPDATE`, `STOCK_UPDATE`, `RIDER_JOB_OFFER`, `FULFILLMENT_EVENT`.
2. **Matching Service Loop (`matching.service.ts`)**:
   - Background polling daemon running every 5 seconds.
   - Evaluates sub-orders with status `CONFIRMED` / `RIDER_SEARCHING`.
   - Locates online riders within store delivery radius, filters riders exceeding COD cash liability limits (`assertRiderCanAcceptCod`), and pushes targeted job offers with 45-second expiry.
3. **Notification Worker (`notification.worker.ts`)**:
   - BullMQ queue processing push notifications asynchronously via Firebase FCM and transactional email via Resend.

---

## 4. Hyperlocal Data Architecture & Constraints

1. **GPS Coordinate Dependency**:
   - Store matching, serviceability radius (`deliveryRadiusKm`), and rider distance calculations are calculated strictly from GPS coordinates:
     - `pincode`: Secondary fallback.
     - `latitude` & `longitude`: Primary mandatory criteria.
2. **Multi-Seller Order Splitting**:
   - A single customer checkout cart is persisted as one `Order` (parent) and atomically split into $N$ `SubOrder` records—one per unique seller store.
   - Each sub-order maintains independent fulfillment lifecycles, seller phone confirmation, rider assignment, pickup OTP, and delivery OTP.

---

## 5. Architectural Risks & Observations

1. **State Reconciliation & Webhooks**:
   - Prior to recent fixes, Razorpay webhooks were unhandled; now addressed by mounting `/api/v1/orders/webhook` with HMAC validation.
2. **Test Suite Mock Coherence**:
   - Legacy tests in `server/src/_tests_/` rely on static mocks that drifted from recent RBAC permission models and `product.dao.ts` queries. Fixed in remediation phase.
3. **Purity in React Native Client**:
   - `mobile/` has strict ESLint / React compiler rules catching impure `useRef(Date.now())` and hoisting declaration patterns. Addressed in remediation phase.
