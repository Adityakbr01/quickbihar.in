/**
 * Payment-method data-access layer.
 *
 * Thin wrappers around the `PaymentMethod` model. All queries are user-scoped so a user can
 * only ever read or mutate their own saved methods; the single-default invariant is enforced here.
 */
import { PaymentMethod, type IPaymentMethod } from "./paymentMethod.model";

/** Persist a new saved payment method. */
export async function create(data: Partial<IPaymentMethod>) {
    return await PaymentMethod.create(data);
}

/** A user's saved methods, default first, then most recent. */
export async function findByUserId(userId: string) {
    return await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
}

/**
 * Delete a method, scoped to its owner so users can't remove another's record.
 * Declared under a safe identifier and re-exported as `delete` (a reserved word) so the
 * existing `paymentMethodDAO.delete(...)` call site keeps working unchanged.
 */
async function deleteMethod(id: string, userId: string) {
    return await PaymentMethod.findOneAndDelete({ _id: id, userId });
}
export { deleteMethod as delete };

/** Promote one method to default, clearing the flag on all the user's other methods first. */
export async function setAsDefault(id: string, userId: string) {
    await PaymentMethod.updateMany({ userId }, { isDefault: false });
    return await PaymentMethod.findOneAndUpdate({ _id: id, userId }, { isDefault: true }, { returnDocument: 'after' });
}
