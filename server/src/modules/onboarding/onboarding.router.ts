import { Router } from "express";
import { OnboardingController } from "./onboarding.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { applyOnboardingSchema, reviewApplicationSchema } from "./onboarding.schema";
import { upload } from "../../middlewares/multer.middleware";

const router = Router();

// User routes
router.use(verifyJWT);
router.post("/apply", validate(applyOnboardingSchema), OnboardingController.apply);
router.get("/my-applications", OnboardingController.getMyApplications);
router.get("/status", OnboardingController.getStatus);
router.post("/documents", upload.array("documents", 5), OnboardingController.uploadDocuments);

// Admin routes
router.get("/admin/applications", isAdmin, OnboardingController.getAllApplications);
router.patch(
  "/admin/applications/:applicationId/review",
  isAdmin,
  validate(reviewApplicationSchema),
  OnboardingController.reviewApplication
);

export default router;
