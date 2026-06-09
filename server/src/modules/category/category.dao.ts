import { Category } from "./category.model";
import type { CreateCategoryBody, UpdateCategoryBody } from "./category.validation";

export class CategoryDAO {
    static async create(data: CreateCategoryBody & { slug: string }) {
        return await Category.create(data);
    }

    static async findAll(query: any = {}) {
        const hasQuery = Object.keys(query || {}).length > 0;
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;
        const filter: any = {};

        if (query.search) {
            const searchRegex = new RegExp(String(query.search).trim(), "i");
            filter.$or = [
                { title: searchRegex },
                { slug: searchRegex },
                { description: searchRegex },
            ];
        }

        if (query.status === "active") filter.isActive = true;
        if (query.status === "inactive") filter.isActive = false;
        if (query.parentId) filter.parentId = query.parentId;

        const sortField = ["priority", "sortOrder", "title", "createdAt"].includes(query.sortBy)
            ? query.sortBy
            : "priority";
        const sortOrder = query.sortOrder === "asc" ? 1 : -1;

        if (!hasQuery) {
            return await Category.find(filter).populate("parentId", "title slug").sort({ priority: -1, title: 1 });
        }

        const [data, total] = await Promise.all([
            Category.find(filter)
                .populate("parentId", "title slug")
                .sort({ [sortField]: sortOrder, title: 1 })
                .skip(skip)
                .limit(limit),
            Category.countDocuments(filter),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
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
