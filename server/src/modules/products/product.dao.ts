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

        if (query.approvalStatus) {
            finalQuery.approvalStatus = query.approvalStatus;
        }

        if (query.publicOnly === true || query.publicOnly === "true") {
            finalQuery.$and = [
                ...(finalQuery.$and || []),
                { $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }] },
            ];
        }

        if (query.sellerId) {
            finalQuery.sellerId = query.sellerId;
        }

        if (query.storeId) {
            finalQuery.storeId = query.storeId;
        }

        if (query.category) {
            finalQuery.category = query.category;
        }

        if (query.subCategory) {
            finalQuery.subCategory = query.subCategory;
        }

        if (query.gender) {
            if (Array.isArray(query.gender)) {
                finalQuery.gender = { $in: query.gender };
            } else {
                finalQuery.gender = query.gender;
            }
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
            .populate("policyRefs.returnPolicy")
            .populate("policyRefs.refundPolicy")
            .populate("policyRefs.shippingPolicy")
            .populate("policyRefs.termsPolicy")
            .populate("sizeChartId");
    }

    static async findBySlug(slug: string) {
        return await Product.findOne({ slug, isDeleted: false })
            .populate("refundPolicy")
            .populate("policyRefs.returnPolicy")
            .populate("policyRefs.refundPolicy")
            .populate("policyRefs.shippingPolicy")
            .populate("policyRefs.termsPolicy")
            .populate("sizeChartId");
    }

    static async updateById(id: string, data: any, options: any = { returnDocument: "after" }) {
        const product = await Product.findById(id);
        if (!product) return null;
        product.set(data);
        return await product.save();
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
            $and: [
                { $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }] },
            ],
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

    static async getTopSellingProducts(limit = 10) {
        let Order: any;
        try {
            const mongoose = require("mongoose");
            Order = mongoose.model("Order");
        } catch (e) {
            try {
                Order = require("../order/order.model").Order;
            } catch (err) {
                // If model is not found
            }
        }

        const productIds: any[] = [];
        const salesMap = new Map<string, number>();

        if (Order) {
            try {
                const topSales = await Order.aggregate([
                    {
                        $match: {
                            status: { $in: ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $group: {
                            _id: "$items.productId",
                            salesCount: { $sum: "$items.quantity" }
                        }
                    },
                    { $sort: { salesCount: -1 } },
                    { $limit: 50 }
                ]);

                for (const sale of topSales) {
                    if (sale._id) {
                        const idStr = sale._id.toString();
                        productIds.push(sale._id);
                        salesMap.set(idStr, sale.salesCount);
                    }
                }
            } catch (err) {
                console.error("Failed to aggregate order sales:", err);
            }
        }

        // Fetch products with sales
        const productsWithSales = await Product.find({
            _id: { $in: productIds },
            isActive: true,
            isDeleted: false,
            $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }]
        });

        // Fetch fallback products if needed
        const fallbackLimit = limit - productsWithSales.length;
        let fallbackProducts: any[] = [];
        if (fallbackLimit > 0) {
            fallbackProducts = await Product.find({
                _id: { $nin: productIds },
                isActive: true,
                isDeleted: false,
                $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }]
            })
            .sort({
                "ratings.average": -1,
                "ratings.count": -1,
                isTrending: -1,
                isFeatured: -1,
                createdAt: -1
            })
            .limit(fallbackLimit);
        }

        const allProducts = [...productsWithSales, ...fallbackProducts];

        // Sort combined list
        allProducts.sort((a: any, b: any) => {
            const salesA = salesMap.get(a._id.toString()) || 0;
            const salesB = salesMap.get(b._id.toString()) || 0;
            if (salesB !== salesA) {
                return salesB - salesA;
            }
            const ratingA = a.ratings?.average || 0;
            const ratingB = b.ratings?.average || 0;
            if (ratingB !== ratingA) {
                return ratingB - ratingA;
            }
            const countA = a.ratings?.count || 0;
            const countB = b.ratings?.count || 0;
            if (countB !== countA) {
                return countB - countA;
            }
            const trendingA = a.isTrending ? 1 : 0;
            const trendingB = b.isTrending ? 1 : 0;
            if (trendingB !== trendingA) {
                return trendingB - trendingA;
            }
            const featuredA = a.isFeatured ? 1 : 0;
            const featuredB = b.isFeatured ? 1 : 0;
            if (featuredB !== featuredA) {
                return featuredB - featuredA;
            }
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        const finalProducts = allProducts.slice(0, limit);
        return { data: finalProducts, total: finalProducts.length };
    }
}
