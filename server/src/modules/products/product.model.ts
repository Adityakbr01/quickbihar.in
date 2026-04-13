import mongoose, { Schema } from "mongoose";

const variantSchema = new Schema(
    {
        size: { type: String, required: true },
        color: { type: String, required: true },
        stock: { type: Number, required: true },
        sku: { type: String, required: true },
    },
    { _id: false }
);

const productSchema = new Schema(
    {
        title: { type: String, required: true },

        slug: { type: String, required: true, unique: true },

        description: { type: String },

        brand: { type: String },

        category: { type: String, required: true },

        subCategory: { type: String },

        price: { type: Number, required: true },

        originalPrice: { type: Number },

        discountPercentage: { type: Number },

        currency: { type: String, default: "INR" },

        images: [{
            url: { type: String, required: true },
            fileId: { type: String, required: true }
        }],

        sellerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        variants: { type: [variantSchema], required: true },

        totalStock: { type: Number, required: true },

        ratings: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },

        sizeChartId: {
            type: String, // ya ObjectId (better)
            ref: "SizeChart",
        },

        details: {
            fit: String,
            pattern: String,
            collar: String,
            sleeve: String,
            washCare: String,
            sku: String,
        },

        tags: [String],

        isFeatured: { type: Boolean, default: false },
        isTrending: { type: Boolean, default: false },
        isNewArrival: { type: Boolean, default: false },

        deliveryInfo: {
            isExpressAvailable: { type: Boolean, default: false },
            estimatedDays: { type: Number, default: 3 },
        },

        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);


productSchema.index({ title: "text", description: "text", tags: "text" });

// Auto calculate totalStock
productSchema.pre("save", async function () {
    if (this.isModified("variants")) {
        this.totalStock = this.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }
});

export const Product = mongoose.model("Product", productSchema);