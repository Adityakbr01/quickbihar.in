/**
 * SEO Sitemap & Robots HTTP Controllers.
 *
 * Serves storefront discovery files as XML/text with crawler-friendly caching.
 * Each handler owns response concerns only (content type, cache headers);
 * all query/gating logic lives in `seo.service.ts`.
 */

import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ENV } from "@/config/env.config";
import * as SeoService from "./seo.service";

/* ── Internal helpers ── */

/** Send an XML shard with a 1h public cache (sitemap refreshes as catalog changes). */
function sendXml(res: Response, xml: string): void {
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.status(200).send(xml);
}

/* ── Exported Controller Handlers ── */

/** Handle GET /sitemap.xml - Sitemap index referencing every shard. */
export const getSitemapIndex = asyncHandler(async (_req: Request, res: Response) => {
    sendXml(res, await SeoService.buildSitemapIndex());
});

/** Handle GET /sitemap-static.xml - Static hub URLs (always present). */
export const getStaticSitemap = asyncHandler(async (_req: Request, res: Response) => {
    sendXml(res, await SeoService.buildStaticSitemap());
});

/** Handle GET /sitemap-products.xml - Gated indexable product URLs. */
export const getProductsSitemap = asyncHandler(async (_req: Request, res: Response) => {
    sendXml(res, await SeoService.buildProductsSitemap());
});

/** Handle GET /sitemap-taxonomy.xml - Active category URLs. */
export const getTaxonomySitemap = asyncHandler(async (_req: Request, res: Response) => {
    sendXml(res, await SeoService.buildTaxonomySitemap());
});

/** Handle GET /sitemap-malls.xml - Approved mall URLs. */
export const getMallsSitemap = asyncHandler(async (_req: Request, res: Response) => {
    sendXml(res, await SeoService.buildMallsSitemap());
});

/** Handle GET /sitemap-locations.xml - Buxar district and block URLs. */
export const getLocationsSitemap = asyncHandler(async (_req: Request, res: Response) => {
    sendXml(res, await SeoService.buildLocationsSitemap());
});

/** Handle GET /robots.txt - Environment-aware crawler rules. */
export const getRobotsTxt = asyncHandler(async (_req: Request, res: Response) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.status(200).send(SeoService.buildRobotsTxt(ENV.NODE_ENV));
});
