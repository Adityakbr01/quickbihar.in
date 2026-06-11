import mongoose, { Schema, Types } from "mongoose";

const InventoryMovementSchema = new Schema(
    {
        sellerId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        storeId: {
            type: Types.ObjectId,
            ref: "Store",
            index: true,
        },
        productId: {
            type: Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        sku: {
            type: String,
            required: true,
            index: true,
        },
        variantLabel: String,
        movementType: {
            type: String,
            enum: ["IN", "OUT", "ADJUSTMENT", "ORDER", "RETURN"],
            default: "ADJUSTMENT",
            index: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        previousStock: {
            type: Number,
            required: true,
            min: 0,
        },
        newStock: {
            type: Number,
            required: true,
            min: 0,
        },
        reason: String,
        referenceType: String,
        referenceId: String,
        createdBy: {
            type: Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true, versionKey: false },
);

InventoryMovementSchema.index({ sellerId: 1, createdAt: -1 });
InventoryMovementSchema.index({ productId: 1, sku: 1, createdAt: -1 });

const SellerNotificationSchema = new Schema(
    {
        sellerId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["ORDER", "APPROVAL", "PAYOUT", "LOW_STOCK", "MALL", "SYSTEM"],
            default: "SYSTEM",
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        severity: {
            type: String,
            enum: ["INFO", "SUCCESS", "WARNING", "ERROR"],
            default: "INFO",
        },
        resourceType: String,
        resourceId: String,
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true, versionKey: false },
);

SellerNotificationSchema.index({ sellerId: 1, isRead: 1, createdAt: -1 });

const SellerEarningSchema = new Schema(
    {
        sellerId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        storeId: {
            type: Types.ObjectId,
            ref: "Store",
            index: true,
        },
        orderId: {
            type: String,
            required: true,
            index: true,
        },
        orderObjectId: {
            type: Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },
        subOrderObjectId: {
            type: Types.ObjectId,
            ref: "SubOrder",
        },
        subOrderId: {
            type: String,
            index: true,
        },
        idempotencyKey: {
            type: String,
        },
        productId: {
            type: Types.ObjectId,
            ref: "Product",
        },
        sku: {
            type: String,
        },
        quantity: {
            type: Number,
            min: 1,
        },
        grossAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        commissionAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        netAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["PENDING", "AVAILABLE", "PAID", "REVERSED"],
            default: "AVAILABLE",
            index: true,
        },
        creditedAt: Date,
        settlementSource: {
            type: String,
            enum: ["RIDER_DELIVERY", "ADMIN_DELIVERY", "BACKFILL", "LEGACY_ORDER"],
        },
        settlementNote: String,
        metadata: {
            type: Schema.Types.Mixed,
        },
        payoutId: {
            type: Types.ObjectId,
            ref: "AdminPayout",
        },
    },
    { timestamps: true, versionKey: false },
);

SellerEarningSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
SellerEarningSchema.index({ subOrderObjectId: 1 }, { unique: true, sparse: true });
SellerEarningSchema.index({ sellerId: 1, createdAt: -1 });

const SellerCategoryRequestSchema = new Schema(
    {
        sellerId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        storeId: {
            type: Types.ObjectId,
            ref: "Store",
            index: true,
        },
        currentPrimaryCategory: String,
        currentSubcategories: [String],
        requestedPrimaryCategory: {
            type: String,
            required: true,
        },
        requestedSubcategories: [String],
        message: String,
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
            index: true,
        },
        reviewedBy: {
            type: Types.ObjectId,
            ref: "User",
        },
        reviewedAt: Date,
        rejectionReason: String,
    },
    { timestamps: true, versionKey: false },
);

SellerCategoryRequestSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

export const InventoryMovement = mongoose.model("InventoryMovement", InventoryMovementSchema);
export const SellerNotification = mongoose.model("SellerNotification", SellerNotificationSchema);
export const SellerEarning = mongoose.model("SellerEarning", SellerEarningSchema);
export const SellerCategoryRequest = mongoose.model("SellerCategoryRequest", SellerCategoryRequestSchema);
