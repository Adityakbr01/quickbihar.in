import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { labelService } from "./label.service";
import { ApiError } from "../../utils/ApiError";

/**
 * Generates a shipping label PDF for an order and streams it back to the client.
 * Delegates PDF construction to the label service and pipes the resulting
 * document straight to the HTTP response as a downloadable attachment.
 *
 * @route GET /api/v1/labels/:id
 * @access Protected (seller or admin)
 * @throws {ApiError} 400 if the order ID route param is missing.
 */
export const generateLabel = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!id) {
        throw new ApiError(400, "Order ID is required");
    }

    const doc = await labelService.generateShippingLabel(id);

    // Set response headers for PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=label_${id}.pdf`);

    // Stream PDF to response
    doc.pipe(res);
    doc.end();
});
