/**
 * Payment-method business logic.
 *
 * Coordinates a user's saved payment methods, translating "not found / unauthorized" DAO
 * results into 404 `ApiError`s. All persistence is delegated to `paymentMethodDAO`.
 */
import * as paymentMethodDAO from "./paymentMethod.dao";
import type { IPaymentMethod } from "./paymentMethod.model";
import { ApiError } from "../../utils/ApiError";

/** Save a new payment method for the given user. */
export async function addPaymentMethod(userId: string, data: Partial<IPaymentMethod>) {
    return await paymentMethodDAO.create({ ...data, userId: userId as any });
}

/** List the current user's saved payment methods. */
export async function getMyPaymentMethods(userId: string) {
    return await paymentMethodDAO.findByUserId(userId);
}

/** Delete a user's payment method, or fail with 404 if it isn't theirs / doesn't exist. */
export async function deletePaymentMethod(id: string, userId: string) {
    const result = await paymentMethodDAO.delete(id, userId);
    if (!result) throw new ApiError(404, "Payment method not found or unauthorized");
    return result;
}

/** Mark one of a user's methods as the default, or fail with 404 if it isn't theirs / doesn't exist. */
export async function setDefaultPaymentMethod(id: string, userId: string) {
    const result = await paymentMethodDAO.setAsDefault(id, userId);
    if (!result) throw new ApiError(404, "Payment method not found or unauthorized");
    return result;
}
