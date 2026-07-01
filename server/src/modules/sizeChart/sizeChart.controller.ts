/**
 * SizeChart HTTP Controller Handlers.
 *
 * Express handlers managing size chart HTTP lifecycle: requests validation,
 * responses shapes, status codes. All business logic is delegated to SizeChartService.
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as SizeChartService from "./sizeChart.service";
import { ApiError } from "../../utils/ApiError";

/* ── Exported Controller Handlers ── */

/**
 * Handle POST / - Create a new size chart.
 */
export const createChart = asyncHandler(async (req: Request, res: Response) => {
    const chart = await SizeChartService.createChart(req.body);
    return res
        .status(201)
        .json(new ApiResponse(201, chart, "Size chart created successfully"));
});

/**
 * Handle GET /my - Retrieve all active and approved size charts.
 */
export const getMyCharts = asyncHandler(async (req: Request, res: Response) => {
    const charts = await SizeChartService.getAllCharts();
    return res
        .status(200)
        .json(new ApiResponse(200, charts, "Size charts fetched successfully"));
});

/**
 * Handle GET /:id - Retrieve a specific size chart by database ID.
 */
export const getChartById = asyncHandler(async (req: Request, res: Response) => {
    const chart = await SizeChartService.getChartById(req.params.id as unknown as string);
    if (!chart) {
        throw new ApiError(404, "Size chart not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, chart, "Size chart fetched successfully"));
});

/**
 * Handle PATCH /:id - Update properties of a size chart.
 */
export const updateChart = asyncHandler(async (req: Request, res: Response) => {
    const chart = await SizeChartService.updateChart(req.params.id as unknown as string, req.body);
    if (!chart) {
        throw new ApiError(404, "Size chart not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, chart, "Size chart updated successfully"));
});

/**
 * Handle DELETE /:id - Hard delete a size chart.
 */
export const deleteChart = asyncHandler(async (req: Request, res: Response) => {
    const chart = await SizeChartService.deleteChart(req.params.id as unknown as string);
    if (!chart) {
        throw new ApiError(404, "Size chart not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Size chart deleted successfully"));
});
