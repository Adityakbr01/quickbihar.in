import { Product } from "./product.model";
import type { CreateProductBody, UpdateProductBody } from "./product.validation";

export class ProductDAO {
    static async create(data: any) {
        return await Product.create(data);
    }

    static async findAll(query: any = {}, options: { skip?: number; limit?: number } = {}) {
        const { skip = 0, limit = 10 } = options;

        const finalQuery: any = { isDeleted: false };

        // 1. Hande Text Search
        if (query.search) {
            finalQuery.$text = { $search: query.search };
        }

        // 2. Handle Filters
        if (query.isActive !== undefined) {
            finalQuery.isActive = query.isActive === "true" || query.isActive === true;
        }

        if (query.category) {
            finalQuery.category = query.category;
        }

        if (query.brand) {
            finalQuery.brand = { $regex: new RegExp(query.brand, "i") };
        }

        if (query.minPrice || query.maxPrice) {
            finalQuery.price = {};
            if (query.minPrice) finalQuery.price.$gte = Number(query.minPrice);
            if (query.maxPrice) finalQuery.price.$lte = Number(query.maxPrice);
        }

        // Feature flags
        if (query.isTrending) finalQuery.isTrending = true;
        if (query.isFeatured) finalQuery.isFeatured = true;
        if (query.isNewArrival) finalQuery.isNewArrival = true;

        // 3. Handle Sorting
        let sortOption: any = { createdAt: -1 };
        if (query.search) {
            sortOption = { score: { $meta: "textScore" } };
        } else if (query.sortBy) {
            switch (query.sortBy) {
                case "price_low": sortOption = { price: 1 }; break;
                case "price_high": sortOption = { price: -1 }; break;
                case "rating": sortOption = { "ratings.average": -1 }; break;
                case "newest": sortOption = { createdAt: -1 }; break;
                case "oldest": sortOption = { createdAt: 1 }; break;
            }
        }

        const data = await Product.find(finalQuery)
            .sort(sortOption)
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
        return await Product.findOne({ _id: id, isDeleted: false })
            .populate("refundPolicy")
            .populate("sizeChartId");
    }

    static async findBySlug(slug: string) {
        return await Product.findOne({ slug, isDeleted: false })
            .populate("refundPolicy")
            .populate("sizeChartId");
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

    static async deductStock(productId: string, sku: string, quantity: number) {
        return await Product.findOneAndUpdate(
            {
                _id: productId,
                "variants.sku": sku,
                "variants.stock": { $gte: quantity }, // ATOMIC SAFETY CHECK
                totalStock: { $gte: quantity }        // ATOMIC SAFETY CHECK
            },
            {
                $inc: {
                    "variants.$[elem].stock": -quantity,
                    totalStock: -quantity
                }
            },
            {
                arrayFilters: [{ "elem.sku": sku }],
                returnDocument: 'after',
                runValidators: true
            }
        );
    }
    static async restoreStock(productId: string, sku: string, quantity: number) {
        return await Product.findOneAndUpdate(
            {
                _id: productId,
                "variants.sku": sku,
            },
            {
                $inc: {
                    "variants.$[elem].stock": quantity,
                    totalStock: quantity
                }
            },
            {
                arrayFilters: [{ "elem.sku": sku }],
                returnDocument: 'after',
                runValidators: true
            }
        );
    }
}
