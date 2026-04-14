import { PaymentMethod,type IPaymentMethod } from "./paymentMethod.model";

export class PaymentMethodDAO {
    async create(data: Partial<IPaymentMethod>) {
        return await PaymentMethod.create(data);
    }

    async findByUserId(userId: string) {
        return await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    }

    async delete(id: string, userId: string) {
        return await PaymentMethod.findOneAndDelete({ _id: id, userId });
    }

    async setAsDefault(id: string, userId: string) {
        await PaymentMethod.updateMany({ userId }, { isDefault: false });
        return await PaymentMethod.findOneAndUpdate({ _id: id, userId }, { isDefault: true }, { new: true });
    }
}

export const paymentMethodDAO = new PaymentMethodDAO();