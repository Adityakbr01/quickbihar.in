<!-- BEGIN:vite-agent-rules -->
# Vite + React SPA (migrated from Next.js)

- This is a client-only SPA: `src/main.tsx` → `BrowserRouter` → `src/App.tsx` routes → `src/pages/*`.
- No server components, no middleware, no `next/*` imports. Route guards live in `src/lib/routeGuards.tsx`.
- Env vars use `import.meta.env.VITE_*` (see `.env.example`). Never use `process.env`.
- Routing: `react-router-dom` (`Link to=`, `useNavigate`, `useLocation`, `useSearchParams` tuple).
- Lint with `oxlint` (`npm run lint`), typecheck with `npm run typecheck`.
<!-- END:vite-agent-rules -->
