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

        return await Order.findByIdAndUpdate(id, updateData, { new: true });
    }

    async findByUserId(userId: string) {
        return await Order.find({ userId }).sort({ createdAt: -1 });
    }

    async findAll(query: any = {}) {
        return await Order.find(query).sort({ createdAt: -1 });

    }
    async update(id: string, data: Partial<IOrder>) {
        return await Order.findByIdAndUpdate(id, { $set: data }, { new: true });
    }
}

export const orderDAO = new OrderDAO();
