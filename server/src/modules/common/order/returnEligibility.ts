/**
 * Return-window eligibility.
 *
 * Pure helpers that decide whether a delivered sub-order is still within its
 * return window. Kept side-effect-free (the "current time" is always injected)
 * so the policy is trivially unit-testable and shared between the customer
 * return flow and any future admin/seller override checks.
 */

import { ApiError } from "@/utils/ApiError";

/** Fallback return window when no store/plan-specific value is configured. */
export const DEFAULT_RETURN_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Sub-order statuses that represent a completed delivery for return-window purposes. */
const DELIVERED_STATUSES = new Set(["DELIVERED", "COMPLETED"]);

/**
 * Resolves the delivery timestamp from a sub-order timeline: the latest event whose
 * status marks the order delivered/completed. Returns null when not yet delivered.
 */
export function deliveredAtFromTimeline(timeline?: Array<{ status?: string; timestamp?: Date | string }>): Date | null {
    if (!Array.isArray(timeline)) return null;
    let latest: Date | null = null;
    for (const event of timeline) {
        if (!event?.status || !DELIVERED_STATUSES.has(event.status)) continue;
        const at = event.timestamp ? new Date(event.timestamp) : null;
        if (at && !Number.isNaN(at.getTime()) && (!latest || at > latest)) latest = at;
    }
    return latest;
}

/** The last instant a return may be requested for an order delivered at `deliveredAt`. */
export function returnWindowDeadline(deliveredAt: Date, windowDays: number): Date {
    return new Date(deliveredAt.getTime() + windowDays * DAY_MS);
}

export interface ReturnWindowResult {
    eligible: boolean;
    windowDays: number;
    deadline: Date | null;
    reason?: string;
}

/**
 * Decides whether a return can still be requested.
 *
 * - Not yet delivered (`deliveredAt` null) → eligible; the window hasn't started.
 * - Delivered → eligible only if `now` is on/before the deadline.
 *
 * @param deliveredAt - When the order was delivered, or null if not delivered.
 * @param windowDays - Return window in days; non-positive falls back to the default.
 * @param now - The current time (injected for testability).
 */
export function checkReturnWindow(deliveredAt: Date | null, windowDays: number, now: Date): ReturnWindowResult {
    const days = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : DEFAULT_RETURN_WINDOW_DAYS;
    if (!deliveredAt) return { eligible: true, windowDays: days, deadline: null };

    const deadline = returnWindowDeadline(deliveredAt, days);
    const eligible = now.getTime() <= deadline.getTime();
    return {
        eligible,
        windowDays: days,
        deadline,
        reason: eligible ? undefined : `The ${days}-day return window closed on ${deadline.toDateString()}.`,
    };
}

/**
 * Throws a 400 {@link ApiError} when the return window has closed. No-op when the order
 * is not yet delivered or is still within the window.
 */
export function assertReturnWindowOpen(deliveredAt: Date | null, windowDays: number, now: Date): void {
    const result = checkReturnWindow(deliveredAt, windowDays, now);
    if (!result.eligible) {
        throw new ApiError(400, result.reason ?? "The return window for this order has closed.");
    }
}
