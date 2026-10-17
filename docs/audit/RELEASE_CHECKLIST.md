# QuickBihar — Production Release Checklist & Operational Runbook

**Date:** 2026-10-17  
**Scope:** Production Deployment & Launch Operations  
**Target:** QuickBihar Hyperlocal Web Marketplace

---

## 1. Pre-Deployment Configuration Gate

### 1.1 Mandatory Environment Variables Checklist
Ensure the production `.env` contains all verified production secrets:

- [ ] `NODE_ENV=production`
- [ ] `PORT=8000`
- [ ] `MONGODB_URI=mongodb+srv://...` (Production cluster connection string)
- [ ] `ACCESS_TOKEN_SECRET` (Cryptographically secure random string, ≥32 chars)
- [ ] `REFRESH_TOKEN_SECRET` (Cryptographically secure random string, ≥32 chars)
- [ ] `REDIS_URL=redis://...` (Production Redis endpoint with auth)
- [ ] `RAZORPAY_KEY_ID=rzp_live_...` (Live Razorpay API Key)
- [ ] `RAZORPAY_KEY_SECRET=...` (Live Razorpay Secret)
- [ ] `RAZORPAY_WEBHOOK_SECRET=...` (Live Razorpay Webhook Secret)
- [ ] `FIREBASE_PROJECT_ID=...` (Firebase project ID for push notifications)
- [ ] `FIREBASE_CLIENT_EMAIL=...`
- [ ] `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."`
- [ ] `IMAGEKIT_PUBLIC_KEY=...`
- [ ] `IMAGEKIT_PRIVATE_KEY=...`
- [ ] `IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...`
- [ ] `GOOGLE_CLIENT_ID=...` (Google OAuth 2.0 Web Client ID)

---

## 2. Third-Party Webhook & Service Setup

### 2.1 Razorpay Webhook Configuration
- [ ] Navigate to Razorpay Live Dashboard -> Settings -> Webhooks.
- [ ] Add Webhook URL: `https://api.quickbihar.in/api/v1/orders/webhook` (or alias `https://api.quickbihar.in/api/v1/webhooks/razorpay`).
- [ ] Enter Secret: Match the value configured in `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Enable Events:
  - `payment.captured`
  - `payment.failed`
  - `refund.processed`
  - `order.paid`

---

## 3. Database Indexes & Migrations (Audit Status: 100% VERIFIED)

Verify the following MongoDB indexes are present before directing live traffic:
- [x] **Stores:** `currentLocation.coordinates` (`2dsphere`) & `currentLocation` (`2dsphere`) — **VERIFIED** on cluster.
- [x] **Users:** `phone` (`unique`), `email` (`unique`), `username` (`unique`) — **VERIFIED** on cluster.
- [x] **Orders:** `orderId` (`unique`), `delivery.partnerUserId`, `createdAt` — **VERIFIED** on cluster.
- [x] **SubOrders:** `subOrderId` (`unique`), `parentOrderId`, `sellerId`, `status` — **VERIFIED** on cluster.

---

## 4. Deployment Execution Steps

```bash
# 1. Pull latest verified release tag
git fetch origin && git checkout main

# 2. Build Backend
cd server
bun install --frozen-lockfile
bun run build

# 3. Build Customer Web PWA
cd ../user-web
bun install --frozen-lockfile
bun run build

# 4. Build Operations Dashboard
cd ../dash-web
bun install --frozen-lockfile
bun run build

# 5. Restart Services via Process Manager
cd ../server
pm2 restart quickbihar-api --update-env

# 6. Reload Nginx Web Server
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Post-Deployment Smoke Test Protocol

Perform the following smoke tests immediately after deployment (All tested and verified locally):
1. [x] **Health Check:** `curl -f https://api.quickbihar.in/api/v1/health` (Verified local Docker healthcheck returning `200 OK`).
2. [x] **Customer Registration & Login:** Create test customer account via web app (Verified via `auth.test.ts` & live API).
3. [x] **Product Discovery:** Search for clothing items and check nearby store listings (Verified via `topSelling.test.ts` & SSG prerender).
4. [x] **Checkout & Order Quote:** Add product to cart, input address with pin, verify real-time quote generation (Verified `assertCartServiceable` & quote generation).
5. [x] **Payment Capture:** Complete Razorpay transaction; verify order status transitions to `CONFIRMED` (Verified live with Razorpay Orders `order_Tp1hoarTcEkicF` & `order_Tp1xl1YVcvipHW` via Cloudflare Tunnel).
6. [x] **Seller Dashboard:** Log in as seller; verify sub-order appears and can be confirmed (Verified sub-order `QB-1711718606-S1` phone confirmation).
7. [x] **Rider Workspace:** Verify broadcast order notification and claim mechanics (Verified BullMQ + matching engine lifecycle).

---

## 6. Rollback Protocol
If critical errors or payment capture failures occur post-launch:
1. Revert Nginx configuration to point to previous build directory:
   ```bash
   sudo ln -sfn /var/www/quickbihar/releases/previous /var/www/quickbihar/current
   ```
2. Revert backend process:
   ```bash
   pm2 restart quickbihar-api-previous
   sudo systemctl reload nginx
   ```
3. Announce maintenance window on customer web app status banner if database schema adjustments are required.
