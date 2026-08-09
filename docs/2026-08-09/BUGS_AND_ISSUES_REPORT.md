# 🐛 QuickBihar — Bugs & Issues Report

Detailed list of all technical defects, missing components, security risks, and configuration errors discovered during full application audit.

---

## 🚨 CRITICAL SEVERITY ISSUES

### Issue ID: BUG-CRIT-001
- **Title**: Missing SMS Gateway Provider for Mobile OTP Authentication
- **Severity**: CRITICAL
- **Priority**: HIGH
- **Affected Component**: Authentication Module (`server/src/modules/common/auth/auth.service.ts`)
- **Location/File**: [auth.service.ts](file:///c:/Users/ADITYA/Desktop/quickbihar.in/server/src/modules/common/auth/auth.service.ts#L240-L260)
- **How to Reproduce**:
  1. Set `NODE_ENV=production` in `server/.env`.
  2. Open Mobile App or API -> Call `POST /api/v1/auth/request-otp` with `{ phone: "9876543210" }`.
  3. Check physical phone handset.
- **Expected Behavior**: Server calls SMS Gateway (Fast2SMS/MSG91/Twilio) and delivers a 6-digit SMS OTP to the physical phone.
- **Actual Behavior**: Server generates OTP code, prints it to stdout (`console.log`), and sends NO SMS.
- **Root Cause**: No SMS Gateway SDK or HTTP API client exists in the codebase for mobile numbers.
- **Impact**: End-users and riders cannot register or log in using mobile numbers in production.
- **Recommended Fix**: Implement `sms.service.ts` using Fast2SMS / MSG91 / Twilio API and invoke it in `requestOTP()`.
- **Fix Status**: BLOCKED (Requires SMS Provider Credentials from User).

---

### Issue ID: BUG-CRIT-002
- **Title**: Development Placeholder JWT Secret Keys Used in Production Environment
- **Severity**: CRITICAL
- **Priority**: HIGH
- **Affected Component**: Security / Environment Configuration
- **Location/File**: [server/.env](file:///c:/Users/ADITYA/Desktop/quickbihar.in/server/.env#L3-L6)
- **How to Reproduce**: Inspect `server/.env` lines 3 and 5.
- **Expected Behavior**: High-entropy 64-character secret keys.
- **Actual Behavior**: `ACCESS_TOKEN_SECRET=your-very-secret-access-token-key` and `REFRESH_TOKEN_SECRET=your-very-secret-refresh-token-key`.
- **Root Cause**: Unchanged default environment template values.
- **Impact**: Vulnerable to token forgery and unauthorized session hijacking.
- **Recommended Fix**: Generate cryptographically secure secret strings (`openssl rand -hex 32`).
- **Fix Status**: PENDING CONFIGURATION.

---

### Issue ID: BUG-CRIT-003
- **Title**: Weak Default Admin Credentials in Production Environment
- **Severity**: CRITICAL
- **Priority**: HIGH
- **Affected Component**: System Admin Security
- **Location/File**: [server/.env](file:///c:/Users/ADITYA/Desktop/quickbihar.in/server/.env#L12-L13)
- **How to Reproduce**: Login to `/admin/login` using `admin@gmail.com` and `admin123`.
- **Expected Behavior**: Production admin email and strong password.
- **Actual Behavior**: Publicly known test admin credentials.
- **Root Cause**: Default seed environment variables.
- **Impact**: Full unauthorized administrative takeover of marketplace.
- **Recommended Fix**: Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` to production credentials.
- **Fix Status**: PENDING CONFIGURATION.

---

## 🟠 HIGH SEVERITY ISSUES

### Issue ID: BUG-HIGH-004
- **Title**: Razorpay Payment Gateway Set to Test Mode & Missing Webhook Verification URL
- **Severity**: HIGH
- **Priority**: HIGH
- **Affected Component**: Order / Payments Module
- **Location/File**: [server/.env](file:///c:/Users/ADITYA/Desktop/quickbihar.in/server/.env#L23-L26) & [razorpay.util.ts](file:///c:/Users/ADITYA/Desktop/quickbihar.in/server/src/utils/razorpay.util.ts)
- **How to Reproduce**: Initiate checkout with online payment.
- **Expected Behavior**: Processing real transactions with live webhook confirmation.
- **Actual Behavior**: Uses `rzp_test_Rolp6xUYbnEHlp` and test webhook secret `secret`.
- **Root Cause**: Live Razorpay Merchant account credentials not attached.
- **Impact**: Cannot process real customer money transactions.
- **Recommended Fix**: Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to Live values.
- **Fix Status**: PENDING CONFIGURATION.

---

### Issue ID: BUG-HIGH-005
- **Title**: Unverified Resend Email Sender Address
- **Severity**: HIGH
- **Priority**: MEDIUM
- **Affected Component**: Mail Service
- **Location/File**: [mail.service.ts](file:///c:/Users/ADITYA/Desktop/quickbihar.in/server/src/utils/mail.service.ts#L10)
- **How to Reproduce**: Trigger email OTP or partner status notification.
- **Expected Behavior**: Sender email is `noreply@quickbihar.in`.
- **Actual Behavior**: Sender is `no-reply@edulaunch.shop` or `onboarding@resend.dev`.
- **Root Cause**: Third-party domain `edulaunch.shop` hardcoded in code.
- **Impact**: Email delivery failure, bouncing, or landing in user SPAM folder.
- **Recommended Fix**: Update Resend DNS records for `quickbihar.in` and set sender to `noreply@quickbihar.in`.
- **Fix Status**: PENDING CONFIGURATION.

---

### Issue ID: BUG-HIGH-006
- **Title**: Web & Mobile Environment Base API URLs Point to Localhost / LAN IPs
- **Severity**: HIGH
- **Priority**: HIGH
- **Affected Component**: Web Frontend & Mobile App Configuration
- **Location/File**: [web/.env](file:///c:/Users/ADITYA/Desktop/quickbihar.in/web/.env#L2) & [mobile/.env](file:///c:/Users/ADITYA/Desktop/quickbihar.in/mobile/.env#L1)
- **How to Reproduce**: Build mobile APK or deploy Web client without modifying `.env`.
- **Expected Behavior**: API URL points to `https://quickbihar.in/api/v1`.
- **Actual Behavior**: `web/.env` points to `http://localhost:8000/api/v1`, `mobile/.env` points to `http://10.248.217.27:8000`.
- **Root Cause**: Development environment configurations.
- **Impact**: Client applications fail to connect to server in production deployment.
- **Recommended Fix**: Update `NEXT_PUBLIC_API_URL` and `EXPO_PUBLIC_API_ORIGIN` to production domain URLs.
- **Fix Status**: PENDING CONFIGURATION.

---

## 🟡 MEDIUM SEVERITY ISSUES

### Issue ID: BUG-MED-007
- **Title**: Distance Calculation Uses Aerial Haversine Formula Instead of Road Matrix API
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Affected Component**: Store Delivery Radius & Geo Utility
- **Location/File**: [geo.util.ts](file:///c:/Users/ADITYA/Desktop/quickbihar.in/server/src/utils/geo.util.ts)
- **How to Reproduce**: Place order where store and customer are separated by river/flyover.
- **Expected Behavior**: Real road navigation distance calculation.
- **Actual Behavior**: Straight-line mathematical distance formula.
- **Impact**: Inaccurate delivery fee calculation and rider distance estimation.
- **Recommended Fix**: Integrate Google Maps Distance Matrix API.
- **Fix Status**: FUTURE ENHANCEMENT.

---

### Issue ID: BUG-MED-008
- **Title**: Automated Unit Test Suite Failures (23 Failing Tests)
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Affected Component**: Server Test Suite (`bun test`)
- **Location/File**: `server/src/_tests_/` (`store.test.ts`, `onboarding.test.ts`, etc.)
- **How to Reproduce**: Run `bun test` in `server`.
- **Expected Behavior**: All 63 tests pass.
- **Actual Behavior**: 40 tests pass, 23 fail due to 403 Forbidden role middleware assertions.
- **Root Cause**: Tests mock unauthenticated user tokens for endpoints now requiring seller/admin RBAC roles.
- **Recommended Fix**: Update test helper mocks with valid RBAC role tokens.
- **Fix Status**: PENDING MAINTENANCE.
