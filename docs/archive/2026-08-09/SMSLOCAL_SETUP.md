# 📱 SMSLocal OTP Integration Manual (Beginner-Friendly Guide)

> **Who is this guide for?**  
> This guide is written for anyone with **zero technical knowledge about SMS APIs**. It explains step-by-step how Mobile OTP works, how to get credentials from SMSLocal, how to set environment variables, and how to test SMS delivery on a real physical mobile phone.

---

## 📖 1. Key Concepts Explained Simply

### 📱 What is SMSLocal?
SMSLocal is a bulk SMS service provider in India. When a customer or rider enters their mobile phone number into the QuickBihar app to sign up or log in, QuickBihar uses SMSLocal to send a 6-digit verification code (OTP) via text message to their physical mobile phone.

### 🔑 What is an API Key (`SMSLOCAL_API_KEY`)?
An API Key is like a secret password for your SMSLocal account. It proves to SMSLocal that the request is coming from your QuickBihar application server and allows SMSLocal to deduct SMS credits from your account.

### 🏷️ What is a Sender ID (`SMSLOCAL_SENDER_ID`)?
A Sender ID is the 6-character header name that appears on the receiver's phone when they receive an SMS (for example, `QKBIHR` or `SMSLCL`). In India, TRAI (Telecom Regulatory Authority) requires Sender IDs to be registered on a DLT portal.

### 📄 What is a DLT Template ID (`SMSLOCAL_TEMPLATE_ID`)?
Under Indian telecom rules (DLT - Distributed Ledger Technology), every SMS message text must match an approved template. When you register an OTP message template on your DLT portal (e.g., `"Your QuickBihar verification code is {#var#}. Valid for 10 minutes."`), telecom operators assign a unique **DLT Template ID** (a long number like `1707161234567890123`).

### 🛣️ What is OTP Route (`SMSLOCAL_ROUTE=2`)?
SMSLocal provides 3 message routes:
- **Route 1**: Transactional messages (order updates, shipping alerts)
- **Route 2**: **OTP messages (High priority, 24/7 delivery)**
- **Route 3**: Promotional messages (offers, discounts)

> ⚠️ **Important**: For OTP verification, you must always set `SMSLOCAL_ROUTE=2`. Promotional routes are blocked at night and cannot deliver OTPs.

---

## 🛠️ 2. Step-by-Step Environment Setup

### Step 1: Open your server `.env` file
Open `./server/.env` in your code editor or text editor.

### Step 2: Add your SMSLocal Credentials
Add the following lines at the bottom of `./server/.env`:

```env
# SMS CONFIGURATION
SMS_PROVIDER=smslocal
SMSLOCAL_API_KEY=your_actual_smslocal_api_key_here
SMSLOCAL_SENDER_ID=your_approved_6_char_sender_id
SMSLOCAL_TEMPLATE_ID=your_dlt_template_id_here
SMSLOCAL_ROUTE=2
```

> 🔒 **Security Warning**:  
> Never commit your `.env` file or API Key to GitHub! `.env` is listed in `.gitignore` to protect your secrets.

---

## 📱 3. Real Physical Phone Testing Procedure

Follow these simple steps to test real SMS delivery:

```text
Step 1: Save environment variables in ./server/.env
            ↓
Step 2: Start the Backend Server:
        cd server
        bun run dev
            ↓
Step 3: Open Mobile App or Storefront Web Page
            ↓
Step 4: Enter your real 10-digit mobile number (+91 98XXXXXX10)
            ↓
Step 5: Tap "Request OTP" / "Send Verification Code"
            ↓
Step 6: Check your physical mobile phone text messages
            ↓
Step 7: Verify real SMS received (Sender: QKBIHR, Body: "Your QuickBihar code is XXXXXX")
            ↓
Step 8: Enter the 6-digit OTP in the app screen
            ↓
Step 9: Tap "Verify & Continue" -> Confirm Login Success!
```

---

## 🚨 4. Troubleshooting Table (Error Codes Explained)

If an SMS is not delivered, inspect your backend terminal logs (`console.log`). SMSLocal returns standard numerical error codes:

| Error Code | Meaning | Cause | Action Required |
| :--- | :--- | :--- | :--- |
| **101** | Invalid User | `SMSLOCAL_API_KEY` is wrong or revoked. | Check and copy the exact API Key from SMSLocal Dashboard. |
| **102** | Invalid Sender | Sender ID not approved or mismatched. | Verify your 6-character Sender ID on SMSLocal/DLT portal. |
| **103** | Invalid Contact | Phone number is not a valid 10-digit number. | Check the phone number entered (must be 10 digits). |
| **104** | Invalid Route | Wrong route specified. | Ensure `SMSLOCAL_ROUTE=2` is set in `.env`. |
| **105** | Invalid Message | Message text doesn't match DLT template. | Ensure message text matches registered DLT template format. |
| **106** | Spam Blocked | Message content triggered spam filter. | Update DLT message template text. |
| **108** | Low Credits | Insufficient SMS credits in OTP route. | Recharge OTP SMS credits on your SMSLocal account balance. |
| **110** | Invalid DLT Template | `SMSLOCAL_TEMPLATE_ID` is missing or invalid. | Enter the approved DLT Template ID from your DLT portal. |
| **111** | No SMSC | Telecom operator connection issue. | Temporary operator network delay; retry after 1-2 minutes. |

---

## 🔄 5. How to Replace SMSLocal with Another Provider in the Future

The QuickBihar codebase uses a **Generic Modular Provider Architecture**:

```text
Application Logic
       ↓
Authentication Service (auth.service.ts)
       ↓
Generic SMS Service (SmsService)
       ↓
SMS Provider Adapter (ISmsProvider Interface)
       ↓
┌──────────────────────┬──────────────────────┬──────────────────────┐
│  SmsLocalProvider    │    TwilioProvider    │    Msg91Provider     │
│   (Current Active)   │   (Future Option)    │   (Future Option)    │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### Why this design is great for you:
If you want to switch from **SMSLocal** to **Twilio** or **MSG91** in the future:
1. You **do NOT need to rewrite** your authentication system (`auth.service.ts`).
2. You only need to create a new provider adapter file (e.g., `server/src/services/sms/twilio.provider.ts`) implementing `ISmsProvider`.
3. Change `SMS_PROVIDER=twilio` in `.env`.

Everything else in the application will continue working automatically!
