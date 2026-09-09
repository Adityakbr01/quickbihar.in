/**
 * Category Express Routing.
 *
 * Exposes storefront public and administrative endpoints for category operations.
 */
import { Router } from "express";
import * as CategoryController from "./category.controller";
import { verifyJWT, isAdmin } from "@/middlewares/auth.middleware";
import { publicCatalogRateLimiter } from "@/middlewares/rateLimit.middleware";
import { upload } from "@/middlewares/multer.middleware";

const router = Router();

/* ── Public routes (120/min catalog bucket, plan §26 A7) ── */
router.get("/public", publicCatalogRateLimiter, CategoryController.getAllCategories);
// NOTE: /slug/:slug must precede /:id — otherwise ":id" swallows "slug" (plan §26 A1).
router.get("/slug/:slug", publicCatalogRateLimiter, CategoryController.getCategoryBySlug);
router.get("/:id", publicCatalogRateLimiter, CategoryController.getCategoryById);

/* ── Admin routes ── */
router.use(verifyJWT, isAdmin);

router.get("/", CategoryController.getAllCategoriesAdmin);
router.post("/", upload.single("image"), CategoryController.createCategory);
router.patch("/:id", upload.single("image"), CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;
