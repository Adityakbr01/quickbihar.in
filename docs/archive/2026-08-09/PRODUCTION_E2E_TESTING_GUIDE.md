# 🚀 QuickBihar - A to Z Production & E2E Testing Guide

Comprehensive step-by-step testing guide for QuickBihar multi-vendor e-commerce platform.

---

## 📋 Table of Contents
1. [Pre-Requisites & Environment Audit](#1-pre-requisites--environment-audit)
2. [Step 0: Database Cleaning & System Reset](#step-0-database-cleaning--system-reset)
3. [Phase 1: System Admin Setup & Commission Audit](#phase-1-system-admin-setup--commission-audit)
4. [Phase 2: Seller Registration, Approval & Cataloging](#phase-2-seller-registration-approval--cataloging)
5. [Phase 3: Delivery Partner (Rider) Registration & Online Status](#phase-3-delivery-partner-rider-registration--online-status)
6. [Phase 4: Customer Account, Browse & Cart Flow](#phase-4-customer-account-browse--cart-flow)
7. [Phase 5: Checkout & Order Placement (COD vs Online Payment)](#phase-5-checkout--order-placement-cod-vs-online-payment)
8. [Phase 6: Seller Order Dispatch & Package Handover](#phase-6-seller-order-dispatch--package-handover)
9. [Phase 7: Rider Acceptance, Pickup & OTP Verification Delivery](#phase-7-rider-acceptance-pickup--otp-verification-delivery)
10. [Phase 8: Return, Replacement & Wallet Refund Lifecycle](#phase-8-return-replacement--wallet-refund-lifecycle)
11. [Phase 9: Seller Earnings, Ledger & COD Cash Settlement Audit](#phase-9-seller-earnings-ledger--cod-cash-settlement-audit)
12. [⚠️ Do's and Don'ts (Kya Karna Hai Aur Kya Nahi)](#️-dos-and-donts-kya-karna-hai-aur-kya-nahi)

---

## 1. Pre-Requisites & Environment Audit

Before running production tests, ensure the environment variables in `./server/.env`, `./web/.env`, and `./mobile/.env` are properly set.

### Backend (`./server/.env`)
- `NODE_ENV`: Set to `production` (or `staging` for pre-launch testing).
- `PORT`: `8000` (or `5002` behind Nginx).
- `MONGODB_URI`: Valid MongoDB Atlas connection URI.
- `REDIS_URL`: `redis://localhost:6379` (Required for BullMQ & real-time queues).
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`: Generate 64-character random strings (DO NOT use default placeholders).
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Test keys (`rzp_test_...`) for testing; Live keys (`rzp_live_...`) for production launch.
- `SMS_API_KEY` / `FAST2SMS_API_KEY`: **CRITICAL FOR PRODUCTION**: SMS Gateway API Key (Fast2SMS, MSG91, or Twilio) required for sending real Mobile OTP to customer/rider phone numbers.

### Web Dashboard (`./web/.env`)
- `NEXT_PUBLIC_API_URL`: `/api/v1` (or `https://quickbihar.in/api/v1`).
- `NEXT_PUBLIC_SOCKET_URL`: `/` (or `https://quickbihar.in`).

### Mobile App (`./mobile/.env`)
- `EXPO_PUBLIC_API_ORIGIN`: `https://quickbihar.in` (or your local IP for dev testing).

---

## Step 0: Database Cleaning & System Reset

To start testing with a clean slate (deleting all dummy orders, test products, fake sellers, and riders while keeping system RBAC and Admin):

1. Open terminal in `./server`:
```bash
cd server
bun run db:clean
```
2. *(Optional)* Import fresh default categories and sample catalog:
```bash
bun run db:import
```
3. Start the backend server:
```bash
bun run dev
```

---

## Phase 1: System Admin Setup & Commission Audit

### Goal: Verify Admin login and global marketplace configuration.

1. **Admin Login**:
   - Open Web Browser -> Navigate to `/admin/login`.
   - Credentials: `ADMIN_EMAIL` (e.g., `admin@quickbihar.com`) and `ADMIN_PASSWORD`.
   - **Expected Outcome**: Successfully lands on `/admin/dashboard`.

2. **Marketplace Settings Check**:
   - Go to **Admin Settings** (`/admin/settings`).
   - Verify Commission Rate (e.g. 10%).
   - Verify Delivery Base Fee & Rider Payout logic.
   - **Expected Outcome**: Rates load without NaN or broken fields.

---

## Phase 2: Seller Registration, Approval & Cataloging

### Goal: Onboard a seller, approve from Admin, and publish a product.

1. **Seller Registration**:
   - Navigate to `/seller/register`.
   - Fill details:
     - Store Name: **Patna Ethnic Apparel**
     - Contact Email: `seller.test@quickbihar.in`
     - Phone: `9876543210`
     - Business Address, Bank Account, GSTIN/PAN.
   - Submit application.

2. **Admin Approval**:
   - Login to Admin Panel -> Go to **Sellers / Applications**.
   - Find `seller.test@quickbihar.in`.
   - Click **Approve & Activate**.

3. **Seller Product Upload**:
   - Login to Seller Portal (`/seller/login`).
   - Go to **Products** -> **Add New Product**.
   - Fill Product Details:
     - Title: **Traditional Silk Kurta**
     - Category: **Clothing -> Men**
     - Selling Price: `₹1,499` | MRP: `₹2,499`
     - Stock Quantity: `20 units`
     - Assign Size Chart: **Men's Ethnic Size Chart**
   - Click **Publish Product**.
   - **Expected Outcome**: Product shows status `ACTIVE` and is visible on storefront.

---

## Phase 3: Delivery Partner (Rider) Registration & Online Status

### Goal: Register a rider, verify documents, and activate availability.

1. **Rider Registration**:
   - Go to `/delivery/register` (or Rider App).
   - Enter Name: **Rajesh Rider**, Email: `rider.test@quickbihar.in`, Phone: `9123456789`, Vehicle No: `BR01QB1234`.
   - Submit registration.

2. **Admin Verification**:
   - Admin Panel -> **Riders / Delivery Partners**.
   - Locate `rider.test@quickbihar.in` -> Click **Approve**.

3. **Rider Online Toggle**:
   - Login as Rider -> Toggle status to **ONLINE**.
   - **Expected Outcome**: Status turns Green (Available for broadcast orders).

---

## Phase 4: Customer Account, Browse & Cart Flow

### Goal: Customer registration, address addition, catalog browsing, and cart creation.

1. **Customer Signup**:
   - Open Storefront (`/`).
   - Sign up with `customer.test@quickbihar.in`.

2. **Saved Address Setup**:
   - Profile -> **Saved Addresses** -> **Add Address**.
   - Address: **Boring Road, Patna, Bihar - 800001**.

3. **Product Discovery & Cart**:
   - Search for **"Traditional Silk Kurta"**.
   - Select Size **L (42)** -> Click **Add to Cart**.
   - Open Cart (`/cart`).
   - **Expected Outcome**: Price, taxes, and shipping fee calculated correctly.

---

## Phase 5: Checkout & Order Placement (COD vs Online Payment)

### Goal: Test both Cash on Delivery (COD) and Razorpay Online payment flows.

### Test Case A: Cash on Delivery (COD)
1. In Cart, click **Proceed to Checkout**.
2. Select saved address (**Patna**).
3. Select Payment Method: **Cash on Delivery (COD)**.
4. Click **Place Order**.
5. **Expected Outcome**:
   - Order confirmation page appears with Order ID (`ORD-XXXXXX`).
   - Sub-orders generated per seller.
   - Status set to `PLACED` / `PENDING_ACCEPTANCE`.

### Test Case B: Online Payment (Razorpay Test Mode)
1. Repeat checkout with another item.
2. Select Payment Method: **Online Payment (Razorpay)**.
3. Use Razorpay Test Card credentials:
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: `123`, OTP: `1234`
4. **Expected Outcome**:
   - Webhook verifies signature.
   - Order marked as `PAID`.

---

## Phase 6: Seller Order Dispatch & Package Handover

### Goal: Seller receives notification, accepts order, and marks ready for pickup.

1. Seller logs into Seller Panel -> **Orders / Sub-Orders**.
2. Locate Sub-order for **Traditional Silk Kurta**.
3. Click **Accept Order** (Status -> `PROCESSING`).
4. Click **Mark Ready for Pickup** (Status -> `READY_FOR_PICKUP`).
5. **Expected Outcome**: System triggers broadcast to online riders nearby via WebSockets/FCM.

---

## Phase 7: Rider Acceptance, Pickup & OTP Verification Delivery

### Goal: Rider accepts job, picks up from seller, navigates to customer, and completes delivery using OTP.

1. **Rider Accepts Job**:
   - Rider app receives broadcast offer -> Click **Accept Delivery**.
   - Status updates to `RIDER_ASSIGNED`.

2. **Pickup Handover**:
   - Rider arrives at seller location -> Click **Confirm Pickup**.
   - Order status changes to `OUT_FOR_DELIVERY`.
   - **System sends 4-digit Delivery OTP** to Customer via SMS/Notification.

3. **Delivery Completion**:
   - Rider arrives at Customer address.
   - Customer shares 4-digit Delivery OTP (e.g. `4821`).
   - Rider enters OTP into Rider App -> Click **Verify & Complete Delivery**.
   - **Expected Outcome**:
     - Status updates to `DELIVERED`.
     - COD money marked as `COLLECTED` by Rider.

---

## Phase 8: Return, Replacement & Wallet Refund Lifecycle

### Goal: Test return request, approval, reverse pickup, and customer refund.

1. **Customer Return Request**:
   - Customer Profile -> **My Orders** -> Select Delivered Order.
   - Click **Request Return**. Select Reason: **Wrong Size**.
   - Submit request.

2. **Seller/Admin Approval**:
   - Seller Panel -> **Return Requests** -> Click **Approve Return**.
   - Item reverse picked up or marked received.
   - Status updates to `RETURN_RECEIVED`.

3. **Refund Process**:
   - Admin/System triggers refund.
   - **Expected Outcome**: Wallet balance or Razorpay refund triggered successfully.

---

## Phase 9: Seller Earnings, Ledger & COD Cash Settlement Audit

### Goal: Reconcile financial records for sellers and riders.

1. **Seller Earnings**:
   - Seller Panel -> **Earnings & Payouts**.
   - Check Net Payout = `Product Price - Marketplace Commission - Fixed Fees`.

2. **Rider COD Settlement**:
   - Admin Panel -> **Fulfillment & COD Settlements**.
   - Verify COD cash collected by Rider `Rajesh Rider`.
   - Admin clicks **Settle Cash**.
   - **Expected Outcome**: Cash balance updated to ₹0.

---

## ⚠️ Do's and Don'ts (Kya Karna Hai Aur Kya Nahi)

### ✅ WHAT TO DO (Kya Karna Hai):
- **DO** test with valid email formats and phone numbers.
- **DO** use test Razorpay credentials (`rzp_test_...`) during pre-launch testing.
- **DO** test OTP delivery code verification accurately during handover.
- **DO** test Redis background service before launching (ensure BullMQ queue works).
- **DO** test mobile web storefront and native APK on real physical phones.
- **DO** change all default JWT secrets and admin passwords before production deployment.

### ❌ WHAT NOT TO DO (Kya Nahi Karna Hai):
- **DON'T** test Razorpay Live mode with real credit cards until test mode E2E is 100% clean.
- **DON'T** deploy without SSL (HTTPS) enabled on domain `quickbihar.in`.
- **DON'T** use default placeholders (`your-very-secret-access-token-key`) in production `.env`.
- **DON'T** skip checking Redis server connectivity.
- **DON'T** wipe production database while real users are active!
