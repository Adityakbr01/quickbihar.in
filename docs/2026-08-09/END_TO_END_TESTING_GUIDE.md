# 🧪 QuickBihar — Real-World End-to-End (E2E) Testing Guide

Comprehensive real-world testing procedures for QuickBihar using **real physical mobile phones, real SMS delivery, real users, real database, and real production-like environment**.

---

## 📋 Table of Contents
1. [Environment & Prerequisites](#1-environment--prerequisites)
2. [REAL_WORLD_END_TO_END_TEST](#real_world_end_to_end_test)
   - [Step 1 — Prepare the Environment](#step-1--prepare-the-environment)
   - [Step 2 — Configure Real SMS Provider](#step-2--configure-real-sms-provider)
   - [Step 3 — Real User Registration Test (Physical Phone)](#step-3--real-user-registration-test-physical-phone)
   - [Step 4 — Real Existing User Login Test](#step-4--real-existing-user-login-test)
   - [Step 5 — Real Email + Password Credentials Setup & Login Test](#step-5--real-email--password-credentials-setup--login-test)
   - [Step 6 — Test Failure Scenarios with Real Phone](#step-6--test-failure-scenarios-with-real-phone)
   - [Step 7 — Database Verification Checks](#step-7--database-verification-checks)
   - [Step 8 — Full Application Journey Test](#step-8--full-application-journey-test)
   - [Step 9 — Evidence-Based Test Result Template](#step-9--evidence-based-test-result-template)
3. [Final E2E Checklist](#final-e2e-checklist)

---

## 1. Environment & Prerequisites

Before initiating real-world E2E tests:
- **Physical Device**: An active Android/iOS smartphone with a working SIM card capable of receiving SMS messages.
- **Node runtime**: Bun (`v1.3+`) or Node (`v20+`).
- **Database**: MongoDB Atlas instance (or local MongoDB).
- **Redis**: Redis server running on port `6379`.

---

# REAL_WORLD_END_TO_END_TEST

## Step 1 — Prepare the Environment

### Software Installation & Services
1. **Start Backend Server**:
   ```bash
   cd server
   bun run dev
   ```
   *Runs at `http://localhost:8000` (or `https://quickbihar.in` in staging/production).*

2. **Start Web Frontend Dashboard**:
   ```bash
   cd web
   npm run dev
   ```
   *Runs at `http://localhost:3000`.*

3. **Start Mobile App**:
   ```bash
   cd mobile
   npx expo start --clear
   ```
   *Scan QR code using Expo Go or install release APK on physical Android phone.*

### Required Network & URL Configurations
- **Staging/Production Setup**: Requires HTTPS (e.g. `https://quickbihar.in`). Localhost IP (`127.0.0.1`) cannot receive SMS callbacks or real push notifications on physical mobile phones.
- **Port Access**: Port `8000` (API), `3000` (Web), `6379` (Redis).

---

## Step 2 — Configure Real SMS Provider

To test real SMS OTP delivery on physical phones:

### Provider Option A: Fast2SMS (Recommended for India)
1. Register account at [Fast2SMS](https://www.fast2sms.com/).
2. Obtain **API Authorization Key** from Dev API section.
3. For Indian numbers, register DLTTemplate ID or use Quick SMS route.
4. Add credentials to `server/.env`:
   ```env
   SMS_PROVIDER=FAST2SMS
   FAST2SMS_API_KEY=your_actual_fast2sms_api_key_here
   ```

### Provider Option B: MSG91
1. Register at [MSG91](https://msg91.com/).
2. Obtain AuthKey and Flow ID for OTP.
3. Add credentials to `server/.env`:
   ```env
   SMS_PROVIDER=MSG91
   MSG91_AUTH_KEY=your_msg91_auth_key
   MSG91_OTP_TEMPLATE_ID=your_template_id
   ```

### Verification of SMS Credentials
Run SMS test utility script:
```bash
cd server
bun run src/utils/testSms.ts --phone=+919876543210
```
- **PASS**: Output shows `HTTP 200 OK` and SMS arrives on physical phone handset within 15 seconds.
- **FAIL**: Error `401 Unauthorized` or DLT route rejected.

---

## Step 3 — Real User Registration Test (Physical Phone)

Follow this 14-step verification procedure:

```text
1. Take physical mobile phone with SIM active.
2. Open QuickBihar Mobile App or Web Storefront.
3. Click "Sign Up" / "Login with Phone".
4. Enter real mobile number (+91 98XXXXXX10).
5. Tap "Send OTP".
6. Check physical phone handset inbox.
7. Confirm real SMS is received (Sender: FAST2SMS / QKBIHR, Body: "Your QuickBihar code is XXXXXX").
8. Enter 6-digit OTP code in application screen.
9. Tap "Verify & Continue".
10. Confirm backend accepts OTP (HTTP 200 OK).
11. Check MongoDB database: Verify user document created in 'users' collection.
12. Confirm 'phoneVerified' is true.
13. Confirm JWT accessToken & refreshToken issued to client storage.
14. Confirm app redirects to authenticated Customer Dashboard.
```

### Verification Criteria:
- **PASS**: Real SMS delivered to handset, valid JWT session created, database contains verified phone record.
- **FAIL**: SMS not received on phone, or `123456` hardcoded code required, or DB record missing.

---

## Step 4 — Real Existing User Login Test

After completing registration in Step 3:

```text
1. Open App Menu -> Tap "Logout". Confirm session cleared.
2. Return to Login screen.
3. Enter the SAME real mobile number used in Step 3.
4. Tap "Request OTP".
5. Receive real SMS on physical phone handset.
6. Enter 6-digit OTP code.
7. Tap "Verify & Login".
8. Check Backend Log: Confirm existing user account (same MongoDB _id) is fetched.
9. Check Database: Confirm NO duplicate user document was created.
10. Confirm authenticated session established and user profile displays existing address/orders.
```

---

## Step 5 — Real Email + Password Credentials Setup & Login Test

Test attaching optional email/password credentials to the primary mobile identity:

```text
PRIMARY IDENTITY (Verified Mobile Number)
            ↓
  Optional Credentials Addition (Email + Password)
            ↓
  Alternative Login Method (Email/Password Login without Phone OTP)
```

### Execution Steps:
1. Log in using Mobile OTP (Step 4).
2. Go to **Profile Settings** -> **Security & Account Credentials**.
3. Enter real email address (`test.user@quickbihar.in`) and set password (`SecurePass@123`).
4. Save credentials.
5. Log out of application.
6. Open Login Screen -> Select **"Login with Email & Password"**.
7. Enter email `test.user@quickbihar.in` and password `SecurePass@123`.
8. Do NOT enter mobile phone number.
9. Tap "Sign In".
10. **Verify Outcome**: Authentication succeeds without needing SMS OTP.
11. **Database Check**: Inspect MongoDB user document:
    - Same `_id` preserved.
    - `phone` field retains verified mobile number.
    - `email` field populated.
    - `password` field securely stored as bcrypt hash (`$2a$...`).
12. **Duplicate Check**: Confirm total user document count in database remains unchanged.

---

## Step 6 — Test Failure Scenarios with Real Phone

### 1. OTP Failure Scenarios
- **Wrong OTP**: Enter `000000` -> Expect UI error: `"Invalid OTP code"` (HTTP 400).
- **Expired OTP**: Wait 10 minutes -> Enter code -> Expect UI error: `"OTP expired"` (HTTP 400).
- **Old OTP After Resend**: Tap Resend -> Enter first OTP code -> Expect error: `"OTP expired or mismatch"`.
- **OTP Cooldown Rate Limit**: Tap "Resend OTP" twice within 60 seconds -> Expect HTTP 429 `"Too many requests. Wait 60 seconds."`

### 2. SMS Gateway Failure Scenarios
- **Invalid API Key**: Set dummy SMS key in `.env` -> Tap Request OTP -> Expect server error fallback gracefully handled without crashing process.
- **Invalid Phone Format**: Enter `12345` -> Expect frontend/zod validation error `"Enter valid 10-digit mobile number"`.

### 3. Account Security Failure Scenarios
- **Wrong Email Password**: Enter correct email + wrong password -> Expect HTTP 401 `"Invalid password credentials"`.
- **Blocked Account**: Admin blocks user -> User tries login -> Expect HTTP 403 `"Your account has been blocked"`.

---

## Step 7 — Database Verification Checks

Run MongoDB shell commands or compass queries to verify state during testing:

### 1. Verify User Document After Mobile Registration
```javascript
db.users.findOne({ phone: "9876543210" })
```
*Expected Output:*
```json
{
  "_id": ObjectId("64f..."),
  "phone": "9876543210",
  "isVerified": true,
  "roleId": ObjectId("..."),
  "createdAt": ISODate("2026-08-09T...")
}
```

### 2. Verify User Document After Adding Email & Password
```javascript
db.users.findOne({ phone: "9876543210" })
```
*Expected Output:*
```json
{
  "_id": ObjectId("64f..."),
  "phone": "9876543210",
  "email": "test.user@quickbihar.in",
  "password": "$2a$10$e8Z...",
  "isVerified": true
}
```

---

## Step 8 — Full Application Journey Test

After successful authentication, perform end-to-end user actions:

```text
Storefront Browse -> Add to Cart -> Apply Coupon -> Checkout -> Select COD -> Order Placed (Sub-Orders Created)
                                                                                  ↓
Rider Receives Broadcast Notification -> Accepts Offer -> Arrives at Seller -> Pickup Handover
                                                                                  ↓
Rider Arrives at Customer Address -> Customer Provides 4-Digit Delivery OTP -> Delivery Completed
                                                                                  ↓
Admin Reconciles COD Settlement & Seller Earnings Ledger
```

---

## Step 9 — Evidence-Based Test Result Template

Record E2E test evidence using this standard format:

```text
Test ID: AUTH-E2E-REAL-001
Test Name: Mobile Registration with Real SMS OTP
Environment: Staging (https://quickbihar.in)
Device: Physical Samsung Galaxy S23 (Android 14)
Mobile Number: +91 98*****210
SMS Provider: Fast2SMS (DLT Approved Template)
Timestamp: 2026-08-09 22:45:00 IST
Result: PASS
Evidence Summary:
 - Real SMS received on phone in 8 seconds.
 - User record created in MongoDB (ID: 66b...).
 - JWT token returned and stored in SecureStore.
 - Authenticated storefront session verified.
```

---

## Final E2E Checklist

### REAL PHONE & SMS
- [ ] Physical phone available with active SIM card
- [ ] Real SMS provider account configured (Fast2SMS / MSG91 / Twilio)
- [ ] Real SMS OTP received on physical handset
- [ ] SMS delivery latency under 15 seconds

### AUTHENTICATION & IDENTITY
- [ ] Mobile OTP registration creates verified user in MongoDB
- [ ] Mobile OTP login reuses existing user without creating duplicates
- [ ] Email + Password credentials attached to existing mobile user
- [ ] Email + Password login succeeds without requiring phone number
- [ ] User ID remains identical across login methods

### FAILURE SCENARIOS & SECURITY
- [ ] Invalid OTP code rejected (HTTP 400)
- [ ] Expired OTP code rejected (HTTP 400)
- [ ] OTP rate limit cooldown enforced (60s / HTTP 429)
- [ ] Wrong email/password rejected (HTTP 401)
- [ ] Blocked user account access forbidden (HTTP 403)

### FULL E2E APPLICATION FLOW
- [ ] Storefront browsing & size chart modal verified
- [ ] Cart aggregation & coupon code applied
- [ ] Checkout COD order placed & split into seller sub-orders
- [ ] Seller accepts order & marks ready for pickup
- [ ] Delivery partner receives broadcast offer & accepts
- [ ] Delivery partner verifies 4-digit OTP from customer to complete order
- [ ] Admin COD cash settlement & seller earnings ledger verified
