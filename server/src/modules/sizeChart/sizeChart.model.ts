import mongoose, { Schema } from "mongoose";

const sizeChartRowSchema = new Schema(
    {
        size: { type: String, required: true },
    },
    { strict: false, _id: false } // allow dynamic fields (chest, length etc.)
);

const sizeChartSchema = new Schema(
    {
        name: { type: String, required: true },

        category: { type: String, required: true },

        unit: {
            type: String,
            enum: ["inches", "cm"],
            default: "inches",
        },

        fields: [{ type: String, required: true }],

        data: { type: [sizeChartRowSchema], required: true },

        howToMeasure: [String],

        scope: {
            type: String,
            enum: ["GLOBAL", "SELLER"],
            default: "GLOBAL",
            index: true,
        },
        sellerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: "Store",
            index: true,
        },
        productIds: [{
            type: Schema.Types.ObjectId,
            ref: "Product",
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
        approvalStatus: {
            type: String,
            enum: ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"],
            default: "APPROVED",
            index: true,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: Date,
        rejectionReason: String,
    },
    { timestamps: true }
);


sizeChartSchema.index({ name: 1, category: 1, sellerId: 1 }, { unique: true });

export const SizeChart = mongoose.model("SizeChart", sizeChartSchema);
