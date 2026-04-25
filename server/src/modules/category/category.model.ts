// category.model.ts
import { Schema, Types, model, type SchemaOptions } from "mongoose";

const baseOptions: SchemaOptions = { timestamps: true, versionKey: false };

// 🌳 CATEGORY TREE
const CategorySchema = new Schema({
    name: { type: String, required: true, index: true },
    slug: { type: String, unique: true },

    parentId: { type: Types.ObjectId, ref: "Category", default: null },
    level: { type: Number, default: 0 },

    icon: String,
    image: {
        type: String,
        required: [true, "Category image is required"],
    },
    imagePublicId: {
        type: String,
        required: [true, "Image public ID is required"],
    },


    isActive: { type: Boolean, default: true },
}, baseOptions);


// 🧩 ATTRIBUTES
const CategoryAttributeSchema = new Schema({
    categoryId: {
        type: Types.ObjectId,
        ref: "Category",
        index: true,
    },

    name: { type: String, required: true }, // fabric

    type: {
        type: String,
        enum: ["text", "number", "select", "boolean"],
        required: true,
    },

    required: { type: Boolean, default: false },

    options: [String], // for select

    isFilterable: { type: Boolean, default: true },

    isVariant: { type: Boolean, default: false }, // 🔥 size/color

    // 🔥 ADVANCED FIELDS (Future Proofing)
    group: { type: String, enum: ["BASIC", "ADVANCED"], default: "BASIC" },
    showInList: { type: Boolean, default: true },
    searchable: { type: Boolean, default: true },
}, baseOptions);


// 🚀 INDEXES
CategorySchema.index({ parentId: 1 });

export const Category = model("Category", CategorySchema);
export const CategoryAttribute = model("CategoryAttribute", CategoryAttributeSchema);