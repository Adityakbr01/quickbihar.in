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

## 8. LIVE verification with admin + seller (19 Sep 2026, same day)

Status: ✅ DONE. Server local start karke real credentials se har flow check kiya (tokens/keys kahi save nahi kiye, `/tmp` cleanup done).

- Admin login (`admin@quickbihar.in`) → 200, role ADMIN ✅
- Seller login (`aditykbr01@gmail.com`) → 200, role SELLER, APPROVED + verified ✅
- `GET /products/public?vertical=JEWELERY` → 200 (empty — expected, koi product nahi tha) ✅
- `GET /products/trending?vertical=JEWELERY` → 200 ✅
- `seed:jewelry` chalaya → **8 JEWELERY categories live** (Jewellery + Necklace/Ring/Earrings/Bangle/Pendant/Bridal Set/Chain), `GET /categories/public?vertical=JEWELERY` → 200 ✅
- Nayi JEWELERY validation live prove: bina `jeweleryDetails` POST → **400 `jeweleryDetails is required for JEWELERY products`** (koi DB write nahi) ✅
- Refactored `findSimilar` regression check (clothing product id) → 200 with results ✅
- Wishlist toggle + cart add fake id par → 404 `Product not found` (sahi lookup, koi write nahi) ✅
- Admin `GET /products` → 200 ✅
- `bun test jewelry` → 10/10 pass; mobile `tsc --noEmit` → clean ✅

⚠️ BLOCKER (action needed, code issue nahi): seller ka store setup incomplete hai — `policyRefs.returnPolicy/refundPolicy/shippingPolicy` missing. Isliye seller abhi **koi bhi** product (clothing bhi) create nahi kar sakta — ye clothing wala purana rule jewelry par bhi sahi lag raha hai. Fix: dash-web me seller store policies complete karo, fir seller jewelry products list kar payega. Redis bhi local par down tha (`ECONNREFUSED 6379`) — server chal gaya par OTP/rate-limit paths ke liye Redis chahiye.

## 9. DONE — Seller update/delete owner-check bug (19 Sep 2026, critical)

Live test me pakda gaya: seller apna khud ka product **edit/delete nahi kar sakta tha** (hamesha 403) — clothing sellers ke liye bhi. Root cause: `ProductDAO.findById` `sellerId` populate karta hai, aur service `product.sellerId.toString()` compare kar raha tha → populated object ka toString `"[object Object]"` hota hai, kabhi match nahi hota.

Fix (`server/src/modules/clothing/products/products.service.ts`): `ownerIdOf()` helper jo populated `{_id}` unwrap karta hai. `updateProduct` (3 jagah) + `deleteProduct` me lagaya. Live prove: seller PATCH → 200, DELETE → 200 (stale server ne 1 ghanta confuse kiya — `taskkill //F //IM bun.exe` + restart ke baad pass).

## 10. DONE — reset-password endpoint bug (19 Sep 2026)

`POST /auth/reset-password`: validation `{token, password}` mangta hai par controller `req.body.newPassword` padh raha tha → real reset flow sab clients ke liye broken tha. One-line fix (`auth.controller.ts`). Jewelry mobile auth bhi isi par migrate: sign-in (Email+Google, OTP tab hataya — server routes exist hi nahi karte), sign-up (password field + auto-login), forgot (reset-link email), reset-password (token-based), otp route retired → sign-in redirect. `AuthContext` se dead OTP functions hataye.

## 11. DONE — Seller panel chain via /sellers/products (19 Sep 2026)

- Create JEWELERY (dash-web payload shape) → 201, approval DRAFT ✅
- Seller list `?vertical=JEWELERY` → 1 result ✅ (backend: `sellerListQuerySchema` + `SellerService.listProducts` + `findBySellerId` me vertical/search support add kiya; `GET /products` seller path bhi query forward karta hai)
- Update jewelry fields → 200 ✅, Delete → 200 ✅
- Test data cleanup done — public catalog wapas empty, koi junk nahi.

## 12. DONE — Dash-web catalog tabs (19 Sep 2026)

Screenshot wali demand: Create Product me **catalog tabs (Clothing | Jewelry | Food)**, separate tailored forms, centralized:
- New shared module `dash-web/src/features/catalog/` — `lib/catalogVerticals.ts` (verticals, purities, food types) + `components/CatalogVerticalTabs.tsx` (dono panels use karte hai).
- **Seller dialog**: tabs (edit par locked), category dropdown vertical ke hisab se filter, Size Chart sirf Clothing me, Jewelry section (metal/purity/weight required + BIS/gemstone/making/cert), Food section (veg/shelf/ingredients), submit validation + payload.
- **Admin form**: same tabs + jewelry/food sections + payload + list me vertical filter. Seller list me bhi "All catalogs" filter.
- `tsc -b` clean, `oxlint` me sirf pre-existing warnings. Server ke 23 test fails pre-existing hai (clean tree par bhi fail — stash karke prove kiya).

## 13. DONE — Order value bug: platform negative profit (19 Sep 2026, CRITICAL)

**Report tha:** platform negative profit, seller ko full, rider ko delivery fee 60 ke against 600.

**DB se nikala (last orders):** `QB-5259642924` (DELIVERED, payable 839) ka snapshot: commission 119.85 (15% sahi), sellerNet 679.15 (sahi kata — seller ko "full" nahi mila, hisab sahi hai), par `riderPayoutEstimate: 500` jabki customer ne delivery fee sirf 40 di → `appNetAfterRider: -340.15`. Rider offer ACCEPT hua 500 par (`riderDistanceToStoreKm: 0.09` — rider store ke bagal me tha!). Matlab 0 km ki delivery par 99 km ka payout.

**Root cause (2-layer):**
1. **Code bug** (`orderPricing.service.ts`): quote me distance `itemCoords || storeCoords` se nikalta tha — product ke `logistics` coords ko store location par PRIORITY milti thi. Serviceability check sahi tha (store coords use karta hai), par pricing galat coords se hoti thi — dono me mismatch.
2. **Data bug:** 7 products me `logistics` pin Patna ka tha (25.5941, 85.1376) jabki store Dumraon me hai (25.5840133, 84.1512183) — lagta hai bulk-import default. Snapshot distance 98.93 = exact Patna distance. Har order overpay ho raha tha.

**Fix:**
- `resolvePickupCoords()` helper: STORE `currentLocation` single source of truth, item coords sirf fallback. + unit tests (`pricingCoords.test.ts` — 3/3 pass).
- 7 products ke logistics coords admin PATCH se store pin par correct kiye.
- Live prove (same customer pin): pehle dist 98.93 / rider 500 / appNet -340.15 → ab **dist 0 / rider 20 / appNet +309.85**.

**Note:** purane DELIVERED order ka -340.15 snapshot history hai (badla nahi ja sakta). Seller settlement (679.15) sahi tha, kuch lena-dena nahi. Aage ke liye: store radius (20 km) + rules (45 + 5/km) me max payout ~105 rehta hai in-radius orders par — economics healthy. Chhote door ke orders par nazar rakhna; zaroorat pade to delivery fee/commission tune karna (admin config, code change nahi chahiye).

## 14. Jewelry recheck (19 Sep 2026, same day)

- `GET /products/public?vertical=JEWELERY` → 200 (empty — seller ne abhi real products add nahi kiye, expected)
- `GET /categories/public?vertical=JEWELERY` → 200, **8 categories live**
- `GET /products/trending?vertical=JEWELERY` → 200
- Mobile: catalog/cart/wishlist/checkout/auth sab real flows par, `tsc` clean, koi mock checkout nahi bacha
- **Launch ke liye ready:** seller dash-web (tabs wala form) se jewelry products add kare → app me turant dikhenge. Pehla real product add karke ek test order (quote tak) kar lena recommended hai.

## 15. DONE — Mock purge + launch readiness (19 Sep 2026)

**Hata diya:**
- `data/products.ts` → sirf `Product` type bacha (8 mock products, null images, `mock://` try-on URLs sab delete)
- `data/collections.ts` → sirf `Collection` type + occasion labels bache
- `data/mockUserData.ts` → **deleted** (fake orders, fake credits, fake cards)
- `hooks/useJewelerySearch.ts` (purana mock hook) → **deleted**

**Account screen (fake money tha!):** stats me `₹MOCK_CREDITS`, "Visa ×4832" jaise nakli card numbers, "2 addresses" — sab hataya. Ab real `getMyOrdersRequest` se orders/active count, teesra stat Wishlist count. Dead routes wale items hataye (Payment Methods, Size Profile — ye routes exist hi nahi karte the). Gift Cards & Credits section hataya (koi credits system nahi hai). Wishlist ka galat route (`/(tabs)/wishlist` → clothing!) fix kiya.

**Images:** heritage `source={undefined}` crash-risk hataya; hero slides ko emerald fallback background; ProductCard + ImageCarousel me null-guard + fallback icon; TryOn screen ko honest "Coming soon" placeholder banaya (product pages Try button pehle se hide karte hai).

**Fake social proof:** 3 nakli "Verified Purchase" reviews + "40,000+ Indian women" claim hide kiya (code rakha hai — real reviews aane par wapas lagana).

**Launch verdict: YES, ready** — har screen real API par hai, empty states hai, koi dead route/fake checkout/fake money nahi. Pehla real product add hote hi catalog live. Ek cheez user ke haath me: announcement/trust lines ("Try at home", "Free returns 30 days") business claims hai — jo service doge wahi rakho.

## 16. DONE — Mock images purge (19 Sep 2026)

- HeroCarousel ke 4 `image: null` mock slides delete. Ab hero **real product photos** se banta hai (bestsellers → shoppable slides with price + product link); catalog empty ho to emerald brand slides. Auto-scroll timer ko dynamic length-safe banaya (stale closure crash fix).
- Koi `require()` image, koi jewelry asset file, koi `mock://` URL nahi bacha — grep verify kiya.
- `tsc` clean.

## 18. DONE — Web 500s: CORS origin missing (19 Sep 2026)

**Symptom:** `localhost:8081` par clothing home ke saare API calls 500 (banners, products, categories, malls).

**Root cause:** server log me साफ dikha — `CORS origin not allowed: http://localhost:8081`. Server ke `CORS_ORIGIN` me Expo web port (8081) tha hi nahi; CORS middleware throw karta hai aur error handler use 500 me badal deta hai. API origin bundle me sahi tha (`:8000`), sirf server allowlist incomplete thi.

**Fix:** `server/.env` me `http://localhost:8081` + `http://10.198.26.27:8081` (phone testing) add + server restart. Verify: teeno endpoints web origin ke saath 200. **User ko sirf page refresh karna hai** — rebuild zaroori nahi.

## 17. DONE — Bell lottie remove + catalog arrow + last-catalog reopen (19 Sep 2026)

**Bell button fully removed:** pehle bell lottie hataya tha, fir poora notification bell button hi hata diya `HomeHeader` se (teeno catalogs me header shared hai). Ab header me sirf brand + catalog arrow hai. Notifications screen (`/account/notifications`) waise bhi exist karti hai, reachable rahegi account se.

**Desktop navbar me bhi arrow:** wide-screen web par `HomeHeader` chhupta hai aur `DesktopNavbar` dikhta hai (usme arrow nahi tha) — waha bhi `ModuleSwitcherButton` lagaya, notifications button ke bagal me. Ab arrow mobile + desktop + teeno catalogs me dikhta hai. (Note: desktop-wide Food screen me koi header nahi hota — pre-existing behavior, mobile par arrow hai.)

**Switcher pill redesign (arrow samajh nahi aa raha tha):** akele `→` se pata nahi chalta tha kaha jayega — button ab pill hai jisme **next catalog ka icon + naam + arrow** dikhta hai (e.g. Clothing par `✨ Jewelry →`). Border next catalog ke color me. Tap karne par seedha us catalog me jata hai.

## 17b. Jewelry header reorder + full-height (19 Sep 2026)

- Header order ab: **Quick Bihar (left) → search → catalog pill (right)**. Header se bag button hataya (pill uski jagah right me).
- Bottom tab bar me **Bag tab rakha hai** — wahi se cart/checkout khulta hai; woh hataya to checkout toot jayega.
- Full height: ScrollView me `flexGrow: 1` + absolute tab bar ke liye bottom padding (native 90 / web 110) — last content (newsletter) tab bar ke peeche nahi chhupega.
- **Teeno catalog home screens me bottom padding:** bottom tab bar absolute hai, last items chhupte the — Clothing home (desktop par 24, mobile par 100), Jewelry home (native 90 / web 110 + flexGrow), Food home (32, waha tab bar nahi hai).

**Catalog changer arrow:** header switcher ka `swap-horizontal` icon → `arrow-forward`. Ek click = next catalog: **Clothing (default) → Jewelry → Food → wapas Clothing** (`APP_MODULES` order fix — pehle food 2nd tha). Button par accessibility label bhi hai ("Next catalog: Jewelry"). Clothing, Jewelry (pehle se tha) aur Food (shared `HomeHeader` use karta hai) — teeno headers me same arrow.

**Last-catalog reopen:** pehle se persisted tha (`useModuleStore` → AsyncStorage `active-app-module-v1`) aur `app/index.tsx` hydration ke baad last module par redirect karta hai — verify kiya, koi reset-on-logout nahi hai. Jewelry se exit karke app dobara kholo → seedha Jewelry khulega. Koi code change nahi chahiye tha, sirf order fix tha.

## 19. DONE — Text-node flood + company constants single-source (19 Sep 2026)

**Console flood fix:** jewelry home par `Unexpected text node` error 100+ baar aa raha tha (har hero auto-scroll tick par 4). Playwright fiber-walk se pakda — hero slide JSX me `)}` ke baad same line par 6 spaces + `<View>` tha (purani edit ka side-effect), jo whitespace text node ban gaya tha. One-line JSX fix → **zero errors** (browser me verify). Timer + dots wapas on hai.

**Company info single source (`src/constants/app.constants.ts`):** jewelry me hardcoded `₹` (7 jagah), `+91` (2 jagah), nakli WhatsApp number (`+91 98765 00000` guest menu me!), nakli shipping math (`+199` total me joda hua — server quote me real fee lagti hai), `Free Returns 30d`, brand strings — sab `APP_CURRENCY` / `APP_COUNTRY_CODE` (new) / `APP_NAME` / `JEWELERY_MODULE_CONFIG` (whatsapp, freeShippingThreshold, returnPolicyDays) se aata hai ab. Cart total me fabricated 199 hataya — shipping "At checkout" dikhta hai, EMI subtotal se banti hai. Grep verify: zero hardcoded bache. `tsc` clean.

## 20. DONE — Jewelry auth = clothing one-tap flow (19 Sep 2026)

**Sawaal tha:** jewelry me alag auth kyu? Ab same hai — clothing ke `auth.screen.tsx` jaisa single **one-tap Google screen** (server `/auth/google` par auto-register, koi password/OTP nahi). Sign-up/forgot/reset/otp routes redirect karte hai sign-in par (clothing me bhi ye screens nahi hai). Success par jewelry profile + guest cart sync.

**Checkout pehle se same tha:** jewelry cart common `/checkout` kholta hai — address + GPS pin + **WhatsApp OTP phone verification** (bina verified phone ke order block) + quote → Razorpay/COD. Browser me sign-in screen verify: zero errors. `tsc` clean.

## 21. DONE — All docs refresh (19 Sep 2026)

Purane docs me "jewelery placeholder/mock" claims the — sab update kiye (archive/dated audits ko nahi chheda):
- `README.md` + `readme.md`: live verticals clothing+jewelery, Hugeicons→AppIcon, roadmap items ✅ done mark.
- `docs/developers-docs/`: `apps/mobile-app.md` (+ Jewelery status section), `getting-started/folder-structure.md`, `getting-started/overview.md`, `README.md`, `features/products.md` — jewelry live reflect.
- `plan.md` (9 Sep SEO audit): top par dated addendum — jewelry noindex faisla real data ke saath re-evaluate karna hai.
- Code-doc alignment: dead `requestOTPRequest`/`verifyOTPRequest` common `auth.api` se delete (doc pehle se kehta tha) — zero refs, `tsc` clean.
