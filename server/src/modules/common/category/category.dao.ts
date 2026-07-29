/**
 * Category data-access layer.
 *
 * Thin wrappers around the `Category` Mongoose model. Centralising every query here
 * (search/filter/pagination, slug lookups, soft toggles) keeps the service layer free
 * of Mongoose specifics so query shape changes stay contained to this file.
 */
import { Category } from "./category.model";
import type { CreateCategoryBody, UpdateCategoryBody } from "./category.validation";

/** Persist a new category (title already slugified by the service). */
export async function create(data: CreateCategoryBody & { slug: string }) {
    return await Category.create(data as any);
}

/**
 * Admin listing. With no query params returns the full priority-ordered list; once any
 * filter/pagination param is present it switches to a paginated, filtered, sortable response.
 */
export async function findAll(query: any = {}) {
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

/** Public-facing categories: active only, ordered by priority then title. */
export async function findActive() {
    return await Category.find({ isActive: true }).sort({ priority: -1, title: 1 });
}

/** Fetch a single category by id. */
export async function findById(id: string) {
    return await Category.findById(id);
}

/** Slug uniqueness lookup used before create. */
export async function findBySlug(slug: string) {
    return await Category.findOne({ slug });
}

/** Apply a partial update and return the fresh document. */
export async function updateById(id: string, data: UpdateCategoryBody & { slug?: string }) {
    return await Category.findByIdAndUpdate(id, data as any, { returnDocument: "after" });
}

/** Hard-delete a category. */
export async function deleteById(id: string) {
    return await Category.findByIdAndDelete(id);
}
