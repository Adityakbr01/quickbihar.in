# Expo Dependencies — `user-web` (Vite React App)

> Date: 2026-09-28 (updated: expo-haptics → web-haptics; expo-router → react-router-dom) | Source: `package.json` + `vite.config.ts` aliases + `rg` import counts in `src/`

## 0. Sabse important baat

**`package.json` me koi bhi `expo-*` package installed NAHI hai.** Ye pure Vite + React 19 web app hai.
Saare `expo-*` imports `vite.config.ts` ke `resolve.alias` se `src/shims/*.web.*` files par redirect hote hain.
Matlab web build par Expo native code chalता hi nahi — sirf web shim chalta hai.

```ts
// vite.config.ts — har expo import ka web shim
'expo-image-picker'  -> './src/shims/expo-image-picker.web.ts'
'expo-router'        -> './src/shims/expo-router.web.tsx'   // react-router-dom wrapper
'@expo/vector-icons' -> './src/shims/expo-vector-icons.web.tsx'
'expo-linear-gradient' -> './src/shims/expo-linear-gradient.web.tsx'
// ... total 16 expo aliases (neeche poori list)
// REMOVED: 'expo-haptics' — ab `web-haptics` package + `src/lib/haptics.ts` use hota hai (see §5)
// REMOVED: 'expo-router', 'expo-router/head' — ab `react-router-dom` direct use hota hai (see §6)
```

Agar kabhi is code ko real Expo native app me le jana ho, tabhi neeche wale packages `npm i` karne padenge. Web ke liye kuch install karne ki zaroorat nahi.

---

## 1. Priority-wise list (usage count = `src/` me static `from` + dynamic `import()`)

Counts me `src/shims/*` khud aur `vite.config.ts` excluded hain — sirf real feature code gina hai.

### P0 — Core (shim toota = app tooti)

| Priority | Package | Files | Kahan use | Web shim kya karta hai |
|----------|---------|-------|-----------|------------------------|
| P0-1 | `@expo/vector-icons` | **88 files** | Har screen/card/navbar — `Ionicons`, `MaterialIcons` etc. | lucide/inline SVG par map (shim: `expo-vector-icons.web.tsx`) |

> Ye hatao to app chalegi hi nahi.
>
> ~~`expo-haptics` (72 files)~~ — **REMOVED (2026-09-28)**. Ab `web-haptics` npm package + `src/lib/haptics.ts` wrapper use hota hai. Koi `expo-haptics` naam codebase me nahi bacha — details §5 me.
>
> ~~`expo-router` (59 files)~~ — **REMOVED (2026-09-28)**. Ab `react-router-dom` (`^7.18.4`, pehle se dependency) direct use hota hai + `src/utils/navigation.ts` helpers. Koi `expo-router` naam `src/`/config me nahi bacha — details §6 me.

### P1 — Feature-critical (koi flow adhura rahega)

| Priority | Package | Files | Kahan use | Note |
|----------|---------|-------|-----------|------|
| P1-1 | `expo-image` | 17 files | ProductCard, MallCard, Auth, Carousel, Navbar — product/catalog images | Web par `<img>` wrapper; native me caching/placeholder milta hai |
| P1-2 | `expo-constants` | 4 files | `usePushNotifications.ts`, `lib/notification.ts`, `googleSignInConfig.ts`, `GoogleSignInButton.web.tsx` — appOwnership, Google client IDs | Web shim env vars (`EXPO_PUBLIC_*` -> `VITE_*`) padhta hai |
| P1-3 | `expo-location` | 4 files | `AddressFormScreen.tsx` (clothing + jewelery), `riderMedia.ts`, `useLocationTracking.ts` — address autofill + order tracking | Web par browser Geolocation API |
| P1-4 | `expo-notifications` | 4 files (dynamic `import()` x5) | `riderMedia.ts` (local offer notify), `usePushNotifications.ts`, `SocketListenerProvider.tsx` — push/local notify | Web par **lazy import + stub**; desktop push kaam nahi karega |
| P1-5 | `expo-image-picker` | 3 files | `ProfileAvatar.tsx`, `AccountHeader.tsx`, `riderMedia.ts` (pickProofPhoto) — avatar + delivery proof photo | Web par `<input type=file>` |
| P1-6 | `expo-secure-store` | 1 file | `lib/authStorage.ts` — auth token storage | Web par `localStorage` fallback |
| P1-7 | `expo-device` | 1 file | `lib/notification.ts` — `Device.isDevice` check push se pehle | Web par hamesha `false`-ish |
| P1-8 | `expo-linear-gradient` | 6 files | `OnboardingScreen`, `auth.screen.tsx`, `MallCard`, `MallDetailScreen`, `MoreDealsHeader`, `AnimatedIcons` — onboarding/auth/mall gradients | Web par CSS gradient |
| P1-9 | `expo-blur` | 1 file | `components/ui/IOSAlertDialog.tsx` — iOS-style blur dialog | Web par CSS `backdrop-filter` |

### P2 — Single-use / cosmetic (aaram se replace ho jayega)

| Priority | Package | Files | Kahan use |
|----------|---------|-------|-----------|
| P2-1 | `expo-web-browser` | 2 (1 static + 1 dynamic) | `CarouselSlide.tsx` (promo link open), `usePushNotifications.ts` (OAuth session) — web par `window.open` |
| P2-2 | `expo` (core) | 2 files | `ErrorFallback.tsx` (clothing + jewelery) — sirf `reloadAppAsync` ke liye; web par `window.location.reload()` |
| P2-3 | `expo-router/head` | 1 file | `components/seo/SeoHead.tsx` — web `<head>`; shim `react-helmet-async` jaisa |
| P2-4 | `expo-symbols` | 1 file | `theme/components/SocialButton.tsx` — iOS SF Symbols; Android/web par vector-icons fallback |
| P2-5 | `expo-modules-core` | 1 file | `clothing/home/sections/MoreDealsSection.tsx` — sirf 1 import; check karo kahin galti se to nahi aaya, native core ke bina bhi chal sakta hai |

### P3 — Dead weight (alias + shim hai, par `src/` me ZERO real import)

| Package | Real usage | Action |
|---------|------------|--------|
| `expo-linking` | 0 files | Shim (`expo-linking.web.ts`) + alias bana hua hai par koi screen import nahi karti. Chaho to alias+shim delete kar sakte ho. |
| `expo-splash-screen` | 0 files | Same — native splash web par meaningless (`preventAutoHide/hideAsync` = no-op). Safe to remove. |
| `expo-status-bar` | 0 files | Same — web par `<StatusBar/>` null render karta hai. Safe to remove. |

---

## 2. Poori alias map (vite.config.ts se)

```
expo-image-picker, expo-modules-core,
@expo/vector-icons, expo-linear-gradient, expo-location,
expo-image, expo-linking, expo-secure-store, expo-constants, expo-device,
expo-notifications, expo-web-browser, expo-symbols, expo-blur,
expo-splash-screen, expo-status-bar, expo
(REMOVED: expo-haptics → `web-haptics` package + `src/lib/haptics.ts`, see §5)
(REMOVED: expo-router, expo-router/head → `react-router-dom` + `src/utils/navigation.ts`, see §6)
+ react-native family (alag se): react-native, reanimated, safe-area-context,
  svg, webview, gesture-handler, async-storage, flash-list, datetimepicker,
  reanimated-carousel, razorpay, true-sheet, lottie-react-native, google-signin
```

## 3. Native Expo app banani ho to kya install karna padega?

Priority order me (sab Expo SDK compatible version me):

```bash
# P0 — pehle ye
npx expo install @expo/vector-icons
# (web-haptics web-only hai — native me iski jagah expo-haptics lagega,
#  call sites `src/lib/haptics.ts` me hain isliye 1 file badalni padegi)
# (web navigation ab react-router-dom par hai — native app me wapas
#  expo-router lagega; `expo-app-reference/` me native code untouched rakha hai)

# P1 — phir ye
npx expo install expo-image expo-constants expo-location expo-notifications \
  expo-image-picker expo-secure-store expo-device expo-linear-gradient expo-blur

# P2 — zaroorat ho to
npx expo install expo-web-browser expo-symbols expo-linking expo-splash-screen \
  expo-status-bar
# expo-modules-core explicit install ki zaroorat nahi (SDK ke saath aata hai)
# `expo` core bhi SDK ke saath aata hai
```

## 4. Cleanup suggestions (web ke liye)

1. **P3 ke 3 alias + 3 shim files delete kar sakte ho** — koi import nahi tootega: `expo-linking`, `expo-splash-screen`, `expo-status-bar`.
2. **`expo-modules-core` ka 1 import** (`MoreDealsSection.tsx`) verify karo — agar sirf types ke liye hai to hata do.
3. **`expo` core ka import** (`ErrorFallback` x2) sirf reload ke liye hai — `window.location.reload()` direct use karke dependency khatm kar sakte ho.
4. Baaki P0/P1 shims mat chhedo — poora app unhi par khada hai.

---

## 5. Haptics migration (2026-09-28) — `expo-haptics` → `web-haptics`

Pehle `expo-haptics` naam ka koi package installed nahi tha — sirf alias + shim (`src/shims/expo-haptics.web.ts`) tha jo andar hi `web-haptics` ko wrap karta tha. Ab beech ka expo naam hata diya:

- **Package:** `web-haptics@0.0.6` (`bun i web-haptics` — `package.json` dependencies me hai).
- **Skill:** `lochie/web-haptics` (`skills-lock.json` me already present; `npx skills add` interactive prompt ke wajah se non-TTY me skip hua — kuch karne ki zaroorat nahi).
- **Wrapper:** `src/lib/haptics.ts` — `WebHaptics` singleton, same API (`ImpactFeedbackStyle`, `NotificationFeedbackType`, `impactAsync`, `notificationAsync`, `selectionAsync`). Saare presets (`light/medium/heavy/success/warning/error/selection`) web-haptics 0.0.6 me native supported hain.
- **Call sites:** 72 files me sirf import-source badla — `from "expo-haptics"` → `from "@/lib/haptics"`. Koi logic change nahi.
- **Deleted:** `src/shims/expo-haptics.web.ts`, `vite.config.ts` ka `expo-haptics` alias, `tsconfig.app.json` ka `expo-haptics` path mapping.
- **Verify:** `rg "expo-haptics" src vite.config.ts tsconfig.app.json` = zero hits; `bun run typecheck` clean; `bun run build` ✓.

Native Expo app me le jate waqt `src/lib/haptics.ts` ko `expo-haptics` par re-point karna — baaki 72 files ko chhede bina kaam ho jayega.

---

## 6. Router migration (2026-09-28) — `expo-router` → `react-router-dom`

Pehle `expo-router` naam ka koi package installed nahi tha — sirf 2 alias + 2 shim (`src/shims/expo-router.web.tsx`, `expo-router-head.web.tsx`) the jo `react-router-dom` ko wrap karte the. Ab beech ka expo naam hata diya — navigation seedha react-router par hai:

- **Package:** `react-router-dom@^7.18.4` (`package.json` me pehle se tha — kuch install nahi kiya).
- **Helpers (`src/utils/navigation.ts`, pure react-router, koi expo naam nahi):**
  - `toWebPath(href)` — string ya `{ pathname: "/product/[id]", params: { id } }` ko web path me badalta hai (`[id]` substitute, bache params → query string, `/(tabs)` groups strip).
  - `goTo(navigate, href)` — `router.push` ki jagah; `replaceTo(navigate, href)` — `router.replace` ki jagah.
  - `goBack(navigate, fallback = "/")` — stack khali ho to safe fallback route (purana `if canGoBack back else replace` pattern isi me collapse ho gaya).
  - `useRouteParams<T>()` — `useLocalSearchParams` ki jagah (path params + query params merged).
- **Call sites (59 files):** `useRouter()` → `useNavigate()`, `router` singleton → `useNavigate()`, `usePathname()` → `useLocation().pathname`, `Link href=` → `Link to=` (+ `toWebPath` jahan legacy path ho), `useFocusEffect(useCallback(...))` → `useEffect(..., [deps])`, `Head` → `Helmet` (`react-helmet-async`, `HelmetProvider` `App.tsx` root me add hua).
- **Deleted:** 2 shim files, `vite.config.ts` ke 2 alias, `tsconfig.app.json` ke 3 path mappings.
- **Verify:** `rg "expo-router" src vite.config.ts tsconfig.app.json` = zero hits (sirf 1 comment bacha tha, wo bhi fix); `bun run typecheck` clean; `bun run build` ✓; lint me koi naya warning nahi.
- **`expo-app-reference/` ko haath nahi lagaya** — wo native Expo app ka reference copy hai (38 files me `expo-router` hai), `tsconfig`/`vite` build me included nahi hai. Native code ka source of truth wahi rahega.
