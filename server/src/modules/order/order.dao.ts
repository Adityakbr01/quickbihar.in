import { Order } from "./order.model";
import type { IOrder, OrderStatus } from "./order.type";

export class OrderDAO {
    async create(data: Partial<IOrder>) {
        return await Order.create(data);
    }

    async findById(id: string) {
        return await Order.findById(id).populate("userId", "fullName email");
    }

    async findByRazorpayOrderId(razorpayOrderId: string) {
        return await Order.findOne({ "paymentInfo.razorpayOrderId": razorpayOrderId });
    }

    async findByOrderId(orderId: string) {
        return await Order.findOne({ orderId }).populate("userId", "fullName email");
    }

    async updateStatus(id: string, status: OrderStatus, paymentId?: string, signature?: string) {
        const updateData: any = { status };
        if (paymentId) updateData["paymentInfo.razorpayPaymentId"] = paymentId;
        if (signature) updateData["paymentInfo.razorpaySignature"] = signature;

        return await Order.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
    }

    async findByUserId(userId: string) {
        return await Order.find({ userId }).sort({ createdAt: -1 });
    }

    async findAll(query: any = {}) {
        const hasQuery = Object.keys(query || {}).length > 0;
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;
        const filter: any = {};

        if (query.status && query.status !== "ALL") {
            filter.status = query.status;
        }

        if (query.search) {
            const searchRegex = new RegExp(String(query.search).trim(), "i");
            filter.$or = [
                { orderId: searchRegex },
                { "shippingAddress.fullName": searchRegex },
                { "shippingAddress.phone": searchRegex },
                { couponCode: searchRegex },
            ];
        }

        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {};
            if (query.dateFrom) filter.createdAt.$gte = new Date(String(query.dateFrom));
            if (query.dateTo) filter.createdAt.$lte = new Date(String(query.dateTo));
        }

        const sortField = ["createdAt", "payableAmount", "status", "orderId"].includes(query.sortBy)
            ? query.sortBy
            : "createdAt";
        const sortOrder = query.sortOrder === "asc" ? 1 : -1;

        if (!hasQuery) {
            return await Order.find(filter)
                .populate("userId", "fullName email phone")
                .sort({ createdAt: -1 });
        }

        const [data, total] = await Promise.all([
            Order.find(filter)
                .populate("userId", "fullName email phone")
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit),
            Order.countDocuments(filter),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

    }
    async update(id: string, data: Partial<IOrder>) {
        return await Order.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    }
}

export const orderDAO = new OrderDAO();
