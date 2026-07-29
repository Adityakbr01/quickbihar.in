import mongoose, { Schema } from "mongoose";

const variantSchema = new Schema(
    {
        size: { type: String, required: true },
        color: { type: String, required: true },
        price: { type: Number },
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
        shortDescription: { type: String },

        brand: { type: String },

        category: { type: String, required: true },

        subCategory: { type: String },
        gender: { type: String, enum: ["Men", "Women", "Kids", "Unisex"], default: "Unisex" },

        price: { type: Number, required: true },

        originalPrice: { type: Number, required: true },

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
            index: true,
        },

        storeId: {
            type: Schema.Types.ObjectId,
            ref: "Store",
            required: true,
            index: true,
        },

        scope: {
            type: String,
            enum: ["GLOBAL", "SELLER"],
            default: "GLOBAL",
            index: true,
        },

        variants: { type: [variantSchema], required: true },

        totalStock: { type: Number, default: 0 },

        ratings: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },

        sizeChartId: {
            type: Schema.Types.ObjectId,
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

        seo: {
            metaTitle: String,
            metaDescription: String,
            keywords: [String],
        },

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

        policyRefs: {
            returnPolicy: { type: Schema.Types.ObjectId, ref: "RefundPolicy" },
            refundPolicy: { type: Schema.Types.ObjectId, ref: "RefundPolicy" },
            shippingPolicy: { type: Schema.Types.ObjectId, ref: "RefundPolicy" },
            termsPolicy: { type: Schema.Types.ObjectId, ref: "RefundPolicy" },
        },

        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },

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

productSchema.virtual("discountLabel").get(function () {
    if (this.discountPercentage && this.discountPercentage > 0) {
        return `${Math.round(this.discountPercentage)}% OFF`;
    }
    return null;
});

productSchema.index({ title: "text", description: "text", tags: "text" });

productSchema.pre("validate", async function () {
    if (this.isNew || !this.details?.sku) {
        const brandPart = (this.brand || "QB").toUpperCase().replace(/\s+/g, "").substring(0, 3);
        const catPart = (this.category || "PRD").toUpperCase().replace(/\s+/g, "").substring(0, 3);
        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        if (!this.details) this.details = {};
        this.details.sku = `${brandPart}-${catPart}-${randomPart}`;
    }

    if (this.isModified("price") || this.isModified("originalPrice")) {
        if (this.originalPrice && this.originalPrice > this.price) {
            this.discountPercentage = ((this.originalPrice - this.price) / this.originalPrice) * 100;
        } else {
            this.discountPercentage = 0;
        }
    }

    if (this.isModified("variants")) {
        this.totalStock = this.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);

        this.variants.forEach(variant => {
            const size = variant.size.toUpperCase().replace(/\s+/g, "");
            const color = variant.color.toUpperCase().replace(/\s+/g, "");
            const expectedSku = `${this.details?.sku}-${size}-${color}`;
            if (!variant.sku || variant.sku !== expectedSku) {
                variant.sku = expectedSku;
            }
        });
    }
});

export const Product = mongoose.model("Product", productSchema);
