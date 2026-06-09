# QuickBihar.in

QuickBihar.in is a fashion-first commerce app for clothing, focused on apparel discovery, shopping, delivery, seller tools, and admin operations.

## Product Scope

The app supports clothing only. Core fashion areas include:

- Men, women, and kids clothing categories
- Product variants for size, color, stock, and SKU
- Size charts for apparel measurements
- Clothing return and exchange policies
- Banners, coupons, wishlists, carts, orders, checkout, tracking, and admin management

## Architecture

- `mobile`: Expo app for customers, sellers, and admins
- `server`: Express/Bun API with MongoDB models and RBAC
- `web`: Next.js admin/dashboard surface

## Domain Rules

Store and seller domain data is intentionally limited to `CLOTHING`. Backend validation, seller profiles, store configs, RBAC domains, seed data, and mobile routing should all stay aligned with that single fashion scope.

## Main Flow

1. App initializes auth and splash state.
2. Root route redirects directly to the clothing tab.
3. Customers browse clothing categories, search products, add items to cart, and place orders.
4. Sellers/admins manage clothing products, banners, coupons, size charts, refund policies, orders, and settings.
