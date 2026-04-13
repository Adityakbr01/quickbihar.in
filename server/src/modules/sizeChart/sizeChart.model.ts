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
    },
    { timestamps: true }
);

export const SizeChart = mongoose.model("SizeChart", sizeChartSchema);