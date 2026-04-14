import { asyncHandler } from "../../utils/asyncHandler";
import { labelService } from "./label.service";
import { ApiError } from "../../utils/ApiError";

export class LabelController {
    static generateLabel = asyncHandler(async (req, res) => {
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
}
