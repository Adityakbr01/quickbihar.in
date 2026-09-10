/**
 * Product Data Access Object.
 *
 * Implements database operations for the Product model, covering CRUD,
 * stock adjustments (atomically safe), similar product aggregation, and top-selling products query.
 */

import { Product } from "./product.model";

/* ── Internal helpers ── */

const escapeRx = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ── Exported DAO functions ── */

/**
 * Persist a new product.
 */
export async function create(data: any) {
    return await Product.create(data);
}

/**
 * Find all products matching a query, with filtering, searching, sorting, and pagination.
 *
 * `options.limit` is defensively clamped to 1..50 (plan §26 A5); callers pass pre-clamped
 * values from the service layer. Returns additive `page/limit/totalPages` (backwards compatible).
 */
export async function findAll(query: any = {}, options: { skip?: number; limit?: number; page?: number } = {}) {
    const limit = Math.min(50, Math.max(1, options.limit ?? 10));
    const skip = Math.max(0, options.skip ?? 0);
    const page = Math.max(1, options.page ?? (Math.floor(skip / limit) + 1));

    const finalQuery: any = { isDeleted: false };

    // 1. Handle Text Search
    if (query.search && typeof query.search === "string" && query.search.trim()) {
        const searchPattern = new RegExp(escapeRx(query.search.trim()), "i");
        finalQuery.$or = [
            ...(finalQuery.$or || []),
            { title: searchPattern },
            { category: searchPattern },
            { subCategory: searchPattern },
            { brand: searchPattern },
            { tags: searchPattern },
        ];
    }

    // 2. Handle Filters
    if (query.vertical) {
        finalQuery.vertical = query.vertical;
    } else {
        finalQuery.vertical = "CLOTHING";
    }

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

    // Restrict to a set of stores (e.g. the stores serviceable to the user's address).
    if (!query.storeId && Array.isArray(query.storeIds) && query.storeIds.length) {
        finalQuery.storeId = { $in: query.storeIds };
    }

    // Category scoping — matches ALL products related to the tapped category by
    // id (service resolves `categoryId` to `categoryNames`: own title + active
    // children) and/or by name, using escaped partial regex across the
    // category, subCategory and tags fields. When a free-text search is also
    // present, the category group is ANDed so results stay inside the category
    // instead of widening the search.
    const categoryTokenOr = (token: string) => {
        const rx = new RegExp(escapeRx(token), "i");
        return [{ category: rx }, { subCategory: rx }, { tags: rx }];
    };
    const cat = typeof query.category === "string" ? query.category.trim() : "";
    const sub = typeof query.subCategory === "string" ? query.subCategory.trim() : "";
    const extraTokens: string[] = [];
    if (typeof query.categoryName === "string" && query.categoryName.trim()) {
        extraTokens.push(query.categoryName.trim());
    }
    if (Array.isArray(query.categoryNames)) {
        for (const name of query.categoryNames) {
            if (typeof name === "string" && name.trim()) extraTokens.push(name.trim());
        }
    }

    if (cat && sub && cat.toLowerCase() !== sub.toLowerCase()) {
        finalQuery.$and = [
            ...(finalQuery.$and || []),
            { $or: categoryTokenOr(cat) },
            { $or: categoryTokenOr(sub) },
        ];
    } else {
        const seen = new Set<string>();
        const anyTokens: string[] = [];
        for (const token of [...(cat ? [cat] : []), ...(!cat && sub ? [sub] : []), ...extraTokens]) {
            const key = token.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                anyTokens.push(token);
            }
        }
        if (anyTokens.length) {
            const categoryOr = anyTokens.flatMap(categoryTokenOr);
            if (finalQuery.$or && finalQuery.$or.length) {
                finalQuery.$and = [...(finalQuery.$and || []), { $or: categoryOr }];
            } else {
                finalQuery.$or = [...(finalQuery.$or || []), ...categoryOr];
            }
        } else if (finalQuery.vertical === "CLOTHING") {
            finalQuery.category = { $not: /jewel|necklace|ring|earring|pendant|bangle|food|grocery|beverage|snack/i };
        }
    }

    if (query.gender) {
        if (Array.isArray(query.gender)) {
            finalQuery.gender = { $in: query.gender };
        } else {
            finalQuery.gender = query.gender;
        }
    }

    if (query.brand) {
        finalQuery.brand = { $regex: new RegExp(escapeRx(query.brand), "i") };
    }

    if (query.minPrice || query.maxPrice) {
        finalQuery.price = {};
        if (query.minPrice) finalQuery.price.$gte = Number(query.minPrice);
        if (query.maxPrice) finalQuery.price.$lte = Number(query.maxPrice);
    }

    // Feature flags
    if (query.isTrending === "true" || query.isTrending === true) finalQuery.isTrending = true;
    if (query.isFeatured === "true" || query.isFeatured === true) finalQuery.isFeatured = true;
    if (query.isNewArrival === "true" || query.isNewArrival === true) finalQuery.isNewArrival = true;
    if (query.isExpressAvailable === "true" || query.isExpressAvailable === true) {
        finalQuery["deliveryInfo.isExpressAvailable"] = true;
    }
    if (query.minRating) {
        finalQuery["ratings.average"] = { $gte: Number(query.minRating) };
    }
    if (query.dealOfDay === "true" || query.dealOfDay === true) {
        finalQuery.$or = [
            ...(finalQuery.$or || []),
            { isTrending: true },
            { discountPercentage: { $gte: 20 } },
        ];
    }

    // 3. Handle Sorting
    // Relevance = trending first, then top rated, then most reviewed
    // (ratings.count is the closest stored proxy for units sold), then newest.
    // This is the default for text search AND category browsing so top-selling
    // / top-rated products surface at the top of category pages.
    const relevanceSort = {
        isTrending: -1,
        "ratings.average": -1,
        "ratings.count": -1,
        createdAt: -1,
    };
    const hasCategoryIntent =
        Boolean(cat || sub) ||
        (typeof query.categoryName === "string" && query.categoryName.trim() !== "") ||
        (typeof query.categoryId === "string" && query.categoryId.trim() !== "") ||
        (Array.isArray(query.categoryNames) && query.categoryNames.length > 0);
    let sortOption: any = { createdAt: -1 };
    if (query.sortBy) {
        switch (query.sortBy) {
            case "price_low": sortOption = { price: 1 }; break;
            case "price_high": sortOption = { price: -1 }; break;
            case "rating": sortOption = { "ratings.average": -1, "ratings.count": -1 }; break;
            case "newest": sortOption = { createdAt: -1 }; break;
            case "oldest": sortOption = { createdAt: 1 }; break;
            case "discount": sortOption = { discountPercentage: -1, price: 1 }; break;
            case "relevance": sortOption = { ...relevanceSort }; break;
            case "trending": sortOption = { isTrending: -1, "ratings.average": -1, "ratings.count": -1, createdAt: -1 }; break;
        }
    } else if (query.search || hasCategoryIntent) {
        sortOption = { ...relevanceSort };
    }

    const [data, total] = await Promise.all([
        Product.find(finalQuery)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean({ virtuals: true }),
        Product.countDocuments(finalQuery),
    ]);

    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Fetch all active products for a specific seller, sorted by creation date.
 */
export async function findBySellerId(sellerId: string) {
    return await Product.find({ sellerId, isDeleted: false }).sort({ createdAt: -1 }).lean({ virtuals: true });
}

/**
 * Retrieve a specific product by ID, populating policy references and size charts.
 */
export async function findById(id: string) {
    return await Product.findOne({ _id: id, isDeleted: false })
        .populate("refundPolicy")
        .populate("policyRefs.returnPolicy")
        .populate("policyRefs.refundPolicy")
        .populate("policyRefs.shippingPolicy")
        .populate("policyRefs.termsPolicy")
        .populate("sizeChartId")
        .populate("storeId", "name address city state contactNumber rating logo")
        .populate("sellerId", "fullName email phone")
        .lean({ virtuals: true });
}

/**
 * Retrieve a specific product by its URL-safe slug, populating references.
 */
export async function findBySlug(slug: string) {
    return await Product.findOne({ slug, isDeleted: false })
        .populate("refundPolicy")
        .populate("policyRefs.returnPolicy")
        .populate("policyRefs.refundPolicy")
        .populate("policyRefs.shippingPolicy")
        .populate("policyRefs.termsPolicy")
        .populate("sizeChartId")
        .populate("storeId", "name address city state contactNumber rating logo")
        .populate("sellerId", "fullName email phone")
        .lean({ virtuals: true });
}

/**
 * Update a product by its ID and return the updated document.
 */
export async function updateById(id: string, data: any, _options: any = { returnDocument: "after" }) {
    const product = await Product.findById(id);
    if (!product) return null;
    product.set(data);
    return await product.save();
}

/**
 * Soft delete a product by setting its isDeleted flag to true.
 */
export async function softDeleteById(id: string) {
    return await Product.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: "after" });
}

/**
 * Find similar products based on overlapping category, tags, or brand (limit clamped 1..50).
 */
export async function findSimilar(
    productId: string,
    { category, tags, brand }: { category?: string; tags?: string[]; brand?: string },
    limit = 10
) {
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const orConditions: any[] = [];

    if (category) {
        orConditions.push({ category: { $regex: new RegExp(escapeRx(category), "i") } });
    }

    if (tags && tags.length > 0) {
        const tagPatterns = tags.map(tag => ({ tags: { $regex: new RegExp(escapeRx(tag.trim()), "i") } }));
        orConditions.push(...tagPatterns);
    }

    if (brand) {
        orConditions.push({ brand: { $regex: new RegExp(escapeRx(brand.trim()), "i") } });
    }

    if (orConditions.length === 0) return [];

    return await Product.find({
        _id: { $ne: productId },
        isDeleted: false,
        isActive: true,
        vertical: "CLOTHING",
        category: { $not: /jewel|necklace|ring|earring|pendant|bangle|food|grocery|beverage|snack/i },
        $and: [
            { $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }] },
        ],
        $or: orConditions,
    })
        .sort({ isTrending: -1, createdAt: -1 })
        .limit(safeLimit)
        .lean({ virtuals: true });
}

/**
 * Atomically deduct stock for a specific SKU variant of a product.
 * Enforces safety check so that stock cannot go below zero.
 */
export async function deductStock(productId: string, sku: string, quantity: number) {
    return await Product.findOneAndUpdate(
        {
            _id: productId,
            "variants.sku": sku,
            "variants.stock": { $gte: quantity },
            totalStock: { $gte: quantity }
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

/**
 * Atomically restore stock for a specific SKU variant of a product.
 */
export async function restoreStock(productId: string, sku: string, quantity: number) {
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

/**
 * Retrieve top selling products, aggregating orders database entries and falling back
 * to rated/trending products if the list has fewer than the requested limit.
 */
export async function getTopSellingProducts(limit = 10, category?: string, vertical: string = "CLOTHING") {
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    let Order: any;
    try {
        const mongoose = require("mongoose");
        Order = mongoose.model("Order");
    } catch (e) {
        try {
            Order = require("../order/order.model").Order;
        } catch (err) {
            // Ignore if model can't be resolved
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

    const baseFilter: any = {
        isActive: true,
        isDeleted: false,
        vertical: vertical || "CLOTHING",
        $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }]
    };

    if (baseFilter.vertical === "CLOTHING") {
        baseFilter.category = { $not: /jewel|necklace|ring|earring|pendant|bangle|food|grocery|beverage|snack/i };
    }

    if (category && typeof category === "string" && category.trim()) {
        // Partial, escaped regex (not exact ^$ match) so "Jeans" also matches
        // "Men Jeans", and values with regex chars can't break the query.
        const categoryPattern = new RegExp(escapeRx(category.trim()), "i");
        baseFilter.$and = [
            {
                $or: [
                    { category: categoryPattern },
                    { subCategory: categoryPattern },
                    { tags: categoryPattern },
                ]
            }
        ];
    }

    const productsWithSales = await Product.find({
        ...baseFilter,
        _id: { $in: productIds },
    }).lean({ virtuals: true });

    const fallbackLimit = safeLimit - productsWithSales.length;
    let fallbackProducts: any[] = [];
    if (fallbackLimit > 0) {
        fallbackProducts = await Product.find({
            ...baseFilter,
            _id: { $nin: productIds },
        })
        .sort({
            "ratings.average": -1,
            "ratings.count": -1,
            isTrending: -1,
            isFeatured: -1,
            createdAt: -1
        })
        .limit(fallbackLimit)
        .lean({ virtuals: true });
    }

    const allProducts = [...productsWithSales, ...fallbackProducts];

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

    const finalProducts = allProducts.slice(0, safeLimit);
    return { data: finalProducts, total: finalProducts.length };
}
