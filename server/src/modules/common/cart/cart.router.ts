import { Router } from "express";
import * as cartController from "./cart.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.post("/sync", cartController.syncCart);
router.patch("/update", cartController.updateQuantity);
router.delete("/remove/:sku", cartController.removeItem);
router.delete("/clear", cartController.clearCart);

export default router;
