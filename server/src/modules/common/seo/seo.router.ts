/**
 * SEO Sitemap & Robots Express Routing.
 *
 * Mounted at the server ROOT (not /api/v1) so crawlers find the conventional
 * /sitemap.xml and /robots.txt paths. All responses are public, cacheable,
 * and covered by the sitemap rate-limit bucket (plan §26 A7).
 */

import { Router } from "express";
import * as SeoController from "./seo.controller";
import { seoSitemapRateLimiter } from "@/middlewares/rateLimit.middleware";

const router = Router();

router.get("/sitemap.xml", seoSitemapRateLimiter, SeoController.getSitemapIndex);
router.get("/sitemap-static.xml", seoSitemapRateLimiter, SeoController.getStaticSitemap);
router.get("/sitemap-products.xml", seoSitemapRateLimiter, SeoController.getProductsSitemap);
router.get("/sitemap-taxonomy.xml", seoSitemapRateLimiter, SeoController.getTaxonomySitemap);
router.get("/sitemap-malls.xml", seoSitemapRateLimiter, SeoController.getMallsSitemap);
router.get("/robots.txt", seoSitemapRateLimiter, SeoController.getRobotsTxt);

export default router;
