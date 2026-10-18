# QuickBihar Agent Rules & Guidelines

## 1. CRITICAL: Mobile App is Deprecated — Fully Ignore `/mobile`

- **DO NOT TOUCH, MODIFY, OR AUDIT THE `mobile/` DIRECTORY.**
- The React Native mobile app (`/mobile`) is officially **DEPRECATED** and is no longer in use.
- All client experiences have been shifted to the web applications:
  - **`user-web/`**: Primary customer-facing web application and PWA.
  - **`dash-web/`**: Seller, Admin, and Rider dashboard web application.
- Whenever working in this repository:
  - Completely ignore the `/mobile` directory.
  - Do not evaluate, lint, test, build, or fix anything inside `mobile/`.
  - Do not include `mobile/` in audit reports, release blockers, or defect registers.
  - Exclude `mobile/` from all test suites, CI checks, and release checklists.

**Important:** The `/mobile` directory being deprecated does not mean mobile browser experiences can be ignored. Both `user-web/` and `dash-web/` must follow the mobile-first UI/UX rules below.

## 2. Active Application Scope

- **`server/`**: Backend API built with Bun/Node.js, Express, MongoDB, Redis, and BullMQ.
- **`user-web/`**: Customer-facing web marketplace built with React, Vite, and static prerendering (SSG).
- **`dash-web/`**: Partner, Seller, Rider, and Admin operations dashboard built with React and Vite.
- **`docs/`**: Official architectural, API, and audit documentation.

## 3. CRITICAL: Mobile-First UI/UX — Always Mandatory

**Every UI/UX design, implementation, refactor, and responsive fix must follow a mobile-first approach. This rule is mandatory for every agent, every task, and every page.**

### 3.1 Mobile-First Design Process

- **Always design and implement the smallest supported mobile viewport first**, then progressively enhance the experience for tablet and desktop.
- Never design exclusively for desktop and attempt to squeeze the layout into mobile afterward.
- Before modifying a page, inspect its existing layout, components, design system, and responsive breakpoints.
- Use the existing project conventions, styling utilities, component library, and design tokens. Do not introduce a competing design system unnecessarily.
- Preserve existing functionality, business logic, and visual identity unless the task explicitly requests a change.
- When a task is limited to functionality or bug fixes, do not redesign unrelated UI elements.

### 3.2 Responsive Layout Requirements

- Build layouts that adapt naturally to mobile, tablet, laptop, and large desktop screens.
- Prefer flexible layouts, fluid sizing, responsive grids, and content-driven widths over fixed dimensions that cause overflow.
- Avoid unnecessary horizontal scrolling, clipped content, overlapping elements, and layouts that break at intermediate screen sizes.
- Ensure long text, product titles, prices, forms, tables, cards, dialogs, and navigation elements remain usable on small screens.
- Use responsive spacing and typography that maintain readability without wasting limited mobile screen space.
- Keep primary actions visible, accessible, and easy to reach on touch devices.
- Account for mobile browser safe areas and fixed or sticky headers, footers, bottom navigation, and action bars. Content must not be hidden behind them.
- Use sticky positioning only when it improves the user experience. Verify that sticky elements do not overlap content, forms, keyboards, or one another.
- Avoid hover-only interactions. Every important action must also work with touch and keyboard input.
- Ensure interactive elements have comfortable touch targets and sufficient spacing to prevent accidental taps.
- Handle loading, empty, error, success, and disabled states at mobile sizes as well as desktop sizes.

### 3.3 Navigation and Module Consistency

- Preserve the correct navigation context across routes and product verticals.
- Clothing pages must display the appropriate Clothing navigation; Jewellery pages must display the appropriate Jewellery navigation.
- Responsive navigation must remain consistent when navigating to product details, checkout, profiles, order history, or other nested pages.
- Test direct URLs, refreshes, browser back/forward navigation, and module switching on mobile-sized viewports.
- Do not hardcode a navigation bar for an individual page when the correct module can be determined using the existing routing and application architecture.

### 3.4 Mobile-First Design Workflow

For every UI-related task:

1. Inspect the existing page, shared components, layout system, and responsive conventions.
2. Identify the smallest supported mobile viewport and the primary user journey.
3. Implement the mobile layout first.
4. Progressively enhance the layout for tablet and desktop using the existing breakpoints.
5. Verify that all actions, navigation, forms, content, and fixed/sticky elements work at each size.
6. Check neighboring pages and shared components for responsive regressions.
7. Compare the result with the original design requirements and preserve the established theme.

Do not automatically redesign a page simply because it could look different. Follow the requested scope and reuse existing patterns.

### 3.5 Mandatory Responsive Verification

For UI changes, test the affected screens at representative viewport sizes, including:

- **Small mobile:** 320–360 CSS pixels.
- **Standard mobile:** 375–430 CSS pixels.
- **Tablet:** approximately 768 CSS pixels.
- **Desktop:** approximately 1280 CSS pixels or wider.

Use the actual supported browser and test setup available in the repository. These viewport sizes are verification targets, not a requirement to introduce arbitrary new breakpoints.

Verify:

- No unintended horizontal overflow.
- No clipped, overlapping, or hidden content.
- Correct bottom navigation and sticky action positioning.
- Functional touch interactions and keyboard accessibility.
- Responsive product grids, forms, tables, dialogs, and navigation.
- Correct Clothing/Jewellery module context.
- No major visual or functional regressions at larger viewport sizes.

If browser automation is available, automate critical responsive checks. If a viewport or browser cannot be tested, report it as unverified rather than claiming success.

**Definition of done:** A UI task is not complete merely because it looks correct on desktop. The mobile experience must work correctly first, and tablet/desktop layouts must remain functional.

## 4. Mandatory Development & Release Rules

- **No Automated Git Commits or Pushes:** Never run `git commit` or `git push`. The user personally reviews, stages, commits, and pushes all changes.
- **Apply the Ponytail Minimalism Ladder:** Reuse existing utilities, use the smallest working diff, and avoid premature abstractions or redundant dependencies.
- **Verification Integrity:** Always verify changes with real commands, such as `bun test` and `bun run build`, when applicable. Never fabricate test outcomes.
- **Safe Local Testing:** Do not trigger live payment charges, destructive database operations, or unauthorized production changes.
- **Preserve Existing Architecture:** Follow the repository's established module structure and conventions. Avoid unnecessary dependencies, duplicate components, and unrelated refactors.
- **Audit Before Editing:** For substantial changes, inspect the existing implementation and produce a concise plan before editing. Then execute the requested work unless essential information or authorization is missing.
- **Report Honestly:** Clearly distinguish passed tests, failed tests, and checks that could not be executed. Never claim that an application is fully verified without evidence.
