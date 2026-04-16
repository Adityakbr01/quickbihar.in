import { Router } from "express";
import { ProductController } from "./product.controller";
import { verifyJWT, isSellerOrAdmin } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";

const router = Router();

// Public routes
router.get("/public", ProductController.getPublicProducts);
router.get("/trending", ProductController.getTrendingProducts);
router.get("/slug/:slug", ProductController.getProductBySlug);
router.get("/:id", ProductController.getProductById);

// Protected routes (Seller/Admin)
router.use(verifyJWT);

// View products (Seller sees their own, Admin sees all)
router.get("/", isSellerOrAdmin, ProductController.getAllProducts);

// CRUD operations (Admin or Seller)
// Support up to 5 images per product
router.post("/", isSellerOrAdmin, upload.array("images", 5), ProductController.createProduct);
router.patch("/:id", isSellerOrAdmin, upload.array("images", 5), ProductController.updateProduct);
router.delete("/:id", isSellerOrAdmin, ProductController.deleteProduct);

export default router;
