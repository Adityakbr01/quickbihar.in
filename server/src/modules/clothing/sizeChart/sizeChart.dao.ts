/**
 * SizeChart Data Access Object.
 *
 * Provides direct data operations on the Mongoose SizeChart model.
 * All persistence is centralized here to keep services decoupled from Mongoose queries.
 */

import { SizeChart } from "./sizeChart.model";
import type { CreateSizeChartBody } from "./sizeChart.validation";

/* ── Exported DAO functions ── */

/**
 * Persist a new size chart.
 */
export async function create(data: CreateSizeChartBody) {
    return await SizeChart.create(data);
}

/**
 * Find all size charts matching a query, ordered by creation date descending.
 */
export async function findAll(query: any = {}) {
    return await SizeChart.find(query).sort({ createdAt: -1 });
}

/**
 * Retrieve a size chart by its database ID.
 */
export async function findById(id: string) {
    return await SizeChart.findById(id);
}

/**
 * Hard delete a size chart by its database ID.
 */
export async function deleteById(id: string) {
    return await SizeChart.findByIdAndDelete(id);
}

/**
 * Update a size chart by its ID and return the updated document.
 */
export async function updateById(id: string, data: Partial<CreateSizeChartBody>) {
    return await SizeChart.findByIdAndUpdate(id, data, { returnDocument: "after" });
}
