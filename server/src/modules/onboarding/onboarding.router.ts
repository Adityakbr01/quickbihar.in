import { Router } from "express";
import { OnboardingController } from "./onboarding.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { applyOnboardingSchema, reviewApplicationSchema } from "./onboarding.schema";

const router = Router();

// User routes
router.use(verifyJWT);
router.post("/apply", validate(applyOnboardingSchema), OnboardingController.apply);
router.get("/my-applications", OnboardingController.getMyApplications);

// Admin routes
router.get("/admin/applications", isAdmin, OnboardingController.getAllApplications);
router.patch(
  "/admin/applications/:applicationId/review",
  isAdmin,
  validate(reviewApplicationSchema),
  OnboardingController.reviewApplication
);

export default router;
