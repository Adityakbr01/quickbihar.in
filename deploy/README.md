# QuickBihar Deployment Notes

## Current Single-Domain Setup

Use `deploy/nginx/quickbihar.path-based.conf` while only `quickbihar.in` is available:

- Expo Web storefront is served at `/` from `mobile/dist`.
- Next.js dashboard is proxied at `/admin`, `/seller`, and `/delivery`.
- Next.js assets are proxied at `/_next`.
- API and realtime traffic are proxied at `/api/v1` and `/socket.io`.

Backend `CORS_ORIGIN` should include the public browser origins, for example:

```env
CORS_ORIGIN=https://quickbihar.in,https://www.quickbihar.in
```

## Future Subdomain Setup

When DNS is ready, prefer:

- `quickbihar.in` -> Expo Web storefront
- `admin.quickbihar.in` -> Next.js dashboard
- `api.quickbihar.in` -> Express/Bun API

That model removes path routing pressure and keeps dashboard assets isolated from the storefront.
