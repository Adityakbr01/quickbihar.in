# QuickBihar.in

QuickBihar.in ek fashion-first commerce app hai jo sirf clothing ke liye bana hai. Iska focus apparel browsing, shopping, delivery, seller tools, aur admin management par hai.

## Product Scope

App me sirf clothes support honge. Main fashion areas:

- Men, women, aur kids clothing categories
- Size, color, stock, aur SKU variants
- Apparel size charts
- Clothing return aur exchange policies
- Banners, coupons, wishlist, cart, orders, checkout, tracking, aur admin management

## Architecture

- `mobile`: Expo app customers, sellers, aur admins ke liye
- `server`: Express/Bun API with MongoDB models aur RBAC
- `web`: Next.js admin/dashboard surface

## Domain Rules

Store aur seller domain intentionally sirf `CLOTHING` hai. Backend validation, seller profiles, store configs, RBAC domains, seed data, aur mobile routing sab isi single fashion scope ke saath aligned rahenge.

## Main Flow

1. App auth aur splash state initialize karta hai.
2. Root route direct clothing tab par redirect karta hai.
3. Customer clothing categories browse karta hai, products search karta hai, cart me add karta hai, aur order place karta hai.
4. Sellers/admins clothing products, banners, coupons, size charts, refund policies, orders, aur settings manage karte hain.
