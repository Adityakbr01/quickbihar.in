# Mobile Heavy Packages + Jewelry Catalog Readiness Audit — 19 Sep 2026

> Scope: `mobile/` + `server/` — scratch se full recheck karke likha gaya.
> Date: 19 Sep 2026. Method: `package.json` + `node_modules` disk size (lstat, symlink skip) + `grep` usage + screen-by-screen code read.

## 1. Heavy packages (mobile) — verified

Disk size `mobile/node_modules` se (19 Sep 2026 recheck):

| Rank | Package @ version | Disk size | Kaha use ho raha | Rakhe ya hataye |
|---|---|---|---|---|
| 1 | `react-native-svg@15.15.4` | 34.78 MB | icons, `google-icon-logo.svg`, avatar | Keep, par 3 icon system mat chalao: `@expo/vector-icons` + `@hugeicons/*` + `sweet-sfsymbols` me se 1-2 hatao |
| 2 | `react-native-webview@13.16.1` | 10.35 MB | sirf `LivingPixelOcean.tsx`, `LeafletMapComponent.tsx` — Jewelery me zero use | Sabse bada bekar bojh. Chromium engine poori APK me judta hai. Map must hai tabhi rakho, nahi to hatao |
| 3 | `expo-video@56.1.2` | 9.51 MB | `app.json` plugin me hai, Jewelery + `src` me koi import nahi | Dead weight. Plugin + dep dono hatao, ~8-12 MB APK bachega |
| 4 | `lottie-react-native@7.3.6` | 6.60 MB | clothing, cart, toast, splash | Keep 1 hi. Niche wali duplicate hatao |
| 5 | `@lottiefiles/dotlottie-react` | ~1.03 MB (pichli check) | Jewelery me zero use, kahin real use nahi mila | Hatao — do lottie runtime kyu? |
| 6 | `@react-native-google-signin/google-signin@15` | ~7.28 MB (pichli check) | `GoogleSignInButton` via global auth, Jewelery AuthContext usi ko bridge karta hai | Keep — justified hai |
| 7 | `expo-location@56.0.16` | 2.89 MB | Delivery / store flow | Keep, par Jewelery flavor me optional karo |
| 8 | `socket.io-client@4.7.5` | 1.41 MB (+ engine.io/parser ~3 MB total JS) | `useSocketStore.ts`, `lib/socket.ts` — hamesha live connection | Jewelery ko realtime nahi chahiye. Lazy connect karo |
| 9 | `react-native-reanimated-carousel` + `pager-view` + `reanimated` + `worklets` | 1.68 MB + native heavy | clothing `TopHomeCarousel`, `ProductDetailScreen` — Jewelery `HeroCarousel` custom FlatList hai | Clothing ke liye keep, Jewelery me mat lao |
| 10 | `@shopify/flash-list@2.0.2` | ~1.09 MB | clothing search, notifications, category | Keep — performance ke liye sahi hai |
| 11 | `expo-image-picker`, `expo-notifications`, `expo-speech-recognition` | 0.4-1.5 MB each + permission cost | profile, rider, voice search | Keep par permission audit karo |

Top 3 turant action:
1. `expo-video` hatao.
2. `@lottiefiles/dotlottie-react` hatao.
3. `react-native-webview` audit karo — ye teeno ~25-30 MB APK bada rahe jo Jewelery flow me kaam ke nahi.

Note: `react-native-reanimated` / `gesture-handler` ka size script me galat (GB me) aaya tha symlink counting se — is doc me usko rank nahi diya kyuki wo core hai, hatana nahi hai.

## 2. Jewelry catalog readiness — section wise

Final: ~32-35% ready. Live karne layak nahi.

### 2.1 Routes + Screens (90%)
- `mobile/app/jewelery/`: `index.tsx`, `(tabs)/index|cart|collections|wishlist|profile`, `collections.tsx`, `search.tsx`, `try-on.tsx`, `wishlist.tsx`, `account.tsx`, `product/[id].tsx`, `auth/*` — 20 files present (recheck 19 Sep 2026).
- `mobile/src/features/Jewelery/screens/`: `JeweleryHomeScreen`, `CollectionsScreen`, `SearchScreen`, `ProductDetailScreen`, `CartScreen`, `WishlistScreen`, `AccountScreen`, `TryOnScreen` — 8/8 present.
- Shell solid hai.

### 2.2 Catalog data + assets (5%)
- `data/products.ts:28`: `const img1: any = null` (x4). Comment: `Jewelery module inactive: product images removed`.
- `data/collections.ts`: 5 collections me `image: null`.
- `mobile/assets/images/`: `campaigns, default-avatar.svg, icons, og` hi hai — `jewelery/` folder exist nahi karta.
- `JeweleryHomeScreen.tsx:316`: `source={undefined}`.
- `JeweleryTryOnScreen.tsx`: `source={{uri: null}}` — blank/crash risk.
- Sirf 8 mock products. Real catalog 0%.

### 2.3 Backend integration (5-10%)
- Grep (19 Sep 2026): `Jewelery/` me `axiosInstance` sirf `AuthContext.tsx:22,107` me. Koi `jewelery.api.ts`, koi `useQuery`, koi `/api/v1/products|cart|orders` call nahi.
- `CartContext.tsx`: sirf `AsyncStorage jewelery_cart` local. Server `/api/v1/cart` se zero sync.
- Wishlist bhi sirf local.
- `hooks/useJewelerySearch.ts`: sirf local `products.filter`. Comment me khud likha: `replace with useInfiniteQuery once real API is ready`.
- `JeweleryCartScreen.tsx:33-41` `handleCheckout`: `clearCart() + Toast("Order placed!")` — koi order, koi Razorpay nahi. Live gaya to critical fake order bug.

### 2.4 Auth (90%)
- `Jewelery/context/AuthContext.tsx` global `useAuthStore` + `loginRequest/registerRequest/OTP` se connected hai — ye ek hi sahi integration hai.
- Bug: `resetPassword` fail hone par `registerRequest` call kar deta hai — fix karo.

### 2.5 Try-On (15%)
- `utils/tryOn.ts` types sahi, par `products.ts` me sab `modelUrl: "mock://..."`.
- Real camera/AR/WebView nahi, sirf static Image overlay.

### 2.6 Server (35%)
- Hai: `product.model.ts:84` `vertical enum CLOTHING/FOOD/JEWELERY`, `:107` `jeweleryDetails { metalType, purity, hallmark, gemstone, weightGrams }`, `product.validation.ts:20,60` same, `products.service.ts:91-94` `inferVertical` auto-detect, `seed.ts` jewelry migration, `app.ts` me `/api/v1/products` live.
- Nahi hai: koi dedicated `/jewelery` router/service nahi, wahi clothing router reuse. `jeweleryDetails` me BIS no, making-charge, stone-cert, gold-rate nahi. Sab optional. `essentialSeed.ts` me `jewelrystoreconfigs` ka naam hai par model nahi mila.

### Score math
- UI shell 25 x 90% = 22.5
- Data+assets 20 x 5% = 1.0
- Cart/Wishlist/Search/Checkout 25 x 5% = 1.25
- Auth 10 x 90% = 9.0
- Server 20 x 35% = 7.0
- Total ~40.7/100 → safe bolne ke liye ~32-35% ready.

## 3. Critical bugs (recheck me confirm)
1. Product images `null` + `source={undefined}` — UI blank.
2. Checkout fake — bina payment order success toast.
3. Search me debounce comment hai par code me nahi, API nahi.
4. `resetPassword` fallback me auto-register — security risk.
5. `mock://` try-on URLs production me dead.
6. Icon + lottie duplication se APK mota.

## 4. Integration ke liye baki kaam (order me)
1. Assets wapas lao (git history) ya ImageKit URL lagao, `null` hatao.
2. `src/features/Jewelery/api/jewelery.api.ts` banao: `GET /products?vertical=JEWELERY`, search, detail — react-query se. Mock imports hatao.
3. Cart/Wishlist ko `/api/v1/cart`, `/api/v1/wishlist` se sync karo.
4. Checkout me `/orders` + `react-native-razorpay` lagao. Iske bina live mat karo.
5. Server `jeweleryDetails` strict karo: `purity enum [14K,18K,22K]`, `hallmark required`, `weightGrams > 0`, BIS field add.
6. Try-On ya to hatao ya real WebView + real `.gltf` do.
7. `expo-video`, `dotlottie-react` hatao, `webview` audit karo.

## 5. Recheck log
- 19 Sep 2026: `ls mobile/assets/images/`, `ls app/jewelery/`, `grep axiosInstance|/api/v1|razorpay in Jewelery/`, `grep JEWELERY|jeweleryDetails in server products/*`, `node dirSize` re-run — sab upar reflect hai.

## 6. DONE — Icon cleanup (19 Sep 2026, same day)

Status: ✅ DONE. Section 1 ke "3 icon system" wale point ka fix complete.

Decision: **sirf `@expo/vector-icons` rakha** — Expo official/recommended, font-based (sabse halka, koi extra native lib nahi), 80+ files me already use tha, Jewelery 100% isi par hai.

Kya delete kiya (`mobile/package.json` + `bun install` se lockfile clean — 3 packages removed):
- `@hugeicons/core-free-icons` + `@hugeicons/react-native` (SVG-based, `react-native-svg` 34 MB kheenchta tha)
- `sweet-sfsymbols` (src me 0 usage — dead weight tha)
- `src/types/hugeicons-color.d.ts` shim (sirf hugeicons ke liye tha)

Kya rakha aur kyu:
- `react-native-svg` — ye icon system nahi, renderer hai; `google-icon-logo.svg` / `default-avatar.svg` assets ke liye chahiye.
- `expo-symbols` — Expo SDK ka halka Apple SF Symbols wrapper, `SocialButton.tsx` me use hai.

Kya banaya:
- `mobile/src/components/common/AppIcon.tsx` (new) — central wrapper: `<AppIcon name="home-outline" size={22} />`. Ionicons names type-safe (`AppIconName`).

Kya migrate kiya (18 files, HugeiconsIcon → AppIcon):
- `app/(tabs)/clothing/_layout.tsx` — tabs: home/search/cart/account + rider (`bicycle-outline`)
- clothing: `MallCard`, `FilterBottomSheet` (5 renders), `MoreDealsSection` + `lib/dealsConfig.ts` (CATEGORY/GENDER/FILTERS + keyword map, sab string names)
- account: `AccountMain` (Moon/Sun), `AccountHeader` (camera/pencil), `AccountOption` (dynamic + chevron), `EditProfileModal` (close), `lib/accountData.tsx` (8 options typed `AppIconName`)
- address: `AddressCard`, `AddressInput`, `AddressFormScreen`, `SavedAddressesScreen`, `LocationFetchButton`
- profile: `ProfileAvatar`, `ProfileDetailsView`, `ProfileInfoRow`

Notable mappings (closest Ionicons): Truck → `bicycle-outline`, Sandals → `walk-outline`, Hoodie → `snow-outline`, Kurta → `layers-outline`, Dress → `flower-outline`, MapPinCheck → `navigate-outline`, MapPinPlus → `add-circle-outline`.

Verify (19 Sep 2026):
- `tsc --noEmit` — clean, zero errors.
- Saare ~50 icon names installed Ionicons glyphmap se check — sab exist.
- `grep hugeicons|sweet-sfsymbols mobile/src mobile/app` — zero code refs.
- Baaki bacha kaam (Sec 4: jewelry assets, catalog API, checkout, `dotlottie` removal, webview audit) — abhi pending hai.

## 7. DONE — expo-video removal (19 Sep 2026, same day)

Status: ✅ DONE. Section 1 rank 3 + Sec 4 point 7 ka fix.

Verify pehle: `grep expo-video/VideoView/useVideoPlayer src app` — **zero code usage**. Sirf 2 jagah tha:
- `mobile/package.json`: `"expo-video": "~56.1.2"` — hataya
- `mobile/app.json` plugins: `"expo-video"` — hataya

Fir `bun install` — 1 package removed, lockfile clean. ExoPlayer/AVPlayer native lib ab APK me nahi judegi (~8-12 MB bachत).

Verify baad me: `grep expo-video` zero refs, `tsc --noEmit` clean.

Note: future me video chahiye ho to wapas add karna: `bun add expo-video` + plugin entry + `npx expo prebuild`. Tab tak dead weight rakhne ka koi matlab nahi tha.
