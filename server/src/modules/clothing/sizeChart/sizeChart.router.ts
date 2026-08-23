/**
 * SizeChart Express Routing.
 *
 * Exposes endpoints for managing size charts.
 */

import { Router } from "express";
import * as SizeChartController from "./sizeChart.controller";
import { verifyJWT, isAdmin } from "@/middlewares/auth.middleware";

const router = Router();

/* ── Public routes ── */
router.get("/", SizeChartController.getMyCharts);
router.get("/my", SizeChartController.getMyCharts);
router.get("/by-category/:category", SizeChartController.getChartByCategory);
router.get("/:id", SizeChartController.getChartById);

/* ── Admin routes ── */
router.post("/", verifyJWT, isAdmin, SizeChartController.createChart);
router.patch("/:id", verifyJWT, isAdmin, SizeChartController.updateChart);
router.delete("/:id", verifyJWT, isAdmin, SizeChartController.deleteChart);

export default router;
