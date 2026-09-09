/**
 * Public Content Express Routing.
 *
 * Storefront read access to admin-published content (plan §26 A3). All routes are
 * public, paginated/capped, and covered by the catalog rate-limit bucket.
 * NOTE: /posts/slug/:slug must precede any future /posts/:id route.
 */

import { Router } from "express";
import * as ContentController from "./content.controller";
import { publicCatalogRateLimiter } from "@/middlewares/rateLimit.middleware";

const router = Router();

router.get("/pages/slug/:slug", publicCatalogRateLimiter, ContentController.getPageBySlug);
router.get("/posts", publicCatalogRateLimiter, ContentController.listPosts);
router.get("/posts/slug/:slug", publicCatalogRateLimiter, ContentController.getPostBySlug);
router.get("/faqs", publicCatalogRateLimiter, ContentController.listFaqs);

export default router;
