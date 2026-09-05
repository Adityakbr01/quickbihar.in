import { Router } from "express";
import * as onboardingController from "./onboarding.controller";
import { verifyJWT, isAdmin } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { applyOnboardingSchema, reviewApplicationSchema } from "./onboarding.schema";
import { upload } from "@/middlewares/multer.middleware";
import { onboardingRateLimiter } from "@/middlewares/rateLimit.middleware";

const router = Router();

// User routes
router.use(verifyJWT);
router.post("/apply", onboardingRateLimiter, validate(applyOnboardingSchema), onboardingController.apply);
router.get("/my-applications", onboardingController.getMyApplications);
router.get("/status", onboardingController.getStatus);
router.post("/documents", onboardingRateLimiter, upload.array("documents", 5), onboardingController.uploadDocuments);

// Admin routes
router.get("/admin/applications", isAdmin, onboardingController.getAllApplications);
router.patch(
  "/admin/applications/:applicationId/review",
  isAdmin,
  validate(reviewApplicationSchema),
  onboardingController.reviewApplication
);

export default router;
