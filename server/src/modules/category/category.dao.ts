import { Category } from "./category.model";
import type { CreateCategoryBody, UpdateCategoryBody } from "./category.validation";

export class CategoryDAO {
    static async create(data: CreateCategoryBody & { slug: string }) {
        return await Category.create(data);
    }

    static async findAll() {
        return await Category.find().sort({ priority: -1, title: 1 });
    }

    static async findActive() {
        return await Category.find({ isActive: true }).sort({ priority: -1, title: 1 });
    }

    static async findById(id: string) {
        return await Category.findById(id);
    }

    static async findBySlug(slug: string) {
        return await Category.findOne({ slug });
    }

    static async updateById(id: string, data: UpdateCategoryBody & { slug?: string }) {
        return await Category.findByIdAndUpdate(id, data, { returnDocument: "after" });
    }

    static async deleteById(id: string) {
        return await Category.findByIdAndDelete(id);
    }
}
