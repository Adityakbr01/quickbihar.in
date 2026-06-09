import mongoose, { Schema, Types } from "mongoose";

const seoSchema = new Schema(
    {
        metaTitle: String,
        metaDescription: String,
        keywords: [String],
    },
    { _id: false },
);

const addressSchema = new Schema(
    {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: "India" },
    },
    { _id: false },
);

const contactSchema = new Schema(
    {
        name: String,
        phone: String,
        email: String,
    },
    { _id: false },
);

const publishStatus = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const cmsPageSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        excerpt: String,
        content: { type: String, required: true },
        status: { type: String, enum: publishStatus, default: "DRAFT", index: true },
        isActive: { type: Boolean, default: true, index: true },
        sortOrder: { type: Number, default: 0 },
        seo: seoSchema,
        publishedAt: Date,
        createdBy: { type: Types.ObjectId, ref: "User" },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

cmsPageSchema.index({ title: "text", content: "text", excerpt: "text" });

const faqSchema = new Schema(
    {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true },
        category: { type: String, default: "General", trim: true, index: true },
        sortOrder: { type: Number, default: 0 },
        status: { type: String, enum: publishStatus, default: "PUBLISHED", index: true },
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Types.ObjectId, ref: "User" },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

faqSchema.index({ question: "text", answer: "text", category: "text" });

const blogPostSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        excerpt: String,
        content: { type: String, required: true },
        coverImageUrl: String,
        tags: [String],
        status: { type: String, enum: publishStatus, default: "DRAFT", index: true },
        isActive: { type: Boolean, default: true, index: true },
        isFeatured: { type: Boolean, default: false, index: true },
        seo: seoSchema,
        publishedAt: Date,
        authorId: { type: Types.ObjectId, ref: "User" },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

blogPostSchema.index({ title: "text", content: "text", excerpt: "text", tags: "text" });

const announcementSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true },
        channel: {
            type: String,
            enum: ["IN_APP", "PUSH", "EMAIL", "SMS"],
            default: "IN_APP",
            index: true,
        },
        audience: {
            type: String,
            enum: ["ALL", "USERS", "SELLERS", "DELIVERY"],
            default: "ALL",
            index: true,
        },
        status: {
            type: String,
            enum: ["DRAFT", "SCHEDULED", "SENT", "ARCHIVED"],
            default: "DRAFT",
            index: true,
        },
        startsAt: Date,
        endsAt: Date,
        sentAt: Date,
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Types.ObjectId, ref: "User" },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

announcementSchema.index({ title: "text", message: "text" });

const flashSaleSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: String,
        productIds: [{ type: Types.ObjectId, ref: "Product" }],
        discountType: {
            type: String,
            enum: ["PERCENTAGE", "FIXED"],
            default: "PERCENTAGE",
        },
        discountValue: { type: Number, required: true, min: 0 },
        startsAt: { type: Date, required: true, index: true },
        endsAt: { type: Date, required: true, index: true },
        status: {
            type: String,
            enum: ["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"],
            default: "DRAFT",
            index: true,
        },
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Types.ObjectId, ref: "User" },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

flashSaleSchema.index({ name: "text", description: "text" });

const warehouseSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        address: addressSchema,
        contact: contactSchema,
        serviceAreas: [String],
        capacity: Number,
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Types.ObjectId, ref: "User" },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

warehouseSchema.index({ name: "text", code: "text", serviceAreas: "text" });

const shippingProviderSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        type: {
            type: String,
            enum: ["MANUAL", "COURIER", "HYPERLOCAL", "AGGREGATOR"],
            default: "MANUAL",
        },
        serviceAreas: [String],
        config: { type: Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Types.ObjectId, ref: "User" },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

shippingProviderSchema.index({ name: "text", code: "text", serviceAreas: "text" });

const activityLogSchema = new Schema(
    {
        actorId: { type: Types.ObjectId, ref: "User", index: true },
        actorRole: String,
        action: { type: String, required: true, index: true },
        resourceType: { type: String, required: true, index: true },
        resourceId: String,
        message: String,
        severity: {
            type: String,
            enum: ["INFO", "WARNING", "ERROR"],
            default: "INFO",
            index: true,
        },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, versionKey: false },
);

activityLogSchema.index({ createdAt: -1 });

const auditLogSchema = new Schema(
    {
        actorId: { type: Types.ObjectId, ref: "User", index: true },
        action: { type: String, required: true, index: true },
        resourceType: { type: String, required: true, index: true },
        resourceId: String,
        before: { type: Schema.Types.Mixed },
        after: { type: Schema.Types.Mixed },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, versionKey: false },
);

auditLogSchema.index({ createdAt: -1 });

const adminSystemConfigSchema = new Schema(
    {
        api: { type: Schema.Types.Mixed, default: {} },
        payment: { type: Schema.Types.Mixed, default: {} },
        smtp: { type: Schema.Types.Mixed, default: {} },
        backup: { type: Schema.Types.Mixed, default: {} },
        updatedBy: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true, versionKey: false },
);

const backupJobSchema = new Schema(
    {
        name: { type: String, required: true },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "RESTORED"],
            default: "PENDING",
            index: true,
        },
        collections: [String],
        snapshot: { type: Schema.Types.Mixed, default: {} },
        dryRunResult: { type: Schema.Types.Mixed },
        error: String,
        createdBy: { type: Types.ObjectId, ref: "User" },
        restoredBy: { type: Types.ObjectId, ref: "User" },
        restoredAt: Date,
    },
    { timestamps: true, versionKey: false },
);

backupJobSchema.index({ createdAt: -1 });

export const CMSPage = mongoose.model("CMSPage", cmsPageSchema);
export const FAQ = mongoose.model("FAQ", faqSchema);
export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
export const Announcement = mongoose.model("Announcement", announcementSchema);
export const FlashSale = mongoose.model("FlashSale", flashSaleSchema);
export const Warehouse = mongoose.model("Warehouse", warehouseSchema);
export const ShippingProvider = mongoose.model("ShippingProvider", shippingProviderSchema);
export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export const AdminSystemConfig = mongoose.model("AdminSystemConfig", adminSystemConfigSchema);
export const BackupJob = mongoose.model("BackupJob", backupJobSchema);
