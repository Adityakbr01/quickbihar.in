import { Router } from "express";
import { CartController } from "./cart.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/", CartController.getCart);
router.post("/add", CartController.addToCart);
router.post("/sync", CartController.syncCart);
router.patch("/update", CartController.updateQuantity);
router.delete("/remove/:sku", CartController.removeItem);
router.delete("/clear", CartController.clearCart);

export default router;
