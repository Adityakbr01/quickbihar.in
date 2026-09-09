/**
 * Public Content Service (plan §26 A3).
 *
 * Read-only storefront views over admin-managed CMS pages, blog posts, and FAQs.
 * Only PUBLISHED + active documents are visible; drafts, archived items, and
 * internal audit fields (createdBy/updatedBy) never leave the server.
 */

import { ApiError } from "@/utils/ApiError";
import { BlogPost, CMSPage, FAQ } from "@/modules/common/admin/adminFull.model";

/* ── Internal helpers ── */

/** Fields safe to expose on a CMS page or blog post. */
const PUBLIC_PAGE_FIELDS =
    "title slug excerpt content coverImageUrl tags seo publishedAt updatedAt";

/** Lowercase-trim a slug param; throws 404 on empty input. */
function normalizeSlug(slug: unknown): string {
    const normalized = String(slug || "").toLowerCase().trim();
    if (!normalized) throw new ApiError(404, "Content not found");
    return normalized;
}

/* ── Exported service functions ── */

/** Fetch a PUBLISHED + active CMS page by slug or fail with 404. */
export async function getPublishedPageBySlug(slug: string) {
    const page = await CMSPage.findOne({
        slug: normalizeSlug(slug),
        status: "PUBLISHED",
        isActive: true,
    })
        .select(PUBLIC_PAGE_FIELDS)
        .lean();
    if (!page) throw new ApiError(404, "Page not found");
    return page;
}

/** List PUBLISHED + active blog posts, newest first (capped for crawlers/lists). */
export async function listPublishedPosts(limit = 20) {
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    return await BlogPost.find({ status: "PUBLISHED", isActive: true })
        .select(PUBLIC_PAGE_FIELDS)
        .sort({ publishedAt: -1, updatedAt: -1 })
        .limit(safeLimit)
        .lean();
}

/** Fetch a PUBLISHED + active blog post by slug or fail with 404. */
export async function getPublishedPostBySlug(slug: string) {
    const post = await BlogPost.findOne({
        slug: normalizeSlug(slug),
        status: "PUBLISHED",
        isActive: true,
    })
        .select(PUBLIC_PAGE_FIELDS)
        .lean();
    if (!post) throw new ApiError(404, "Post not found");
    return post;
}

/** List PUBLISHED + active FAQs, optionally filtered by category. */
export async function listPublishedFaqs(category?: string) {
    const filter: Record<string, unknown> = { status: "PUBLISHED", isActive: true };
    if (category && String(category).trim()) filter.category = String(category).trim();
    return await FAQ.find(filter)
        .select("question answer category sortOrder updatedAt")
        .sort({ sortOrder: 1, updatedAt: -1 })
        .limit(100)
        .lean();
}
