# 06 — API Flow

> **Created:** 2026-08-01
> **File type:** App deep-dive
> **Padhne ka time:** ~20 min

---

## WHAT — Yeh doc kya cover karti hai?

Ek API request **start se end tak** kaise chalti hai — client se request banti hai, nginx proxy karta hai, server ke layers se guzarti hai (middleware → controller → service → dao → model), response wapas aata hai. Plus: standard request/response shape, error shape, aur poora endpoint surface.

---

## WHY — Yeh samajhna kyun zaroori?

Kyunki har feature ek API call hai. Agar aapko yeh mental model clear hai — "request kaha jaati hai, kaunsi layer kya karti hai, error kaha handle hota hai" — toh aap kisi bhi endpoint ko debug/extend kar sakte ho.

---

## WHERE — API ka base structure

```
Base URL:  <origin>/api/v1
Auth:      Authorization: Bearer <accessToken>   (ya cookie: accessToken)
Content:   application/json  (body limit: 16kb)
```

- **Web** (`web/src/lib/axios.ts`): `NEXT_PUBLIC_API_URL || http://localhost:8000/api/v1`, `withCredentials: true`.
- **Mobile** (`mobile/src/api/axiosInstance.ts`): `${EXPO_PUBLIC_API_ORIGIN}/api/v1`.
- Production mein nginx `/api/` ko `server:8000` pe proxy karta hai.

---

## HOW — Standard response shape (`ApiResponse`)

Har success response yeh shape follow karta hai (`utils/ApiResponse.ts`):

```json
{
  "statusCode": 200,
  "data": { /* actual payload */ },
  "message": "User logged in successfully",
  "success": true
}
```

Controller `res.status(200).json(new ApiResponse(200, data, message))` use karta hai. Client (axios) `response.data.data` se actual payload nikaalta hai (isiliye `response.data.data.accessToken` jaisa pattern dikhta hai).

## HOW — Standard error shape (`ApiError`)

Koi bhi error `errorHandler` (global middleware) se guzarta hai aur yeh shape banta hai (`utils/ApiError.ts`):

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [ /* Zod issues ya detail */ ],
  "success": false
}
```

`ApiError(statusCode, message, errors[])` — services yeh throw karte hain, `asyncHandler` `.catch(next)` karta hai, `errorHandler` JSON banata hai. Detail: [18_Error_Handling.md](./18_Error_Handling.md).

---

## FLOW — Ek request ka poora safar (example: `POST /api/v1/orders/quote`)

```mermaid
sequenceDiagram
    participant C as Client (axios)
    participant NG as nginx
    participant MW as Middleware chain
    participant RT as order.router
    participant CT as order.controller
    participant SV as orderPricing.service
    participant DB as MongoDB

    C->>NG: POST /api/v1/orders/quote<br/>Bearer token + { items, addressId }
    NG->>MW: proxy_pass server:8000
    MW->>MW: logger → cors → cookieParser → json parse → responseExtensions
    MW->>RT: route match /orders
    RT->>RT: router.use(verifyJWT) → req.user set
    RT->>CT: quoteController
    CT->>CT: Zod validate body
    CT->>SV: buildQuote(userId, data)
    SV->>DB: products, coupons, store (pricing calc)
    SV-->>CT: quote object
    CT-->>C: res.ok(ApiResponse(200, quote))
    Note over MW: koi error → errorHandler → JSON
```

### Step-by-step (words mein)

```
1. Client axios se request banata hai
   - Request interceptor token attach karta hai (Bearer)

2. nginx (production) /api/ → server:8000 proxy

3. Global middleware chain (app.ts order):
   logger → cors → cookieParser → json(16kb) → urlencoded → static → responseExtensions

4. Router match (/api/v1/orders → order.router)
   - router.use(verifyJWT): token verify + req.user attach (roleId populated)
   - (kuch routes pe role guard: isAdmin/isSeller/etc.)

5. Controller (asyncHandler-wrapped)
   - req.body / req.params nikaalta hai
   - Zod validate (validator schema)
   - service call

6. Service (business logic)
   - rules, calculations, orchestration
   - DAO call (DB queries)

7. DAO → Mongoose model → MongoDB

8. Response wapas:
   - res.ok / res.created / res.json(new ApiResponse(...))
   - client response.data.data se payload leta hai

9. Error hua toh:
   - service ApiError throw → asyncHandler catch → errorHandler → standard JSON
```

---

## HOW — Authentication in requests (recap)

```
Protected route:
  Request → verifyJWT
    token = cookie.accessToken || "Bearer <token>" header
    jwt.verify(token, ACCESS_TOKEN_SECRET)
    UserDAO.findById → req.user (roleId populated)
  → role guard (validateRole/validatePermission)
  → controller
```

401 aaye toh client **single-flight silent refresh** karta hai (dekho [08_Authentication.md](./08_Authentication.md)).

---

## WHERE — Poora endpoint surface (25 routers)

Sab `/api/v1/` prefix ke saath (`app.ts` se):

| Router | Base path | Detail doc |
|--------|-----------|-----------|
| auth | `/auth` | [08_Authentication.md](./08_Authentication.md) |
| admin | `/admin` | — |
| sellers | `/sellers` | — |
| malls | `/malls` | — |
| delivery | `/delivery` | [11_Order_System.md](./11_Order_System.md) |
| events | `/events` | [14_Notifications.md](./14_Notifications.md) |
| notifications | `/notifications` | [14_Notifications.md](./14_Notifications.md) |
| onboarding | `/onboarding` | — |
| stores | `/stores` | — |
| categories | `/categories` | — |
| users | `/users` | — |
| rbac | `/rbac` | [09_Authorization_RBAC.md](./09_Authorization_RBAC.md) |
| banners | `/banners` | — |
| products | `/products` | [10_Product_System.md](./10_Product_System.md) |
| size-charts | `/size-charts` | [10_Product_System.md](./10_Product_System.md) |
| coupons | `/coupons` | — |
| addresses | `/addresses` | — |
| orders | `/orders` | [11_Order_System.md](./11_Order_System.md) |
| labels | `/labels` | — |
| payment-methods | `/payment-methods` | [12_Payment_System.md](./12_Payment_System.md) |
| cart | `/cart` | — |
| wishlist | `/wishlist` | — |
| app-config | `/app-config` | [16_Environment.md](./16_Environment.md) |
| refund-policies | `/refund-policies` | — |

### Example: order endpoints (`order.router.ts`)
```
router.use(verifyJWT)   ← saari order routes protected

User:
  POST   /orders/quote                    ← price quote
  POST   /orders                          ← order banao
  POST   /orders/verify                   ← payment verify
  GET    /orders/me                       ← mere orders
  GET    /orders/sub-orders/:id           ← ek suborder
  POST   /orders/sub-orders/:id/cancel    ← cancel
  POST   /orders/sub-orders/:id/return    ← return request
  GET    /orders/:id                      ← ek order

Admin:
  GET    /orders/admin/all
  PATCH  /orders/admin/status/:id
  GET    /orders/admin/sub-orders
  POST   /orders/admin/sub-orders/:id/assign
  POST   /orders/admin/sub-orders/:id/cod-settle
  POST   /orders/admin/sub-orders/:id/return-resolve
```

---

## WHO — Kaun kaunse endpoints call karta hai

| Client | Zyadatar endpoints |
|--------|-------------------|
| Mobile (customer) | `/products`, `/cart`, `/orders/*`, `/addresses`, `/wishlist` |
| Mobile (rider) | `/delivery/*` (offers, lifecycle) |
| Web (admin) | `/admin/*`, `/rbac`, `/categories`, `/orders/admin/*` |
| Web (seller) | `/sellers/*`, `/products`, `/orders`, `/coupons` |

---

## DEPENDENCIES

- **Isse pehle:** [04_Backend.md](./04_Backend.md) (layered architecture)
- **Deep:** [23_Request_Lifecycle.md](./23_Request_Lifecycle.md) (HTTP + socket lifecycle)
- **Related:** [18_Error_Handling.md](./18_Error_Handling.md), [08_Authentication.md](./08_Authentication.md)

---

## RISKS

- ⚠️ **16kb body limit** — bade payloads (jaise base64 image body mein) fail honge. Images multipart se jaati hain (multer), JSON nahi. Dekho [13_File_Uploads.md](./13_File_Uploads.md).
- ⚠️ **`response.data.data` nesting** — ApiResponse wrapper ki wajah se double `.data`. Naye devs yaha confuse hote hain.
- ⚠️ **Har protected request pe DB read** (verifyJWT). Scale pe overhead. Dekho [20_Performance.md](./20_Performance.md).

---

## IMPROVEMENTS

- OpenAPI/Swagger spec generate karna (abhi manual documentation).
- Consistent pagination pattern saare list endpoints pe.
- Request-id header (tracing ke liye).

---

*Verified against `app.ts` (router mounts), `order.router.ts`, `auth.router.ts`, `utils/ApiResponse.ts` + `ApiError.ts` patterns on 2026-08-01.*
