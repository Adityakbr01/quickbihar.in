# QuickBihar Agent Rules & Guidelines

## 1. CRITICAL: Mobile App is Deprecated — Fully Ignore `/mobile`
- **DO NOT TOUCH, MODIFY, OR AUDIT THE `mobile/` DIRECTORY.**
- The React Native mobile app (`/mobile`) is officially **DEPRECATED** and is no longer in use.
- All client experiences have been shifted to the web applications:
  - **`user-web`**: Primary customer-facing web application and PWA.
  - **`dash-web`**: Seller, Admin, and Rider dashboard web application.
- Whenever working in this repository:
  - **Completely ignore the `/mobile` directory.**
  - Do not evaluate, lint, test, build, or fix anything inside `mobile/`.
  - Do not include `mobile/` in audit reports, release blockers, or defect registers.
  - Exclude `mobile/` from all test suites, CI checks, and release checklists.

## 2. Active Application Scope
- **`server/`**: Backend API built with Bun/Node.js, Express, MongoDB, Redis, and BullMQ.
- **`user-web/`**: Customer-facing web marketplace built with React, Vite, and static prerendering (SSG).
- **`dash-web/`**: Partner, Seller, Rider, and Admin operations dashboard built with React and Vite.
- **`docs/`**: Official architectural, API, and audit documentation.

## 3. Mandatory Development & Release Rules
- **No Automated Git Commits or Pushes**: Never run `git commit` or `git push`. The user personally reviews, stages, commits, and pushes all changes.
- **Apply the Ponytail Minimalism Ladder**: Mental ladder of minimalism. Reuse existing utilities, use the smallest working diff, and avoid premature abstractions or redundant dependencies.
- **Verification Integrity**: Always verify changes with real commands (`bun test`, `bun run build`). Never fabricate test outcomes. Safe local testing only (no live payment charges or destructive operations).
