# QuickBihar.in — Developer Documentation (Hinglish)

> **Created:** 2026-08-01
> **Maintainer:** Engineering Team
> **Audience:** Naye developers, senior engineers, aur koi bhi jo is codebase ko samajhna chahta hai.
> **Language style:** Hinglish (easy Hindi + English mix) — jaise ek senior engineer doosre developer ko samjhaata hai.

---

## Yeh docs kya hai? (WHAT)

Yeh `quickbihar.in` monorepo ki **complete reverse-engineered documentation** hai. Poore codebase ko file-by-file, folder-by-folder, flow-by-flow padh kar likha gaya hai. Har cheez **code se verify** ki gayi hai — koi bhi cheez assume ya hallucinate nahi ki gayi. Jahan kuch unclear tha, wahan clearly likha gaya hai ki "yeh flow unclear hai kyunki...".

QuickBihar ek **hyperlocal multi-vertical commerce platform** hai (abhi `clothing` vertical live hai; `food` aur `jewelery` scaffold/placeholder hain). Isme 3 alag-alag apps hain:

| App | Tech | Kaam |
|-----|------|------|
| `server/` | Bun + Express 5 + Mongoose 9 + TypeScript | Poore system ka brain — API, DB, realtime, queues, payments |
| `web/` | Next.js 16 + React 19 + Tailwind 4 | Admin / Seller / Delivery portals (dashboard) |
| `mobile/` | Expo SDK 56 + React Native 0.85 + expo-router | Customer + Rider + Admin ka mobile app |

---

## Documentation kaise padhein? (HOW TO READ)

Agar aap **bilkul naye** ho is project mein, toh is order mein padho:

```
00 → 01 → 02   (Overview + Structure + Architecture — bada picture)
       ↓
24 → 21 → 23   (Developer Guide + Codebase Map + Request Lifecycle — practical)
       ↓
08 → 09        (Auth + RBAC — security foundation)
       ↓
10 → 11 → 12   (Product → Order → Payment — core business)
       ↓
baaki docs jaise-jaise zaroorat pade
```

Agar aap **experienced** ho aur specific cheez dhoondh rahe ho, toh neeche index se seedha jump karo.

---

## Poora Index (33 documents)

### 🏛️ Foundation (System ko samajhna)
| # | File | Kya milega |
|---|------|-----------|
| — | [README.md](./README.md) | Yeh file — index + reading guide |
| 00 | [00_Project_Overview.md](./00_Project_Overview.md) | Project kya hai, kaun use karta hai, business model |
| 01 | [01_Folder_Structure.md](./01_Folder_Structure.md) | Har folder ka matlab, kya safe hai edit karna, kya nahi |
| 02 | [02_System_Architecture.md](./02_System_Architecture.md) | 3 apps kaise baat karte hain, high-level diagram |

### 💻 Apps (Code layers)
| # | File | Kya milega |
|---|------|-----------|
| 03 | [03_Frontend.md](./03_Frontend.md) | Web (Next.js) portals ka andar ka kaam |
| 04 | [04_Backend.md](./04_Backend.md) | Server (Express) ka structure, layers, conventions |
| 05 | [05_Mobile_App.md](./05_Mobile_App.md) | Mobile (Expo) app ka structure, navigation, modules |
| 06 | [06_API_Flow.md](./06_API_Flow.md) | Ek API request start se end tak kaise chalti hai |
| 07 | [07_Database.md](./07_Database.md) | Saari MongoDB collections, fields, indexes, relations |

### 🔐 Security
| # | File | Kya milega |
|---|------|-----------|
| 08 | [08_Authentication.md](./08_Authentication.md) | Login, JWT, OTP, refresh token, cookies |
| 09 | [09_Authorization_RBAC.md](./09_Authorization_RBAC.md) | Roles, permissions, middleware gating |

### 🛒 Core Business Systems
| # | File | Kya milega |
|---|------|-----------|
| 10 | [10_Product_System.md](./10_Product_System.md) | Product model, variants, stock, approval |
| 11 | [11_Order_System.md](./11_Order_System.md) | Order → SubOrder split, pricing, fulfillment |
| 12 | [12_Payment_System.md](./12_Payment_System.md) | Razorpay, COD, signature verify, refund |
| 13 | [13_File_Uploads.md](./13_File_Uploads.md) | ImageKit + multer image upload |
| 14 | [14_Notifications.md](./14_Notifications.md) | Push (FCM/Expo), BullMQ worker, socket, outbox |
| 15 | [15_Caching.md](./15_Caching.md) | Redis, in-memory caches, kaha use hota hai |

### ⚙️ Operations
| # | File | Kya milega |
|---|------|-----------|
| 16 | [16_Environment.md](./16_Environment.md) | Saari env variables, Zod validation |
| 17 | [17_Deployment.md](./17_Deployment.md) | Docker, nginx, CI/CD, VPS |
| 18 | [18_Error_Handling.md](./18_Error_Handling.md) | ApiError, ApiResponse, asyncHandler, global handler |
| 19 | [19_Security.md](./19_Security.md) | Security posture, kya theek hai, kya risk hai |
| 20 | [20_Performance.md](./20_Performance.md) | Bottlenecks, indexes, N+1, optimization ideas |

### 🗺️ Knowledge Base (Cross-referenced)
| # | File | Kya milega |
|---|------|-----------|
| 21 | [21_Codebase_Map.md](./21_Codebase_Map.md) | Har important file ka one-line map |
| 22 | [22_Dependency_Graph.md](./22_Dependency_Graph.md) | Module kaun kisko import karta hai |
| 23 | [23_Request_Lifecycle.md](./23_Request_Lifecycle.md) | HTTP + Socket request ka poora lifecycle |

### 🧑‍💻 New Developer Guide (How-To)
| # | File | Kya milega |
|---|------|-----------|
| 24 | [24_Developer_Guide.md](./24_Developer_Guide.md) | Setup, local run, conventions, first day guide |
| 25 | [25_Add_New_Feature.md](./25_Add_New_Feature.md) | Naya feature kaise add karein (step-by-step) |
| 26 | [26_Add_New_API.md](./26_Add_New_API.md) | Nayi API endpoint kaise banayein |
| 27 | [27_Add_New_Module.md](./27_Add_New_Module.md) | Naya backend module kaise banayein |
| 28 | [28_Add_New_Business_Type.md](./28_Add_New_Business_Type.md) | Naya vertical (jaise food) kaise add karein |

### 🧹 Health & Roadmap
| # | File | Kya milega |
|---|------|-----------|
| 29 | [29_Common_Mistakes.md](./29_Common_Mistakes.md) | Galtiyan jo log karte hain, kaise bachein |
| 30 | [30_Tech_Debt.md](./30_Tech_Debt.md) | Code mein jo udhaar (debt) pada hai |
| 31 | [31_Production_Readiness.md](./31_Production_Readiness.md) | Production ke liye kitna tayaar hai |
| 32 | [32_TODO.md](./32_TODO.md) | Aage kya karna baaki hai |

---

## Golden Rules (har developer padhe)

1. **Code hi truth hai.** Yeh docs helpful hai, par jab confusion ho toh code padho. Docs ko update karo agar code badle.
2. **`common` vs `clothing` seam.** `server/src/modules/common/*` vertical-agnostic hai (sab verticals share karte hain). `server/src/modules/clothing/*` sirf clothing ke liye hai. Naya vertical add karte time yeh distinction sabse important hai. Dekho [28_Add_New_Business_Type.md](./28_Add_New_Business_Type.md).
3. **Database = source of truth for realtime.** Socket.IO sirf "notification" hai. Asli data hamesha DB (FulfillmentEvent + NotificationOutbox) mein likha jaata hai pehle. Dekho [14_Notifications.md](./14_Notifications.md).
4. **Money ko paise mein socho.** Razorpay paise (₹1 = 100) mein kaam karta hai. Rounding bugs se bachne ke liye pricing engine `roundMoney` use karta hai. Dekho [12_Payment_System.md](./12_Payment_System.md).
5. **Stock pehle secure, phir confirm.** Order kabhi bhi CONFIRMED nahi hota jab tak stock atomically deduct na ho jaaye (M1 fix). Dekho [11_Order_System.md](./11_Order_System.md).

---

## Verification note (IMPORTANT)

Yeh saari docs **actual code padh kar** likhi gayi hain (August 2026 tak ka codebase). Jahan bhi koi behaviour code se 100% clear nahi tha, wahan maine explicitly likha hai:

> ⚠️ *"Maine code analyze kiya par yeh flow unclear hai kyunki..."*

Aise notes ko seriously lo — woh jagah hai jaha aapko khud code verify karna chahiye ya team se poochna chahiye.

---

*Yeh documentation set `quickbihar.in` codebase ke deep reverse-engineering se banaya gaya hai. Creation date: 2026-08-01.*
