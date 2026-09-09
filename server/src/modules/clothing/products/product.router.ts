/**
 * Product Express Routing.
 *
 * Exposes public and protected endpoints for managing fashion products.
 */

import { Router } from "express";
import * as ProductController from "./product.controller";
import * as ReviewController from "./review.controller";
import { verifyJWT, isSellerOrAdmin } from "@/middlewares/auth.middleware";
import { publicCatalogRateLimiter } from "@/middlewares/rateLimit.middleware";
import { upload } from "@/middlewares/multer.middleware";

const router = Router();

/* ── Public routes (generous 120/min catalog bucket for storefront + crawlers, plan §26 A7) ── */
router.get("/public", publicCatalogRateLimiter, ProductController.getPublicProducts);
router.get("/trending", publicCatalogRateLimiter, ProductController.getTrendingProducts);
router.get("/local", publicCatalogRateLimiter, ProductController.getLocalProducts);
router.get("/slug/:slug", publicCatalogRateLimiter, ProductController.getProductBySlug);
router.get("/:id/similar", publicCatalogRateLimiter, ProductController.getSimilarProducts);
router.get("/:id/reviews", publicCatalogRateLimiter, ReviewController.getProductReviews);
router.get("/:id", publicCatalogRateLimiter, ProductController.getProductById);

/* ── Authenticated User Review Actions ── */
router.post("/:id/reviews", verifyJWT, ReviewController.createProductReview);
router.post("/:id/reviews/:reviewId/helpful", verifyJWT, ReviewController.voteHelpfulReview);

/* ── Protected routes (Seller/Admin) ── */
router.use(verifyJWT);

// View products (Seller sees their own, Admin sees all)
router.get("/", isSellerOrAdmin, ProductController.getAllProducts);

// CRUD operations (Admin or Seller)
// Support up to 5 images per product
router.post("/", isSellerOrAdmin, upload.array("images", 5), ProductController.createProduct);
router.patch("/:id", isSellerOrAdmin, upload.array("images", 5), ProductController.updateProduct);
router.delete("/:id", isSellerOrAdmin, ProductController.deleteProduct);

export default router;
