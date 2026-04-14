import { Product } from "./product.model";
import type { CreateProductBody, UpdateProductBody } from "./product.validation";

export class ProductDAO {
    static async create(data: any) {
        return await Product.create(data);
    }

    static async findAll(query: any = {}) {
        return await Product.find({ ...query, isDeleted: false }).sort({ createdAt: -1 });
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
}
