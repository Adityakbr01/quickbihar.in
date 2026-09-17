# QuickBihar Partner Dashboard (Vite + React)

Admin, Seller & Delivery portals for QuickBihar — orders, inventory, deliveries, and catalog management across Bihar.

## Stack

- [Vite 8](https://vite.dev) + React 19 + TypeScript
- [react-router-dom 7](https://reactrouter.com) (BrowserRouter SPA — replaces the old Next.js App Router)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- shadcn-style UI (`src/components/ui`), React Query, Zustand, Axios, socket.io-client
- Lint: `oxlint`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server proxies `/api/*` to `http://localhost:8000` (override with `VITE_DEV_API_PROXY_TARGET`).

## Environment

Copy `.env.example` to `.env`. All browser keys use the `VITE_` prefix (inlined at build time):

| Key | Example |
| --- | ------- |
| `VITE_API_URL` | `http://localhost:8000/api/v1` (prod: `/api/v1`) |
| `VITE_SOCKET_URL` | `http://localhost:8000` (prod: `/`) |
| `VITE_GOOGLE_CLIENT_ID` | Web client ID from Google Cloud |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Vite dev server (:3000) |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | `oxlint` |
| `npm run typecheck` | `tsc --noEmit` |

## Routes

- `/` — public landing + `/privacy-policy`, `/return-policy`, `/terms-of-service`
- `/auth/*` — forgot-password, reset-password, set-password, link-google
- `/admin/login`, `/admin/dashboard[/:section]`
- `/seller/login`, `/seller/register`, `/seller/dashboard[/:section]`
- `/delivery/login`, `/delivery/register`, `/delivery/dashboard`

Auth guards live in `src/lib/routeGuards.tsx` (client-side replacement for the old Next middleware): valid-token holders bounce from login pages to their dashboard, anonymous visitors bounce from dashboards to login. Session expiry is still owned by the axios 401/403 interceptor (`src/lib/axios.ts`).

## Deploy

`npm run build` emits a static `dist/` served by nginx (`nginx.conf`, SPA fallback to `index.html`). See `Dockerfile` and `vps-nginx/quickbihar.conf`.
