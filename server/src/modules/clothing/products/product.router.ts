/**
 * Product Express Routing.
 *
 * Exposes public and protected endpoints for managing fashion products.
 */

import { Router } from "express";
import * as ProductController from "./product.controller";
import * as ReviewController from "./review.controller";
import { verifyJWT, isSellerOrAdmin } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";

const router = Router();

/* ── Public routes ── */
router.get("/public", ProductController.getPublicProducts);
router.get("/trending", ProductController.getTrendingProducts);
router.get("/local", ProductController.getLocalProducts);
router.get("/slug/:slug", ProductController.getProductBySlug);
router.get("/:id/similar", ProductController.getSimilarProducts);
router.get("/:id/reviews", ReviewController.getProductReviews);
router.get("/:id", ProductController.getProductById);

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
