# Archived Documentation

> **Archived on:** 2026-09-04
> **Reason:** These documents pre-date the auth-redesign (Phases 1-4) and the order-state-machine change (Phase 9). They contain now-obsolete references to the email/mobile-OTP login, the old `finalizeConfirmedOrder` function name, the SMSLocal/SMS gateway integration, and other systems that have been replaced. They are preserved here as a historical record — **do not link to them from current documentation, and do not treat them as accurate**.

The current, code-aligned documentation lives in [`../developers-docs/`](../developers-docs/README.md).

---

## What was archived and why

### Top-level (4 files)

| File | Archived from | Last updated | Why it's stale |
|------|---------------|--------------|----------------|
| `ARCHITECTURE_AND_FLOWS.md` | `docs/` | 2026-07-04 | High-level product/architecture/rider/return flows. The delivery-OTP mentions are still in the system (Phase 9 moved them earlier in the flow), but the auth module map and surface descriptions pre-date the Google-OAuth cutover. Useful as a product-overview reference; the technical flow details have been superseded. |
| `LAUNCH_READINESS.md` | `docs/` | 2026-07-04 | "Last reviewed" predates both the auth redesign and Phase 9. Almost certainly stale on auth, orders, and any feature shipped after July 2026. |
| `TRD.md` | `docs/` | 2026-07-29 | Predates the auth redesign. Readiness ratings no longer match reality. |
| `WIRE-FLOW-AUDIT-TODO.md` | `docs/` | 2026-08-02 | All items marked DONE as of 2026-08-02. Historical record of the wire-flow audit. Minor name drift (mentions `finalizeConfirmedOrder`, now `finalizePendingConfirmation`; `useVerifyOTP` no longer exists) but the audit findings themselves are settled. |

### Dated snapshot — `2026-08-09/` (6 files)

These are all from a one-time audit on 2026-08-09. The audit was performed **before** the auth redesign and Phase 9 shipped. The flags it raises (e.g. "no SMS gateway for OTP", "OTP logged to console only") are no longer applicable — those systems were replaced entirely.

| File | Why it's stale |
|------|----------------|
| `BUGS_AND_ISSUES_REPORT.md` | Top critical bug is "Missing SMS Gateway for Mobile OTP Authentication". The entire mobile-OTP system was removed in Phases 1-4. The "bug" is now moot. |
| `END_TO_END_TESTING_GUIDE.md` | Extensive OTP testing scenarios throughout. The auth-OTP scenarios are no longer applicable. Delivery-OTP scenarios are still relevant but live elsewhere. |
| `FULL_APPLICATION_AUDIT_REPORT.md` | Flags "no SMS gateway", "OTP logged to console", and a handful of issues that were addressed in Phases 1-4. |
| `PRODUCTION_E2E_TESTING_GUIDE.md` | Similar — Phase 7 (Rider Acceptance, Pickup & OTP Verification) is still mostly valid (delivery OTPs are real); the rest of the OTP-touching sections are stale. |
| `PRODUCTION_READINESS_REPORT.md` | "Mobile SMS Gateway missing" was the headline blocker. No longer applicable. |
| `SMSLOCAL_SETUP.md` | **Entirely stale.** This is a how-to for SMSLocal OTP integration. OTP was removed in Phases 1-4; SMSLocal is no longer used. |

---

## When to look here

- **Never for product/architecture decisions.** Use `docs/developers-docs/` instead.
- **Only for historical context** — e.g. "when was the auth redesign shipped?", "what was the state of the system on 2026-08-09?", "what bugs did the August audit find?". The answers are in here; the question of "what's the current state" is not.
- **Don't link to these from `docs/developers-docs/`.** If you need a reference from a current doc, link to the new doc or to source code.

## How to restore

If for any reason a file from this archive needs to be promoted back to the active tree:

1. `git mv` the file from `docs/archive/<path>` to its original location (or a new location if the original is no longer the right home).
2. Audit the content against the current code — every claim must be re-verified.
3. Update the cross-references in any current docs that need to point at it.
4. Update the developers-docs `README.md` index to mention the restored doc.

Do **not** promote files from this archive without re-verification. They are stale by definition.
