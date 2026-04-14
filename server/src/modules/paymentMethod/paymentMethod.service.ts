import { paymentMethodDAO } from "./paymentMethod.dao";
import type { IPaymentMethod } from "./paymentMethod.model";
import { ApiError } from "../../utils/ApiError";

export class PaymentMethodService {
    async addPaymentMethod(userId: string, data: Partial<IPaymentMethod>) {
        return await paymentMethodDAO.create({ ...data, userId: userId as any });
    }

    async getMyPaymentMethods(userId: string) {
        return await paymentMethodDAO.findByUserId(userId);
    }

    async deletePaymentMethod(id: string, userId: string) {
        const result = await paymentMethodDAO.delete(id, userId);
        if (!result) throw new ApiError(404, "Payment method not found or unauthorized");
        return result;
    }

    async setDefaultPaymentMethod(id: string, userId: string) {
        const result = await paymentMethodDAO.setAsDefault(id, userId);
        if (!result) throw new ApiError(404, "Payment method not found or unauthorized");
        return result;
    }
}

export const paymentMethodService = new PaymentMethodService();
