import { Router } from "express";
import { SizeChartController } from "./sizeChart.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Public routes
router.get("/my", SizeChartController.getMyCharts);
router.get("/:id", SizeChartController.getChartById);

// Admin routes
router.post("/", verifyJWT, isAdmin, SizeChartController.createChart);
router.patch("/:id", verifyJWT, isAdmin, SizeChartController.updateChart);
router.delete("/:id", verifyJWT, isAdmin, SizeChartController.deleteChart);

export default router;
