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
- [ ] Add Webhook URL: `https://api.quickbihar.in/api/v1/webhooks/razorpay`.
- [ ] Enter Secret: Match the value configured in `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Enable Events:
  - `payment.captured`
  - `payment.failed`
  - `refund.processed`
  - `order.paid`

---

## 3. Database Indexes & Migrations

Verify the following MongoDB indexes are present before directing live traffic:
- [ ] **Stores:** `location.coordinates` (`2dsphere`) for nearby store calculation.
- [ ] **Users:** `phone` (`unique`), `email` (`sparse, unique`).
- [ ] **Orders:** `orderId` (`unique`), `user` (`index`), `createdAt` (`index`).
- [ ] **SubOrders:** `subOrderId` (`unique`), `sellerId` (`index`), `status` (`index`).

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

Perform the following smoke tests immediately after deployment:
1. **Health Check:** `curl -f https://api.quickbihar.in/api/v1/health` (Expect `200 OK`).
2. **Customer Registration & Login:** Create test customer account via web app.
3. **Product Discovery:** Search for clothing items and check nearby store listings.
4. **Checkout & Order Quote:** Add product to cart, input address with pin, verify real-time quote generation.
5. **Payment Capture:** Complete a small ₹1 live test transaction with Razorpay UPI/Netbanking; verify order status transitions to `CONFIRMED`.
6. **Seller Dashboard:** Log in as seller; verify sub-order appears under new orders.
7. **Rider Workspace:** Verify broadcast order notification and claim mechanics.

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
