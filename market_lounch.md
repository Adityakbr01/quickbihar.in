# QuickBihar — Full Production Readiness Audit, Automated Testing, Remediation & Launch Certification

## 1. Your Role

Act as a complete senior engineering and quality-assurance team consisting of:

- Principal Software Architect
- Senior Bun/Node.js Backend Engineer
- Senior React/Vite Frontend Engineer
- React Native/Expo Engineer, where applicable
- QA Automation Engineer
- Security Engineer
- Database and Distributed Systems Engineer
- DevOps/SRE Engineer
- E-commerce Payment Integration Specialist
- Performance and Accessibility Engineer
- Production Release Manager

Your mission is to audit, test, repair, and re-test the entire QuickBihar application until it meets a defensible production-readiness standard.

Do not perform a superficial code review. Execute real tests, inspect actual code paths, identify defects, implement appropriate fixes, and verify the fixes with repeatable evidence.

**The final deliverable must be a complete production-readiness report with a GO, CONDITIONAL GO, or NO-GO decision.**

A successful build alone is not proof that an application is ready for launch.

## 2. Product Context

QuickBihar is a hyperlocal e-commerce marketplace that connects customers with local sellers and malls.

Known project context includes:

- Customer-facing mobile and web application built with React Native and Expo.
- Separate web applications for administration and seller operations.
- Rider functionality and delivery workflows.
- A backend using Bun/Node.js, Express-compatible APIs, and TypeScript where configured.
- MongoDB for application data.
- Redis and BullMQ for background jobs and notifications, where configured.
- Firebase Admin SDK, where used by the actual implementation.
- Razorpay payment integration.
- Product categories or verticals such as clothing, jewellery, and food.
- Seller management, orders, payment processing, delivery assignment, and notifications.

These are discovery hints, not permission to assume the repository still matches this architecture. Inspect the actual codebase, manifests, environment configuration, deployment definitions, and runtime behavior before deciding what exists.

QuickBihar is a hyperlocal marketplace, not a restaurant-only application. Audit the actual product and all supported verticals without assuming a single-store business model.

## 3. Operating Rules

Follow these rules throughout the engagement:

1. Audit the repository before making changes.
2. Build a verified map of every application, service, database, queue, and external integration.
3. Use the project's existing package manager and lockfiles.
4. Never blindly replace dependencies, frameworks, configuration, or architecture.
5. Do not install redundant testing packages when suitable tooling already exists.
6. Make changes in small, traceable batches.
7. Run targeted tests after each meaningful fix.
8. Run relevant regression tests after every change.
9. Re-run failed tests and distinguish product defects from infrastructure or test-environment failures.
10. Never weaken security, remove assertions, skip tests, or modify expected results merely to make a test pass.
11. Never use real customer data, production credentials, real payment transactions, or destructive production operations for testing.
12. Do not expose secrets, access tokens, OTPs, payment credentials, or sensitive personal information in logs or reports.
13. Do not claim that a test passed unless it actually executed and passed.
14. Do not claim a system is secure, scalable, or launch-ready without sufficient evidence.
15. Do not deploy, change production settings, execute production migrations, or perform irreversible external actions without explicit approval.

You are authorized to inspect the repository, add appropriate test infrastructure, repair application code, and update tests in a controlled development environment. Before destructive changes, major architecture changes, or external service configuration changes, explain the impact and request approval.

If access, credentials, infrastructure, or external services are unavailable, complete all safe local work and document the remaining verification requirements.

---

## 4. Master Phase Execution & Verification Register (Audit Status: COMPLETED)

- [x] **PHASE 1: Repository Discovery and Architecture Audit** — [docs/audit/ARCHITECTURE_AUDIT.md](file:///c:/Users/ADITYA/Desktop/quickbihar.in/docs/audit/ARCHITECTURE_AUDIT.md) (VERIFIED)
- [x] **PHASE 2: Build a Complete Business Flow Inventory** — Customer, Seller, Rider, Admin & Cross-role flows verified (VERIFIED)
- [x] **PHASE 3: Testing Stack and Package Audit** — [docs/audit/TESTING_STACK.md](file:///c:/Users/ADITYA/Desktop/quickbihar.in/docs/audit/TESTING_STACK.md) (VERIFIED)
- [x] **PHASE 4: Implement a Repeatable Automated Test Suite** — 83/83 Bun tests pass, [docs/audit/TEST_COVERAGE_MATRIX.md](file:///c:/Users/ADITYA/Desktop/quickbihar.in/docs/audit/TEST_COVERAGE_MATRIX.md) (VERIFIED)
- [x] **PHASE 5: Payments, Orders, Database and Background Jobs** — Constant-time signatures, BullMQ shutdown, Razorpay MCP (VERIFIED)
- [x] **PHASE 6: Security Audit** — [docs/audit/SECURITY_AUDIT.md](file:///c:/Users/ADITYA/Desktop/quickbihar.in/docs/audit/SECURITY_AUDIT.md) (VERIFIED)
- [x] **PHASE 7: Performance, Reliability and Accessibility** — 96 SSG pages, gzip+brotli precompression, [docs/audit/LOAD_TEST_REPORT.md](file:///c:/Users/ADITYA/Desktop/quickbihar.in/docs/audit/LOAD_TEST_REPORT.md) (VERIFIED)
- [x] **PHASE 8: Environment and Deployment Readiness** — 5 Docker containers running healthy, Cloudflare Tunnel active (VERIFIED)
- [x] **PHASE 9: Fix Every Confirmed Issue** — DEF-001 through DEF-012 documented and repaired, [docs/audit/DEFECT_REGISTER.md](file:///c:/Users/ADITYA/Desktop/quickbihar.in/docs/audit/DEFECT_REGISTER.md) (VERIFIED)
- [x] **PHASE 10: Mandatory Fix and Re-Audit Loop** — All apps compile with 0 typecheck and 0 lint errors (VERIFIED)
- [x] **PHASE 11: Final Independent Verification** — Live orders `QB-2656393532` & `QB-1711718606` verified via Razorpay Remote MCP & Tunnel (VERIFIED)
- [x] **PHASE 12: Required Final Deliverables** — All 8 audit documents in `docs/audit/` complete (VERIFIED)
- [x] **PHASE 13: Production Launch Decision** — Decision: **CONDITIONAL GO**, [docs/audit/PRODUCTION_READINESS_REPORT.md](file:///c:/Users/ADITYA/Desktop/quickbihar.in/docs/audit/PRODUCTION_READINESS_REPORT.md) (VERIFIED)

---

# PHASE 1 — Repository Discovery and Architecture Audit [STATUS: ✅ DONE]

## 1.1 Discover every application

Inspect the root directory and every relevant nested project.

Identify:

- Customer web application.
- Customer mobile application.
- Admin dashboard.
- Seller dashboard.
- Rider application or interface.
- Backend API.
- Background workers.
- Notification workers.
- Scheduled jobs and polling loops.
- Shared packages and reusable modules.
- Database models and migrations, if applicable.
- Infrastructure and deployment configuration.
- CI/CD workflows.
- Existing testing and monitoring infrastructure.

Do not assume every directory is an independent deployable application.

For each application, document:

- Purpose.
- Runtime and framework.
- Entry point.
- Package manager.
- Build command.
- Development command.
- Type-check command.
- Lint command.
- Test command.
- Production start command.
- Required environment variables.
- External dependencies.
- Deployment target.
- Dependencies on other applications.

Inspect all relevant package manifests, lockfiles, TypeScript configurations, bundler configurations, Dockerfiles, CI workflows, and environment examples.

Create a verified application and dependency map.

## 1.2 Identify existing defects

Inspect for:

- Broken imports and unresolved modules.
- Incorrect TypeScript types.
- Unsafe type assertions.
- Missing error handling.
- Dead code and unreachable branches.
- Incorrect API URLs.
- Inconsistent request and response contracts.
- Missing validation.
- Incorrect environment handling.
- Incomplete loading, empty, and error states.
- Duplicate business logic.
- Inconsistent database access patterns.
- Race conditions and concurrency issues.
- Missing transaction or consistency safeguards.
- Unhandled asynchronous operations.
- Incorrect authentication or authorization.
- Stale frontend state.
- Missing cleanup of subscriptions, listeners, and timers.
- Incorrect pagination, filtering, sorting, and search.
- Missing tests for important business rules.

Classify each finding by severity, confidence, evidence, and business impact.

Do not begin a large refactor before understanding the existing architecture.

## Deliverable

Create:

`docs/audit/ARCHITECTURE_AUDIT.md`

Include the verified system map, important dependencies, architectural risks, and missing information.

---

# PHASE 2 — Build a Complete Business Flow Inventory

Audit every user role and its end-to-end workflows.

## 2.1 Customer workflows

Test all implemented and supported flows, including:

- Application loading and initial navigation.
- Registration and login.
- Google authentication, if implemented.
- Session persistence and logout.
- Account details and profile updates.
- Mobile number verification, where required.
- Address creation, editing, selection, and deletion.
- Delivery-location and serviceability checks.
- Product categories and browsing.
- Product details, images, variants, and stock.
- Search, filters, and sorting.
- Cart additions, updates, and removals.
- Cart persistence and price recalculation.
- Seller-specific product availability.
- Checkout validation.
- Delivery fee calculations.
- Coupons and discounts, if implemented.
- Prepaid payment through Razorpay.
- COD eligibility and placement.
- Payment failure, cancellation, and retry.
- Order confirmation and order history.
- Order tracking and status updates.
- Order cancellation and refunds, where supported.
- Notifications and contact information.
- Empty states, expired sessions, offline behavior, and API errors.

For every flow, verify both the frontend behavior and the backend business rules.

## 2.2 Seller workflows

Test:

- Seller registration and authentication.
- Seller verification and approval.
- Profile, store, and business details.
- Seller activation, suspension, and access restrictions.
- Product creation, editing, publishing, and deletion.
- Product images and media upload.
- Product categories and supported verticals.
- Price, inventory, availability, and variants.
- Order notifications.
- Order acceptance and rejection.
- Order processing and fulfilment.
- Cancellation handling.
- COD and prepaid order handling.
- Seller-specific delivery restrictions.
- Sales and order history.
- Earnings, commissions, and settlement records, where implemented.
- Unauthorized access to other sellers' products or orders.

Verify that sellers can access only the resources and actions permitted to their accounts.

## 2.3 Rider workflows

Test all implemented rider functionality, including:

- Rider registration and verification.
- Authentication and account status.
- Availability and online/offline status.
- Location updates and permission handling.
- Delivery assignment and matching.
- Assignment acceptance and rejection.
- Assignment expiry and reassignment.
- Pickup confirmation.
- Delivery status transitions.
- Customer contact and delivery instructions.
- Proof of delivery, where implemented.
- COD collection and reconciliation, if applicable.
- Failed delivery and return workflows.
- Duplicate assignment prevention.
- Rider earnings and delivery history, where implemented.

Test the matching engine and polling loops under realistic local conditions.

Verify that riders cannot access unrelated customer information, sellers' private data, or other riders' assignments.

Do not assume a feature exists if it is not implemented.

## 2.4 Admin and super-admin workflows

Audit all implemented administrative capabilities:

- Admin authentication and session management.
- Role and permission management.
- Customer management.
- Seller onboarding, approval, suspension, and rejection.
- Rider management and verification.
- Product moderation.
- Category and product-vertical management.
- Order inspection and intervention.
- Payment and refund management.
- COD restrictions and eligibility.
- Delivery configuration.
- Banners, content, and application configuration, where implemented.
- Notification management.
- Reports, analytics, and exports.
- Audit logs.
- Pagination, search, and filtering.
- Unauthorized administrative actions.
- Access separation between ordinary admins and super-admins.

Check that sensitive operations are authorized by the backend, not merely hidden in the frontend.

## 2.5 Cross-role workflows

Test complete journeys across multiple applications.

Examples:

1. Admin approves a seller → seller publishes a product → customer purchases it → seller receives the order.
2. Customer places an eligible COD order → seller accepts → rider is assigned → delivery is completed → COD records are updated.
3. Customer completes prepaid checkout → payment is verified → order is confirmed → seller fulfils it.
4. Seller rejects an order → the customer sees the correct status → applicable refund or cancellation processing is triggered.
5. Rider becomes unavailable → assignment is safely reassigned, if the business rules permit it.
6. Admin suspends a seller → restricted seller actions are rejected by the backend.

Adapt these scenarios to the actual business rules. Document any workflow that is missing, incomplete, or impossible to complete.

---

# PHASE 3 — Testing Stack and Package Audit

First inspect which tools are already installed. Choose a compatible, minimal testing stack.

Do not install every package listed below indiscriminately.

## 3.1 Bun backend testing

Prefer Bun's native test runner when the backend runs under Bun.

Official documentation:

https://bun.sh/docs/test

Evaluate the need for:

- `bun:test` for unit and integration tests.
- `supertest` for HTTP endpoint tests if compatible with the actual server setup.
- Native `fetch` against an isolated test server if that is simpler and more reliable.
- `msw` for mocking external HTTP requests where appropriate.
- MongoDB integration testing using a dedicated disposable test database.
- Redis integration tests using an isolated test instance.
- Fake timers and deterministic fixtures for queue workers and polling loops.

Test:

- API routes.
- Request validation.
- Service and business logic.
- Authentication and authorization middleware.
- Database operations.
- Background jobs.
- Queue retries.
- Idempotency.
- Error handling.
- Payment verification.
- Webhook processing.
- Concurrent operations.

Do not mock the database in every test. Include genuine integration tests for critical database and transactional behavior.

Use the existing production runtime and compatible APIs wherever practical.

## 3.2 React/Vite frontend testing

Evaluate these tools for the actual React application:

- `vitest` for unit and component tests.
- `@testing-library/react` for rendering and interacting with components.
- `@testing-library/user-event` for realistic user interactions.
- `@testing-library/jest-dom` for DOM assertions.
- `jsdom` or another compatible browser-like test environment.
- `msw` for deterministic API mocking.
- `@playwright/test` for browser-based end-to-end tests.
- `@axe-core/playwright` or an equivalent accessibility-testing integration.

Official documentation:

- Vitest: https://vitest.dev/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Playwright: https://playwright.dev/docs/intro
- MSW: https://mswjs.io/docs/

Choose the minimum set that provides meaningful coverage.

Test actual rendered behavior, not only implementation details.

Cover:

- Forms and validation.
- Loading, error, empty, and success states.
- Authentication and role-specific navigation.
- API failure handling.
- Product and cart interactions.
- Checkout and payment states.
- Address selection.
- COD eligibility messages.
- Order status updates.
- Responsive layouts.
- Keyboard navigation.
- Accessibility.
- Browser console errors.
- Failed network requests.

## 3.3 React Native and Expo testing

If the repository contains the customer mobile app or other Expo applications, audit them separately.

Evaluate:

- `jest-expo`.
- `@testing-library/react-native`.
- Compatible mocking and API-testing tools.
- Expo-specific build and validation commands.

Test mobile navigation, forms, authentication, permissions, offline states, and mobile-specific integrations.

Do not assume web tests validate native mobile behavior.

## 3.4 Additional quality and security tools

Inspect whether the project benefits from:

- ESLint.
- TypeScript strict type checking.
- Dependency vulnerability auditing.
- Secret scanning.
- Static application security analysis.
- API contract validation.
- `k6` for load testing.
- Lighthouse for web performance.
- Automated accessibility checks.

Use existing compatible tooling first. Document any new dependency and why it is necessary.

Do not mix npm, Bun, pnpm, or Yarn lockfiles casually. Follow the repository's actual package-manager conventions.

## Deliverable

Create:

`docs/audit/TESTING_STACK.md`

Document the selected packages, compatibility, commands, test environments, and any tooling gaps.

---

# PHASE 4 — Implement a Repeatable Automated Test Suite

Add or repair the test infrastructure required for the discovered applications.

Create consistent commands for the actual repositories, such as:

- Unit tests.
- Integration tests.
- End-to-end tests.
- Type checking.
- Linting.
- Production builds.
- Security checks.
- Performance checks.

Use the appropriate commands for each package manager and framework.

Do not invent package scripts without verifying that their commands work.

## 4.1 Backend tests

Cover:

- Happy paths.
- Invalid requests.
- Missing and expired authentication.
- Insufficient permissions.
- Malformed input.
- Database errors.
- Duplicate requests.
- Concurrent updates.
- Invalid state transitions.
- External service timeouts.
- Queue retry behavior.
- Idempotency and webhook retries.

## 4.2 Frontend tests

Cover:

- Critical components and hooks.
- Form validation.
- API integration states.
- Role-specific access.
- Cart and checkout calculations.
- Address flows.
- Payment outcomes.
- COD eligibility presentation.
- Order state transitions.
- Error recovery.
- Accessibility.

## 4.3 End-to-end tests

Use Playwright for browser workflows where appropriate.

Run against a dedicated test environment with controlled fixtures and deterministic dependencies.

Test real interactions across frontend and backend where feasible.

Do not substitute a successful mocked payment screen for genuine verification of payment processing and order integrity.

For payment testing, use Razorpay's supported test environment and test credentials only.

## 4.4 Test data management

Create reproducible fixtures for:

- Customers.
- Sellers.
- Riders.
- Admins and super-admins.
- Products and stock.
- Addresses and serviceable locations.
- Orders.
- Payments.
- COD eligibility.
- Delivery assignments.

Tests must not depend on manually created data, execution order, or an uncontrolled shared database.

Provide safe setup and teardown procedures.

---

# PHASE 5 — Payments, Orders, Database and Background Jobs

This is a critical section. A working user interface is insufficient if orders or payments become inconsistent.

## 5.1 Razorpay

Audit:

- Server-side order creation.
- Correct amount and currency.
- Payment signature verification.
- Webhook signature verification.
- Webhook event deduplication.
- Payment authorization and capture semantics.
- Failed and cancelled payments.
- Retry behavior.
- Refund processing.
- Idempotent state transitions.
- Order creation after successful payment.
- Recovery when payment succeeds but order persistence fails.

Use supported test-mode payment scenarios. Never expose live secrets or perform unapproved real charges.

## 5.2 MongoDB

Inspect:

- Schema validation.
- Required fields.
- Unique constraints.
- Indexes and query performance.
- Referential integrity.
- Inventory consistency.
- Concurrent order creation.
- Atomic updates.
- Transactions where appropriate and supported.
- Migration and data-integrity risks.

Test race conditions and duplicate submissions.

Do not assume that MongoDB transactions are available in every deployment topology; verify the actual configuration.

## 5.3 Redis and BullMQ

Where present, test:

- Queue connectivity.
- Job creation and processing.
- Retries and backoff.
- Duplicate job handling.
- Failed jobs.
- Worker restarts.
- Job timeouts.
- Graceful shutdown.
- Stuck-job recovery.
- Idempotent notification delivery.
- Correct behavior when Redis is unavailable.

## 5.4 Rider matching and polling

If implemented, test:

- Concurrent matching workers.
- Duplicate assignment prevention.
- Expired assignments.
- Rider availability changes.
- Timeouts and retries.
- Database consistency.
- Recovery after worker restart.

Use controlled clocks and deterministic fixtures where necessary.

---

# PHASE 6 — Security Audit

Conduct a security review of all exposed applications and backend endpoints.

Check:

- Authentication bypass.
- Broken access control.
- IDOR vulnerabilities.
- Horizontal and vertical privilege escalation.
- Missing role enforcement.
- Unsafe object updates.
- Input validation failures.
- NoSQL injection.
- XSS and unsafe rendering.
- CSRF where applicable.
- CORS misconfiguration.
- Rate limiting.
- Brute-force protection.
- Session and token security.
- Insecure file uploads.
- Path traversal.
- SSRF where relevant.
- Sensitive information leakage.
- Secrets in source code or build output.
- Unsafe logging.
- Insecure webhook handling.
- Payment manipulation.
- Inadequate authorization for seller, rider, admin, and super-admin actions.

Verify authorization on the backend even if the frontend hides restricted controls.

Run suitable dependency audits using the repository's actual package manager. For example, evaluate `bun audit` or the applicable npm audit command only after confirming tool support and repository compatibility.

Review findings manually; do not treat every scanner warning as a confirmed exploitable vulnerability.

Classify findings as Critical, High, Medium, Low, or Informational with supporting evidence.

Fix confirmed vulnerabilities and re-test them.

Never test against systems you do not own or have permission to assess.

---

# PHASE 7 — Performance, Reliability and Accessibility

## 7.1 Frontend performance

Measure the production build, not only the development server.

Check:

- JavaScript bundle size.
- Large dependencies.
- Route-level code splitting.
- Image optimization.
- Lazy loading.
- Unnecessary re-renders.
- API request waterfalls.
- Caching.
- Core Web Vitals where measurable.
- Mobile responsiveness.
- Slow-network behavior.

Use Lighthouse or equivalent tooling and record actual results.

## 7.2 Backend performance

Check:

- Slow database queries.
- Missing indexes.
- N+1 queries.
- Excessive API payloads.
- Unbounded list endpoints.
- Inefficient pagination.
- Blocking work in request handlers.
- Memory leaks.
- Uncontrolled concurrency.
- Redis and queue bottlenecks.
- External API timeouts.

Use load tests with a controlled test environment and documented assumptions.

Define a realistic load profile from available business data. If traffic estimates are unavailable, explicitly state the chosen test assumptions and their limitations.

Never claim production-scale capacity based on a small smoke test.

## 7.3 Accessibility

Audit:

- Semantic HTML.
- Keyboard navigation.
- Focus management.
- Form labels and validation messages.
- Color contrast.
- Accessible dialogs.
- Screen-reader behavior.
- Mobile interaction targets.

Fix meaningful accessibility defects in critical flows.

---

# PHASE 8 — Environment and Deployment Readiness

Audit the actual deployment configuration for:

- Development, staging, and production environment separation.
- Environment variable validation.
- Secret management.
- Frontend and backend URL configuration.
- CORS.
- DNS and TLS assumptions.
- Database connectivity.
- Redis connectivity.
- Firebase configuration, where used.
- Razorpay test/live mode separation.
- File and image storage.
- Background worker deployment.
- Health and readiness checks.
- Logging and monitoring.
- Graceful shutdown.
- Error reporting.
- Database backup and restore procedures.
- CI/CD reliability.
- Rollback strategy.
- Database migration safety.

Verify that frontend builds do not contain private backend secrets.

Test production builds locally or in staging without deploying them to production.

Do not claim backups work merely because a backup configuration exists. Verify restoration using an isolated test environment where possible.

---

# PHASE 9 — Fix Every Confirmed Issue

After the initial audit, create a prioritized defect register.

For each issue, record:

- Unique ID.
- Severity.
- Affected application.
- File and function.
- Evidence.
- Customer or business impact.
- Root cause.
- Proposed fix.
- Dependencies.
- Regression tests required.
- Status.

Prioritize:

1. Critical security and payment integrity issues.
2. Authentication and authorization failures.
3. Broken checkout, order, and delivery flows.
4. Data corruption and concurrency defects.
5. High-impact application crashes.
6. Reliability and deployment blockers.
7. Performance and accessibility defects.
8. Lower-impact usability and maintainability issues.

For each confirmed defect:

1. Reproduce it where possible.
2. Capture the failure.
3. Identify the root cause.
4. Implement the smallest safe fix.
5. Add a regression test.
6. Run the targeted test.
7. Run related integration tests.
8. Run broader regression tests.
9. Record the result.

Do not hide failures by weakening assertions or skipping tests.

If a defect cannot be safely fixed, explain why, identify the required decision or access, and provide the exact next step.

---

# PHASE 10 — Mandatory Fix and Re-Audit Loop

Do not stop after the first test run.

Use this loop:

1. Audit the current state.
2. Execute the available tests.
3. Record failures and missing coverage.
4. Prioritize defects by severity and dependencies.
5. Fix a controlled batch of defects.
6. Run targeted regression tests.
7. Run all affected application tests.
8. Run cross-role end-to-end tests.
9. Re-run security checks relevant to the changes.
10. Re-run production builds.
11. Update the defect register.
12. Repeat until the release criteria are satisfied or remaining blockers require external action or approval.

A test that fails because the environment is unavailable must be classified as BLOCKED, not PASSED.

When new failures appear, determine whether they are regressions, previously undiscovered defects, flaky tests, or environmental failures.

Do not report completion merely because the maximum number of iterations has been reached.

If progress is blocked, produce a clear partial report and list exactly what is required to continue.

---

# PHASE 11 — Final Independent Verification

After the fixes, perform a fresh audit rather than relying only on previously passing tests.

Re-check:

- Repository structure and dependencies.
- TypeScript and lint results.
- Backend unit and integration tests.
- Frontend component tests.
- End-to-end customer flows.
- Seller workflows.
- Rider workflows.
- Admin and super-admin workflows.
- Cross-role business journeys.
- Razorpay payment integrity.
- COD restrictions.
- Database consistency.
- Queue and worker behavior.
- Security findings.
- Performance measurements.
- Accessibility.
- Production builds.
- Deployment configuration.
- Monitoring and recovery procedures.

Run the final verification from a clean, documented test environment where possible.

Preserve test logs, reports, commands, and timestamps. Redact sensitive values.

If you cannot execute a test, mark it NOT RUN or BLOCKED and explain why.

---

# PHASE 12 — Required Final Deliverables

Create the following documentation inside the repository:

## 1. `docs/audit/PRODUCTION_READINESS_REPORT.md`

Include:

- Executive summary.
- Verified architecture.
- All applications and services discovered.
- Business-flow audit.
- Test strategy and tooling.
- Initial defects.
- Fixes implemented.
- Before-and-after test results.
- Security findings.
- Performance results.
- Accessibility results.
- Payment and COD verification.
- Deployment readiness.
- Remaining blockers.
- External dependencies and decisions required.
- Final launch recommendation.

## 2. `docs/audit/DEFECT_REGISTER.md`

List every discovered defect, severity, root cause, fix, test evidence, and final status.

## 3. `docs/audit/TEST_COVERAGE_MATRIX.md`

Map each role, business flow, API, and critical component to its tests and execution status.

## 4. `docs/audit/SECURITY_AUDIT.md`

Document confirmed vulnerabilities, remediation, verification evidence, and unresolved security risks.

## 5. `docs/audit/LOAD_TEST_REPORT.md`

Include the workload, environment, duration, concurrency, throughput, latency percentiles, error rate, bottlenecks, and limitations.

Do not invent measurements if load testing was not possible.

## 6. `docs/audit/RELEASE_CHECKLIST.md`

Include a practical release checklist covering environment variables, payment configuration, database backups, migrations, monitoring, rollback, smoke tests, and launch-day verification.

## 7. Repeatable test commands

Provide documented commands for each application and the complete available test suite.

Ensure these commands correspond to real scripts and working tooling.

---

# PHASE 13 — Production Launch Decision

Use exactly one overall decision:

### GO

Use only when all defined critical release gates pass, no unresolved release-blocking security or payment issues remain, critical user journeys have verified evidence, and operational readiness has been established.

### CONDITIONAL GO

Use only when the remaining issues are explicitly understood, non-critical, and accepted by the authorized decision-maker, with documented mitigations and owners. Never use this status to conceal untested critical flows.

### NO-GO

Use when critical flows fail, critical security or payment defects remain, data integrity is at risk, or essential production-readiness requirements have not been verified.

The report must include:

- Final decision.
- Evidence supporting the decision.
- Tests executed and passed.
- Tests failed, blocked, or not run.
- Remaining defects by severity.
- Outstanding account or infrastructure requirements.
- Required human approvals.
- Exact next actions before launch.

**Do not declare the application fully launch-ready just because all available automated tests pass.** Automated tests cannot prove every production risk is absent.

## FIRST ACTION

Start with repository discovery and the initial audit.

Identify all applications, establish the correct test commands, run safe baseline checks, and produce the initial architecture and defect reports.

Then begin the fix-and-retest cycle in the development environment.

Do not deploy to production, perform destructive production operations, or initiate real financial transactions.

Work toward verified launch readiness and produce the final reports. If a critical decision, external credential, merchant activation, or infrastructure change requires my involvement, ask me specifically rather than guessing.