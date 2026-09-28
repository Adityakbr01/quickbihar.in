# Expo → Pure Vite React Migration — Research Report

> Date: 2026-09-28 | Scope: `user-web` (Vite + React 19 web app)
> Sawal: kya expo ke bache hue naam bina issue + bina naya package hataye ja sakte hain?
>
> **STATUS (end of day): Phases 0–4 + location/photo DONE. Bacha: `react-native` core UI (Phase 6, optional) + `expo-notifications` (push = backend decision). Naya npm package kuch nahi laga.**

## 0. TL;DR (short answer)

**Haan, technically possible hai — lekin "without any issue" NAHI.** 3 cheezein samajh lo:

1. **`package.json` me expo hai hi nahi** (sirf `EXPO_PUBLIC_*` env naam bache hain). Hatana matlab npm uninstall NAHI — matlab `src/` ke ~200 files me import names + `src/shims/*` + aliases badalna.
2. **Easy part (humne 3 kar liye) leaf utilities the.** Bacha hua sabse bada hissa — `react-native` core (171 files: View/Text/StyleSheet/Pressable/FlatList) — **poori UI rewrite hai**, hafto ka kaam, visual regression risk ke saath.
3. **Sabse bada issue:** 4 features web par abhi **nakli (stubbed)** chal rahe hain — location (hardcoded Patna!), photo upload (hamesha cancel), push notifications (no-op), Lottie (invisible). Expo naam hatate waqt ye "kaam karne lagenge" nahi — inhe **sach me banana padega** (browser APIs se, naya package nahi chahiye).

Naya npm package **kisi cheez ke liye zaroori nahi** — browser APIs + pehle se installed deps (embla, vaul, lucide, tailwind, react-router, tanstack persisters) sab cover kar lete hain. Sirf **push notifications** me backend kaam hai (service worker + VAPID keys + server changes), wo npm ka sawal nahi, architecture ka hai.

---

## 1. Pehli sachchai: kya-kya "expo" actually hai?

| Cheez | Haqeeqat |
|---|---|
| `package.json` me `expo-*` packages | **0 (koi nahi)** |
| `package.json` me `react-native*` packages | **0** (sirf `@types/react-native` dev me) |
| Asli me installed jo shims ke liye tha | `react-icons` (humne hata diya), baaki shims sirf `react`, `vaul`, `embla` use karte hain |
| "Expo dependencies" ka matlab | Sirf **import names** (`from "expo-x"`) jo `vite.config.ts` alias se `src/shims/*.web.*` par point karte hain |

Matlab migration = **codemod + chhote local helpers**, npm install/uninstall ka khel nahi (2 dead real deps neeche §7 me hain, wo alag baat).

---

## 2. Full inventory (bacha hua sab kuch)

Files gine gaye `src/` me (shims excluded). "Web par kaam?" = aaj shim ke saath actual behavior.

### Group A — Dead (0 usage, aaj hi delete ho sakta hai)

| Package | Files | Note |
|---|---|---|
| `expo-linking` | 0 | Shim + alias bana hai, koi import nahi |
| `expo-splash-screen` | 0 | Same |
| `expo-status-bar` | 0 | Same |
| `expo` (core) | 0 | Sirf `reloadAppAsync` tha, koi use nahi |
| `react-native-svg` | 0 | Shim hai (37 lines, native SVG wrappers), koi import nahi |

**Effort:** 30 min (5 shims + 6 alias/mapping lines delete, typecheck). **Risk:** zero.

### Group B — Trivial (browser API / CSS one-liner, koi naya package nahi)

| Package | Files | Aaj ka shim | Hatane par kya likhna hai |
|---|---|---|---|
| `expo-secure-store` | 1 (`lib/authStorage.ts`) | localStorage wrapper | Seedha `localStorage` (authStorage me already fallback hai) |
| `@react-native-async-storage` | 2 (`authStorage.ts`, `ThemeProvider.tsx`) | localStorage wrapper | Seedha `localStorage` |
| `expo-constants` | 4 | Static object (name/version/env) | `src/lib/appConfig.ts` jaisa chhota module (env se) |
| `expo-device` | 1 | Static strings (`brand: 'Web'`) | 5-line constants module ya inline |
| `expo-web-browser` | 2 | `window.open(url, '_blank')` | Seedha `window.open` |
| `expo-blur` | 1 (`IOSAlertDialog.tsx`) | CSS `backdrop-filter` div | CSS class / inline style |
| `react-native-webview` | 2 (`LivingPixelOcean.tsx`, `LeafletMapComponent.tsx`) | `<iframe>` | Seedha `<iframe>` |
| `expo-modules-core` | 1 (`MoreDealsSection.tsx`) | `{}` stub | Import hi hatao (check karo kya use hota hai — likely sirf type/import) |
| `@tanstack/query-async-storage-persister` | 1 (`QueryProvider.tsx`) | localStorage JSON persister (48 lines, khud likha hua) | **`@tanstack/query-sync-storage-persister` — pehle se installed hai**, wahi use karo |

**Effort:** ~0.5–1 din. **Risk:** bahut low. **Naya package:** nahi.

### Group C — Stubbed / tooti features (naam hatana = feature banana padega)

Ye sabse important table hai. Web par ye features **aaj kaam hi nahi karte** — shim nakli jawab deta hai:

| Package | Files | Aaj ka (stub) behavior | Sach me chalane ke liye (bina naya package) |
|---|---|---|---|
| `expo-location` | 4 (address forms, rider tracking) | **Hardcoded Patna lat/long!** `getCurrentPositionAsync` hamesha `25.5941, 85.1376` deta hai | Browser **Geolocation API** (`navigator.geolocation`) + `watchPosition`. Permission flow khud likhna padega. ~1 din |
| `expo-image-picker` | 3 (avatar upload ×2, rider proof photo) | **Hamesha `{canceled: true}`** — photo upload web par impossible hai aaj | Hidden `<input type="file" accept="image/*">` + `URL.createObjectURL`. ~0.5 din |
| `expo-notifications` | 4 (push setup, listeners) | **Pure no-op** — token `''`, listener kuch nahi karte | **Web Push = backend kaam**: service worker + VAPID + server ko FCM/Expo-token ki jagah web-push subscription bhejna. Sirf frontend se nahi hoga. Sabse bada decision point |
| `lottie-react-native` | 1 (`LazyLottie.tsx`) | **`display: none`** — saare Lottie animations invisible! | `lottie-react` / `@lottiefiles/dotlottie-react` **pehle se installed hain, 0 files use karte** — bas LazyLottie ko unpar point karo. ~1–2 ghante |
| `@react-native-google-signin` | 1 (`googleSignInConfig.ts`) + stub | `signIn()` khokhla token deta hai | Web par **Google Identity Services script already use ho raha** (`GoogleSignInButton.web.tsx`) — config file ka matlab samajh ke ya to hatao ya web-client-ID wala path rakho. ~2–3 ghante |
| `react-native-razorpay` | 1 (sirf `.native.ts` file) | Web par use hi nahi hota — **web payment `checkout.js` se already chalta hai** | Alias/shim safety-net hai; `.native.ts` typecheck me hai (neeche §5 dekho). ~30 min |

**Effort:** location + picker + lottie + google + razorpay ≈ 2–3 din. **Push notifications alag project hai** (backend +تVAPID + UX for permission).

### Group D — Real kaam karte features (soch-samajh ke hatana)

| Package | Files | Kya use hota hai | Bina naya package option | Effort / Risk |
|---|---|---|---|---|
| `expo-image` | 17–20 | `contentFit`, caching props | Seedha `<img loading="lazy">` + `object-fit` (shim already yahi karta hai). Har file me prop rename (`contentFit`→`objectFit`, `source={{uri}}`→`src`) | ~1 din, low-medium (17+ files, visual check chahiye) |
| `expo-linear-gradient` | 6 | Onboarding/auth/mall gradients | CSS `linear-gradient` (shim already yahi banata hai) | ~0.5 din, low |
| `react-native-safe-area-context` | 20 | `useSafeAreaInsets()` (web par **hamesha 0**) | Chhota `useSafeAreaInsets()` hook (`env(safe-area-inset-*)` padhe) ya jahan 0 hi chahiye wahan hardcode. 20 files me import badlega | ~0.5 din, low |
| `@react-native-community/datetimepicker` | 1 (`RiderDateField.tsx`) | Native date input (`<input type="date">` shim) | Seedha `<input type="date">` | 1 ghanta, low |
| `@shopify/flash-list` | 5 | `FlashList` (= `FlatList` shim = plain div list, **koi virtualization nahi**) | Seedha map-render ya `@tanstack/react-virtual` (**pehle se installed, 0 use**) agar lambi lists hain | ~0.5 din, low |
| `react-native-reanimated-carousel` | 4 | Carousels (shim = **embla** already!) | `embla-carousel-react` **pehle se installed** — shim already usi par hai, bas import badlo | ~0.5 din, low-medium (4 carousels test karne padenge) |
| `@lodev09/react-native-true-sheet` | 3 (`BottomSheet/` system) | Bottom sheets (shim = **vaul** already!) | `vaul` **pehle se installed** — apna `Sheet.tsx` already usi par khada hai | ~0.5 din, low-medium |
| `react-native-gesture-handler` | 1 (`SnapchatPullToRefresh.tsx`) | Pull-to-refresh gesture (shim = **no-op passthrough** — gesture web par kaam nahi karta!) | Pointer Events (`onPointerDown/Move/Up`) se khud likho, ya refresh button UX. Feature gap hai | ~0.5–1 din, medium |
| `react-native-reanimated` | 21 | `useSharedValue`, `withTiming/Spring`, `FadeInDown`, `interpolate` — **shim me animations instant/fake hain** (withTiming turant final value) | CSS transitions/animations + thoda state refactor. **Onboarding (AnimatedIcons ~100+ calls), AnimatedBurger, SnapchatPullToRefresh, ScrollContext** dhyaan se | ~2–3 din, medium (animation feel badlegi, test karna padega) |
| `react-native` (core) | **171** | **Poori UI**: View/Text/Pressable/StyleSheet/FlatList/TextInput/Modal/Alert/Share/Dimensions/Keyboard/Animated... | **Yahi asli migration hai** — neeche §3 dekho | **1–3 hafte, HIGH RISK** |

---

## 3. Asli sawaal: `react-native` core (171 files)

Ye "dependency hatana" nahi, **UI framework badalna** hai. Har screen `View/Text/StyleSheet/Pressable/FlatList` me likhi hai. Pure DOM me le jane ka matlab:

- `View` → `div`, `Text` → `span/p`, `Pressable/TouchableOpacity` → `button`, `TextInput` → `input`, `ScrollView/FlatList` → div + scroll, `StyleSheet.create` → CSS/Tailwind (project me **Tailwind v4 already** hai), `Modal` → dialog, `Alert` → custom dialog (apna `IOSAlertDialog` hai!), `Share` → `navigator.share`, `Dimensions` → `window.innerWidth`, `Keyboard` → focus/blur events, `BackHandler` → `popstate`, `ActivityIndicator` → CSS spinner.
- Har file me **style objects ka semantics badlega** (RN flex defaults vs CSS — `flex: 1`, `gap`, padding scale same nahi dikhenge 1:1).
- **171 files, ~500+ components** — mechanical codemod se 80% hoga, baaki 20% haath se + **har screen visual QA**.

**Bina issue? Nahi.** Visual regressions pakke hain (spacing, fonts, touch feedback, scroll behavior). Isiliye duniya me is kaam ko "rewrite" kehte hain, "cleanup" nahi.

**Alternate beech ka rasta (recommendation):** `src/shims/react-native.web.tsx` (922 lines, apna code, zero expo package) **rakho** — ye koi dependency nahi hai, tumhara apna compatibility layer hai. Bundle me expo ka 1 byte nahi aata. Naam me "react-native" hai bas. Agar naam se problem hai to file ka naam badal do (`ui-primitives.tsx`), imports codemod kar do — 1 din, zero risk, same result optics me.

---

## 4. Kya bina naya package ke ho jayega? (package-by-package jawab)

**Haan — ek exception ke saath:**

| Zaroorat | Naya package? |
|---|---|
| Storage, env/config, device info, window.open, blur/gradient (CSS), iframe, date input, file input, geolocation, SVG, safe-area hook | **Nahi** — browser APIs + CSS kaafi |
| Carousel, bottom-sheet, virtualized list, query persist, icons, haptics, navigation | **Nahi** — embla, vaul, react-virtual, sync-storage-persister, lucide, web-haptics, react-router **sab pehle se installed** hain |
| Lottie | **Nahi** — lottie-react/dotlottie **pehle se installed, unused** pade hain |
| Google login (web) | **Nahi** — GIS script already use ho raha hai |
| Razorpay (web) | **Nahi** — checkout.js already use ho raha hai |
| **Push notifications** | **Npm ka sawal nahi — backend ka hai** (service worker + VAPID + server-side subscription storage/sending). Frontend package se solve nahi hoga |

---

## 5. Teen traps (hatate waqt dhyaan rakhna)

1. **`.native.ts` files typecheck me hain.** `openRazorpayCheckout.native.ts` (`react-native-razorpay` import) `tsconfig.include: ["src"]` me aata hai. Alias hatane se pehle ya to `exclude` me `**/*.native.*` daalo, ya wo file sambhalo. (Aaj yehi wajah se web build me razorpay shim ka alias jeenda hai.)
2. **`expo-app-reference/` untouched rakho** — native app ka source of truth; usme expo names rehne do (build/typecheck me included nahi hai).
3. **Stubbed features "hatane" se chalenge nahi** — location-picker-notifications-lottie (§2 Group C) pehle decide karo: implement karna hai ya feature hatana hai. Naam badalne se behavior nahi badlega.

---

## 6. Execution log (sab done, typecheck + build green)

| Phase | Kya kiya | Notes |
|---|---|---|
| **0** | 5 dead shims + aliases delete; `expo` core ke 2 `reloadAppAsync` → `window.location.reload()` | Zero risk |
| **1** | secure-store/async-storage → localStorage (`authStorage`, ThemeProvider, module store, CartContext); constants/device → hatao (`appConfig` nahi banana pada — guards `Platform.OS === "web"` ho gaye); web-browser → `window.open`; blur → CSS backdrop-filter; webview → `<iframe>` (**Leaflet map fix bhi ho gaya** — shim `source.html` ignore karta tha); modules-core import delete; query-persister → installed `query-sync-storage-persister` | Leaflet map pehle blank tha, ab render hoga |
| **2** | **Lottie ON** (`LazyLottie` → `lottie-react` v3 `src` API — animations ab dikhengi); google-signin config → web no-op module; `**/*.native.*` tsconfig exclude; `react-icons` package removed | `framer-motion` abhi bhi unused pada hai |
| **3** | expo-image (17 files) → `<img>` + `Object.assign` styles (`{...x}` JSX parse quirk se bachne ke liye); gradients → naya `Gradient` component; safe-area → real `env()`-based `useSafeAreaInsets`; datetimepicker → `<input type="date">`; flash-list → RN `FlatList` | Safe-area ab real notch values dega (pehle hamesha 0) |
| **4** | Carousel → `EmblaCarousel` relocate; BottomSheet → `TrueSheetWeb` relocate (vaul); pull-to-refresh → Pointer Events rewrite (**pehle web par kaam hi nahi karta tha**); reanimated → CSS transitions/keyframes (`index.css` me 13 keyframes; Onboarding choreography, burger, toggle, skeleton, dashes sab tez) | Onboarding animations pehle frozen theen, ab chalengi |
| **5** | Location → real Geolocation API (`src/lib/location.ts`); photo upload → real file input (`src/lib/photoPicker.ts` + FormData File fix — avatar/proof upload ab sach me kaam karega) | Neeche push decision dekho |
| **6 (optional)** | `react-native` core → DOM rewrite (171 files) — **NOT DONE** (1–3 hafte, high risk). `src/shims/react-native.web.tsx` rakha hai (apna code, zero expo package) | Sirf tab karna jab TWA/policy reason ho |

### Push notifications — DECISION (backend chahiye, isliye pending)

Web Push Expo push jaisa nahi hai. Chahiye: (1) service worker (`public/sw.js`) + `pushManager.subscribe` UI flow, (2) backend: VAPID keys generate karna, subscription store karna (naya table/collection), order/rider events par web-push bhejna, (3) Expo-token pipeline se alag rakhna (native app untouched rahe). **Sirf frontend package se solve nahi hoga** — jab backend ready ho tab `src/lib/notification.ts` + `usePushNotifications.ts` me implement karna (dono files ab expo-free hain, taiyaar hain). Tab tak no-op behavior same hai.

---

## 7. Appendix: `package.json` me suspected dead real deps (alag audit layak)

`rg` me 0 direct imports mile (dynamic/CSS imports verify karke hi hatana!):

- `framer-motion`, `lottie-react`, `@lottiefiles/dotlottie-react`, `@react-oauth/google`, `@tanstack/react-query-devtools`, `@tanstack/react-virtual` (Phase 3 me kaam aayega — mat hatana), `react-day-picker`, `cmdk`, `input-otp`, `sonner`, `leaflet` (LeafletMapComponent check karo — dynamic import ho sakta hai)

> Inhe hatane se pehle `await import(...)`, `.css` imports aur `index.html` script tags check kar lena — ye report us depth tak nahi gayi.
