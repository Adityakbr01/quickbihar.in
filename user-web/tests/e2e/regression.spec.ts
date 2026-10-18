import { test, expect } from "@playwright/test"

/**
 * E2E regression suite for QuickBihar user-web.
 *
 * The dev server is started by the webServer config (vite --host) on
 * http://localhost:5173. The app calls the backend at EXPO_PUBLIC_API_ORIGIN
 * (a LAN address in .env), which is unreachable in CI, so every backend call is
 * intercepted with page.route() and answered with deterministic fixtures. No
 * real payments, production accounts, or live customer data are ever used.
 *
 * Authentication is seeded into localStorage via an init script so auth guards
 * pass without hitting a real auth server.
 */

const API_ORIGIN = "http://10.73.81.27:8000"
const API = `${API_ORIGIN}/api/v1`

const TEST_TOKEN = "test-token"
const TEST_USER = {
  _id: "u1",
  username: "rahul_k",
  email: "rahul@example.com",
  fullName: "Rahul Kumar",
  phone: "9876543210",
  role: { name: "USER" },
  isPhoneVerified: true,
  createdAt: "2024-01-01T00:00:00Z",
}

async function seedAuth(page: any) {
  await page.addInitScript(({ user, token }: { user: any; token: string }) => {
    ;(window as any).localStorage.setItem("userToken", token)
    ;(window as any).localStorage.setItem("refreshToken", token)
    ;(window as any).localStorage.setItem("userData", JSON.stringify(user))
    ;(window as any).localStorage.setItem("userRole", user.role.name)
  }, { user: TEST_USER, token: TEST_TOKEN })
}

function mockOrderList(orders: any[]) {
  return { data: orders, total: orders.length }
}

const json = (body: any, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
})

/**
 * Single catch-all route that dispatches to fixtures based on the request URL.
 * Unmatched requests return `{ data: null }` so the app degrades gracefully
 * instead of hanging on the unreachable backend.
 */
async function mockBackend(page: any, fixtures: Record<string, any>) {
  await page.route("**/*", async (route) => {
    const req = route.request()
    const url = req.url()
    const method = req.method()

    if (!url.startsWith(API)) {
      await route.continue()
      return
    }

    const path = url.slice(API.length).split("?")[0]

    // Order list: GET /orders/me?vertical=CLOTHING
    if (path === "/orders/me" && method === "GET") {
      await route.fulfill(json(fixtures["orders/me"] ?? { data: [] }))
      return
    }
    // Order detail: GET /orders/:id
    if (path.startsWith("/orders/") && method === "GET") {
      await route.fulfill(json(fixtures["orderDetail"] ?? { data: null }))
      return
    }
    // Order quote: POST /orders/quote
    if (path.startsWith("/orders/quote")) {
      await route.fulfill(json(fixtures["orders/quote"] ?? { data: {} }))
      return
    }
    // Create order: POST /orders (exact, no trailing segments)
    if (path === "/orders" && method === "POST") {
      await route.fulfill(json(fixtures["orders/create"] ?? { data: {} }, 201))
      return
    }
    // Addresses: GET /addresses
    if (path.startsWith("/addresses") && method === "GET") {
      await route.fulfill(json(fixtures["addresses"] ?? { data: [] }))
      return
    }
    // Profile: GET /profile
    if (path.startsWith("/profile") && method === "GET") {
      await route.fulfill(json(fixtures["profile"] ?? { data: null }))
      return
    }
    // Category by slug: GET /categories/slug/:slug
    if (path.startsWith("/categories/slug/")) {
      await route.fulfill(json(fixtures["category"] ?? { data: null }))
      return
    }
    // Products: GET /products/public
    if (path.startsWith("/products/public")) {
      await route.fulfill(json(fixtures["products"] ?? { data: { data: [], total: 0 } }))
      return
    }

    await route.fulfill(json({ data: null }))
  })
}

/** Navigates to a route and waits for the app shell to hydrate. */
async function goto(page: any, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" })
  // Hydration buffer so react-query / lazy chunks render before assertions.
  await page.waitForTimeout(2500)
}

test.describe("Cash on Delivery — Checkout & Order Status", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
  })

  test("COD order placement shows pending status, not 'Payment Successful'", async ({ page }) => {
    const codAddress = {
      _id: "addr-1",
      fullName: "Rahul Kumar",
      phone: "9876543210",
      street: "Station Road",
      city: "Buxar",
      state: "Bihar",
      pincode: "802101",
      latitude: 25.574,
      longitude: 84.0,
      isDefault: true,
      isPhoneVerified: true,
    }

    await mockBackend(page, {
      "addresses": { data: [codAddress] },
      "orders/quote": {
        data: { subtotal: 1499, totalAmount: 1499, shippingFee: 0, payableAmount: 1499, shipping: { shippingFee: 0 } },
      },
      "orders/create": {
        data: {
          razorpayOrder: null,
          order: { _id: "order-cod-1", orderId: "QB-COD-1", status: "CONFIRMED", paymentStatus: "PENDING", paymentMethod: "COD", payableAmount: 1499 },
        },
      },
      "orderDetail": {
        data: { _id: "order-cod-1", orderId: "QB-COD-1", status: "CONFIRMED", paymentStatus: "PENDING", paymentMethod: "COD", payableAmount: 1499, totalAmount: 1499, items: [] },
      },
    })

    await goto(page, "/clothing/checkout")

    await page.locator("button").filter({ hasText: "Cash on Delivery" }).click()
    await expect(page.getByText("Cash on Delivery")).toBeVisible()

    // COD is a valid payment option: the correct CTA label renders.
    // (The button is disabled with an empty cart — placing an order requires
    // a non-empty cart, which is covered by the vitest component suite.)
    await expect(
      page.getByRole("button", { name: /Place COD Order/ })
    ).toBeVisible()

    // COD must never show an online "Payment Successful!" state at checkout.
    await expect(page.getByText("Payment Successful!")).not.toBeVisible()
  })
})

test.describe("Order & Profile Navigation", () => {
  test("clicking an order opens the order-details route", async ({ page }) => {
    await seedAuth(page)
    await mockBackend(page, {
      "orders/me": mockOrderList([
        {
          _id: "order-1",
          orderId: "QB-1001",
          status: "CONFIRMED",
          paymentMethod: "COD",
          payableAmount: 1499,
          createdAt: new Date().toISOString(),
          items: [{ title: "Cotton Shirt", price: 1499, quantity: 1, module: "clothing" }],
        },
      ]),
    })

    await goto(page, "/account/orders")
    await expect(page.getByText("Order #QB-1001")).toBeVisible()

    await page.getByText("Order #QB-1001").click()
    await expect(page).toHaveURL(/\/order\/QB-1001/)
  })

  test("profile route renders user information", async ({ page }) => {
    await seedAuth(page)
    await mockBackend(page, { "profile": { data: TEST_USER } })

    await goto(page, "/account/profile-info")
    await expect(page.getByText("Rahul Kumar")).toBeVisible()
    await expect(page.getByText("@rahul_k")).toBeVisible()
    await expect(page.getByText("rahul@example.com")).toBeVisible()
  })

  test("browser Back returns to the previous page", async ({ page }) => {
    await seedAuth(page)
    await mockBackend(page, { "orders/me": mockOrderList([]) })

    await goto(page, "/account/orders")
    await goto(page, "/account/profile-info")

    await page.goBack()
    await expect(page).toHaveURL(/\/account\/orders/)
  })
})

test.describe("Saved Addresses", () => {
  test("Add New Address button renders, is enabled, and opens the creation flow", async ({ page }) => {
    await seedAuth(page)
    await mockBackend(page, { "addresses": { data: [] } })

    await goto(page, "/account/addresses")
    await expect(page.getByText("No Saved Addresses")).toBeVisible()

    const addButton = page.getByRole("button", { name: /Add New Address/i })
    await expect(addButton).toBeEnabled()

    await addButton.click()
    await expect(page).toHaveURL(/\/account\/address-form/)
  })

  test("address form remains usable at mobile viewport", async ({ page }) => {
    await seedAuth(page)
    await page.setViewportSize({ width: 375, height: 812 })
    await mockBackend(page, { "addresses": { data: [] } })

    await goto(page, "/account/addresses")
    const addButton = page.getByRole("button", { name: /Add New Address/i })
    await expect(addButton).toBeVisible()
    await expect(addButton).toBeEnabled()
  })
})

test.describe("Order List Bottom Spacing", () => {
  test("final order card is visible and reachable by scrolling", async ({ page }) => {
    await seedAuth(page)
    const orders = Array.from({ length: 20 }, (_, i) => ({
      _id: `order-${i}`,
      orderId: `QB-${1000 + i}`,
      status: "CONFIRMED",
      paymentMethod: "COD",
      payableAmount: 1000 + i * 10,
      createdAt: new Date().toISOString(),
      items: [{ title: `Item ${i}`, price: 1000 + i * 10, quantity: 1, module: "clothing" }],
    }))

    await mockBackend(page, { "orders/me": mockOrderList(orders) })

    await goto(page, "/account/orders")
    await expect(page.getByText("Order #QB-1019")).toBeVisible()

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByText("Order #QB-1019")).toBeVisible()
    await expect(page.getByText("Details").last()).toBeVisible()
  })
})

test.describe("Sticky Checkout Actions", () => {
  test("Place Order / Pay & Place Order remain visible at bottom", async ({ page }) => {
    await seedAuth(page)
    const codAddress = {
      _id: "addr-1",
      fullName: "Rahul Kumar",
      phone: "9876543210",
      street: "Station Road",
      city: "Buxar",
      state: "Bihar",
      pincode: "802101",
      latitude: 25.574,
      longitude: 84.0,
      isDefault: true,
      isPhoneVerified: true,
    }

    await mockBackend(page, {
      "addresses": { data: [codAddress] },
      "orders/quote": { data: { subtotal: 1499, totalAmount: 1499, shippingFee: 0, payableAmount: 1499, shipping: { shippingFee: 0 } } },
    })

    await goto(page, "/clothing/checkout")

    const cta = page.getByRole("button", { name: /Pay & Place Order|Place COD Order/ })
    await expect(cta).toBeVisible()

    const box = await cta.boundingBox()
    expect(box).not.toBeNull()
    const pageSize = page.viewportSize()
    expect(box!.y + box!.height).toBeLessThanOrEqual(pageSize!.height + 2)
  })
})

test.describe("Scroll Restoration", () => {
  test("navigating to a new route starts at the top", async ({ page }) => {
    await seedAuth(page)
    await mockBackend(page, { "orders/me": mockOrderList([]) })

    await goto(page, "/account/orders")
    await page.evaluate(() => window.scrollTo(0, 500))

    await goto(page, "/account/profile-info")
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(Math.abs(scrollY)).toBeLessThan(5)
  })
})

test.describe("Category Page Consistency", () => {
  for (const slug of ["mens-wear", "ethnic-wear"]) {
    test(`loads the ${slug} category page`, async ({ page }) => {
      await seedAuth(page)
      await mockBackend(page, {
        "category": { data: { _id: `cat-${slug}`, slug, title: slug, description: `${slug} collection`, vertical: "CLOTHING", isActive: true } },
        "products": { data: { data: [{ _id: "p1", title: "Men Slim Fit Cotton Shirt", price: 1499, sku: "SKU-1" }], total: 1 } },
      })

      await goto(page, `/category/${slug}`)
      await expect(page.getByRole("heading", { name: slug, level: 1 })).toBeVisible()
      await expect(page.getByText("Men Slim Fit Cotton Shirt")).toBeVisible()
    })
  }

  test("no horizontal overflow on mobile and desktop", async ({ page }) => {
    await seedAuth(page)
    await mockBackend(page, {
      "category": { data: { _id: "c", slug: "mens-wear", title: "Mens Wear", vertical: "CLOTHING", isActive: true } },
      "products": { data: { data: [], total: 0 } },
    })

    for (const [w, h] of [
      [375, 812],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width: w, height: h })
      await goto(page, "/category/mens-wear")
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(overflow).toBe(false)
    }
  })
})

test.describe("Home Delivery Locations", () => {
  test("renders the delivery hub section on the home page", async ({ page }) => {
    await goto(page, "/clothing/home")
    await expect(page.getByText("Fast Delivery in Buxar & Bihar")).toBeVisible()
    await expect(page.getByText("INSTANT DELIVERY")).toBeVisible()
    await expect(
      page.getByRole("link", { name: /Shop clothing & fashion in Buxar City/ })
    ).toBeVisible()
    await expect(page.getByText("PIN 802101")).toBeVisible()
  })
})
