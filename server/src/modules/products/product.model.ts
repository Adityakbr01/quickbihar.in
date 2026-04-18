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

        isGstApplicable: { type: Boolean, default: false },

        gstPercentage: { type: Number, default: 0 },

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
            material: String,
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
            isCodAvailable: { type: Boolean, default: true },
            estimatedDays: { type: Number, default: 3 },
            returnPolicy: { type: String, default: "7 days easy return" },
        },

        compliance: {
            manufacturerDetail: String,
            packerDetail: String,
            countryOfOrigin: { type: String, default: "India" },
        },

        logistics: {
            pickupLocation: String,
            warehouseName: String,
            latitude: Number,
            longitude: Number,
        },

        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },

        refundPolicy: {
            type: Schema.Types.ObjectId,
            ref: "RefundPolicy",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for formatted discount string (e.g., "45% OFF")
productSchema.virtual("discountLabel").get(function () {
    if (this.discountPercentage && this.discountPercentage > 0) {
        return `${Math.round(this.discountPercentage)}% OFF`;
    }
    return null;
});

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

    // Calculate Discount Percentage
    if (this.isModified("price") || this.isModified("originalPrice")) {
        if (this.originalPrice && this.originalPrice > this.price) {
            this.discountPercentage = ((this.originalPrice - this.price) / this.originalPrice) * 100;
        } else {
            this.discountPercentage = 0;
        }
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