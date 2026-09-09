import { Router } from "express";
import * as mallController from "./mall.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { publicCatalogRateLimiter } from "@/middlewares/rateLimit.middleware";

const router = Router();

router.get("/", publicCatalogRateLimiter, mallController.listPublic);
router.get("/top", publicCatalogRateLimiter, mallController.top);
// NOTE: /slug/:slug must precede /:id — otherwise ":id" swallows "slug" (plan §26 A2).
router.get("/slug/:slug", publicCatalogRateLimiter, mallController.getDetailBySlug);
router.get("/:id", publicCatalogRateLimiter, mallController.getDetail);
router.post("/:id/reviews", verifyJWT, mallController.postReview);

export default router;
