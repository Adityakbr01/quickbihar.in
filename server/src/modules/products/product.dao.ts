import { Product } from "./product.model";
import type { CreateProductBody, UpdateProductBody } from "./product.validation";

export class ProductDAO {
    static async create(data: any) {
        return await Product.create(data);
    }

    static async findAll(query: any = {}, options: { skip?: number; limit?: number } = {}) {
        const { skip = 0, limit = 10 } = options;
        
        // Handle text search if provided
        let finalQuery = { ...query, isDeleted: false };
        if (query.search) {
            finalQuery = {
                ...finalQuery,
                $text: { $search: query.search }
            };
            delete (finalQuery as any).search;
        }

        const data = await Product.find(finalQuery)
            .sort(query.search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(finalQuery);

        return { data, total };
    }

    /* Used for sellers to fetch only their products */
    static async findBySellerId(sellerId: string) {
        return await Product.find({ sellerId, isDeleted: false }).sort({ createdAt: -1 });
    }

    static async findById(id: string) {
        return await Product.findOne({ _id: id, isDeleted: false });
    }

    static async findBySlug(slug: string) {
        return await Product.findOne({ slug, isDeleted: false });
    }

    static async updateById(id: string, data: any, options: any = { returnDocument: "after" }) {
        return await Product.findByIdAndUpdate(id, data, options);
    }

    static async softDeleteById(id: string) {
        return await Product.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: "after" });
    }

    /**
     * Find similar products based on category, tags, and brand.
     * Uses $or with regex for flexible matching.
     */
    static async findSimilar(
        productId: string,
        { category, tags, brand }: { category?: string; tags?: string[]; brand?: string },
        limit = 10
    ) {
        const orConditions: any[] = [];

        // Match by category (case-insensitive regex)
        if (category) {
            orConditions.push({ category: { $regex: new RegExp(category, "i") } });
        }

        // Match by any overlapping tag (case-insensitive regex)
        if (tags && tags.length > 0) {
            const tagPatterns = tags.map(tag => ({ tags: { $regex: new RegExp(tag.trim(), "i") } }));
            orConditions.push(...tagPatterns);
        }

        // Match by brand (case-insensitive regex)
        if (brand) {
            orConditions.push({ brand: { $regex: new RegExp(brand.trim(), "i") } });
        }

        if (orConditions.length === 0) return [];

        return await Product.find({
            _id: { $ne: productId },
            isDeleted: false,
            isActive: true,
            $or: orConditions,
        })
            .sort({ isTrending: -1, createdAt: -1 })
            .limit(limit);
    }
}
