import { Router } from "express";
import * as newsletterController from "./newsletter.controller";

const router = Router();

// Public storefront signup — no auth required.
router.post("/subscribe", newsletterController.subscribe);

export default router;
