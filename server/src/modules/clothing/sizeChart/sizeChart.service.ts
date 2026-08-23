/**
 * SizeChart Business Logic Service.
 *
 * Implements logic for managing apparel measurements and size charts.
 * Delegating all persistence concerns to the SizeChart DAO layer.
 */

import * as SizeChartDAO from "./sizeChart.dao";
import type { CreateSizeChartBody } from "./sizeChart.validation";

/* ── Exported service functions ── */

/**
 * Validate and create a new size chart.
 */
export async function createChart(data: CreateSizeChartBody) {
    return await SizeChartDAO.create(data);
}

/**
 * Fetch all active and approved size charts with optional category or query filter.
 */
export async function getAllCharts(query: any = {}) {
    const filter: any = {
        isActive: true,
        $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }],
    };

    if (query.category) {
        filter.category = { $regex: new RegExp(`^${query.category.trim()}$`, "i") };
    }

    return await SizeChartDAO.findAll(filter);
}

/**
 * Retrieve a specific size chart by ID.
 */
export async function getChartById(id: string) {
    return await SizeChartDAO.findById(id);
}

/**
 * Retrieve a size chart by category.
 */
export async function getChartByCategory(category: string) {
    return await SizeChartDAO.findByCategory(category);
}

/**
 * Update properties of an existing size chart.
 */
export async function updateChart(id: string, data: Partial<CreateSizeChartBody>) {
    return await SizeChartDAO.updateById(id, data);
}

/**
 * Delete a size chart.
 */
export async function deleteChart(id: string) {
    return await SizeChartDAO.deleteById(id);
}
