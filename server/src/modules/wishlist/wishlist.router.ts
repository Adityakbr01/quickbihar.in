import { Router } from "express";
import { WishlistController } from "./wishlist.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/", WishlistController.getMyWishlist);
router.post("/toggle", WishlistController.toggleWishlist);
router.post("/sync", WishlistController.syncWishlist);
router.delete("/remove/:id", WishlistController.removeItem);

export default router;
