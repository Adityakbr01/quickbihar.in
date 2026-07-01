/**
 * Category Express Routing.
 *
 * Exposes storefront public and administrative endpoints for category operations.
 */
import { Router } from "express";
import * as CategoryController from "./category.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";

const router = Router();

/* ── Public routes ── */
router.get("/public", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategoryById);

/* ── Admin routes ── */
router.use(verifyJWT, isAdmin);

router.get("/", CategoryController.getAllCategoriesAdmin);
router.post("/", upload.single("image"), CategoryController.createCategory);
router.patch("/:id", upload.single("image"), CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;
