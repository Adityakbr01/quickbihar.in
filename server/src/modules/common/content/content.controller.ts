/**
 * Public Content HTTP Controllers.
 *
 * Thin asyncHandler wrappers over `content.service.ts` — response shape and
 * cache headers only. All gating lives in the service layer.
 */

import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import * as ContentService from "./content.service";

/* ── Exported Controller Handlers ── */

/** Handle GET /pages/slug/:slug - Published CMS page (public cache 5min). */
export const getPageBySlug = asyncHandler(async (req: Request, res: Response) => {
    const page = await ContentService.getPublishedPageBySlug(req.params.slug as string);
    res.set("Cache-Control", "public, max-age=300");
    return res.status(200).json(new ApiResponse(200, page, "Page fetched successfully"));
});

/** Handle GET /posts - Published blog list (public cache 5min). */
export const listPosts = asyncHandler(async (req: Request, res: Response) => {
    const posts = await ContentService.listPublishedPosts(Number(req.query.limit) || 20);
    res.set("Cache-Control", "public, max-age=300");
    return res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"));
});

/** Handle GET /posts/slug/:slug - Published blog post (public cache 5min). */
export const getPostBySlug = asyncHandler(async (req: Request, res: Response) => {
    const post = await ContentService.getPublishedPostBySlug(req.params.slug as string);
    res.set("Cache-Control", "public, max-age=300");
    return res.status(200).json(new ApiResponse(200, post, "Post fetched successfully"));
});

/** Handle GET /faqs - Published FAQs, optional ?category (public cache 5min). */
export const listFaqs = asyncHandler(async (req: Request, res: Response) => {
    const faqs = await ContentService.listPublishedFaqs(req.query.category as string | undefined);
    res.set("Cache-Control", "public, max-age=300");
    return res.status(200).json(new ApiResponse(200, faqs, "FAQs fetched successfully"));
});
