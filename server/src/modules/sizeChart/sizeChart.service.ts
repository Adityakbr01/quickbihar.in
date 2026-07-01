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
 * Fetch all active and approved size charts.
 */
export async function getAllCharts() {
    return await SizeChartDAO.findAll({
        isActive: true,
        $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }],
    });
}

/**
 * Retrieve a specific size chart by ID.
 */
export async function getChartById(id: string) {
    return await SizeChartDAO.findById(id);
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
