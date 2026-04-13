import mongoose, { Schema } from "mongoose";

const variantSchema = new Schema(
    {
        size: { type: String, required: true },
        color: { type: String, required: true },
        stock: { type: Number, required: true },
        sku: { type: String },
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

        totalStock: { type: Number, default: 0 },

        ratings: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },

        sizeChartId: {
            type: Schema.Types.ObjectId, // ya ObjectId (better)
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

// Auto calculate totalStock and generate SKUs before validation
productSchema.pre("validate", async function () {
    // Generate Product Base SKU if not exists
    if (!this.details?.sku) {
        const brandPart = (this.brand || "QB").toUpperCase().replace(/\s+/g, "").substring(0, 3);
        const catPart = (this.category || "PRD").toUpperCase().replace(/\s+/g, "").substring(0, 3);
        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        if (!this.details) this.details = {};
        this.details.sku = `${brandPart}-${catPart}-${randomPart}`;
    }

    // Generate Variant SKUs
    if (this.isModified("variants")) {
        this.totalStock = this.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);

        this.variants.forEach(variant => {
            if (!variant.sku) {
                const size = variant.size.toUpperCase().replace(/\s+/g, "");
                const color = variant.color.toUpperCase().replace(/\s+/g, "");
                variant.sku = `${this.details?.sku}-${size}-${color}`;
            }
        });
    }
});

export const Product = mongoose.model("Product", productSchema);