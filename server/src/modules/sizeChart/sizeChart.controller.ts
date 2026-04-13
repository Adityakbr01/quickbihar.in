import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { SizeChartService } from "./sizeChart.service";
import { ApiError } from "../../utils/ApiError";

export class SizeChartController {
    /**
     * @desc    Create a new size chart
     * @route   POST /api/v1/size-charts
     * @access  Admin
     */
    static createChart = asyncHandler(async (req: Request, res: Response) => {
        const chart = await SizeChartService.createChart(req.body);

        return res
            .status(201)
            .json(new ApiResponse(201, chart, "Size chart created successfully"));
    });

    /**
     * @desc    Get all size charts (for users/selection)
     * @route   GET /api/v1/size-charts/my
     * @access  Public
     */
    static getMyCharts = asyncHandler(async (req: Request, res: Response) => {
        const charts = await SizeChartService.getAllCharts();

        return res
            .status(200)
            .json(new ApiResponse(200, charts, "Size charts fetched successfully"));
    });

    /**
     * @desc    Get a specific size chart
     * @route   GET /api/v1/size-charts/:id
     * @access  Public
     */
    static getChartById = asyncHandler(async (req: Request, res: Response) => {
        const chart = await SizeChartService.getChartById(req.params.id as unknown as string);
        if (!chart) {
            throw new ApiError(404, "Size chart not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, chart, "Size chart fetched successfully"));
    });

    /**
     * @desc    Update a size chart
     * @route   PATCH /api/v1/size-charts/:id
     * @access  Admin
     */
    static updateChart = asyncHandler(async (req: Request, res: Response) => {
        const chart = await SizeChartService.updateChart(req.params.id as unknown as string, req.body);
        if (!chart) {
            throw new ApiError(404, "Size chart not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, chart, "Size chart updated successfully"));
    });

    /**
     * @desc    Delete a size chart
     * @route   DELETE /api/v1/size-charts/:id
     * @access  Admin
     */
    static deleteChart = asyncHandler(async (req: Request, res: Response) => {
        const chart = await SizeChartService.deleteChart(req.params.id as unknown as string);
        if (!chart) {
            throw new ApiError(404, "Size chart not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Size chart deleted successfully"));
    });
}
