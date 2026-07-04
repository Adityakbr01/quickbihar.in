import { ApiError } from "../../utils/ApiError";
import { ENV } from "../../config/env.config";

const text = (value: any) => String(value || "").trim();

/**
 * Current uncollected COD cash a rider is holding (₹), defaulting to 0.
 */
export const riderCodLiability = (profile?: any | null): number =>
    Number(profile?.wallet?.collectedCodLiability) || 0;

/**
 * Guards a rider from accepting a new Cash-on-Delivery job when doing so would push
 * their outstanding cash liability over the configured ceiling
 * ({@link ENV.RIDER_MAX_COD_LIABILITY}, default ₹5000). Non-COD jobs are always allowed;
 * the rider must deposit cash (settled by a merchant/admin) to free up headroom.
 *
 * @param profile - The rider's DeliveryBoy profile (reads `wallet.collectedCodLiability`).
 * @param job - Whether the job is COD and the cash amount to be collected.
 */
export function assertRiderCanAcceptCod(
    profile: any | null | undefined,
    job: { isCod?: boolean; amount?: number },
): void {
    if (!job?.isCod) return;

    const maxLiability = Number(ENV.RIDER_MAX_COD_LIABILITY);
    if (!Number.isFinite(maxLiability) || maxLiability <= 0) return;

    const current = riderCodLiability(profile);
    const projected = current + (Number(job.amount) || 0);
    if (projected > maxLiability) {
        throw new ApiError(
            403,
            `You are holding ₹${current} in undeposited COD cash. Accepting this ₹${Number(job.amount) || 0} COD order `
            + `would exceed the ₹${maxLiability} limit. Please deposit your collected cash at a merchant/bank and get `
            + `admin clearance before accepting more COD orders.`,
        );
    }
}

export const riderProfileMissingFields = (profile?: any | null) => {
    const missing: string[] = [];
    const user = profile?.userId || {};
    const bank = profile?.bankDetails || {};
    const address = profile?.address || {};

    if (!text(user.phone || profile?.phone)) missing.push("Phone");
    if (!text(profile?.vehicleType)) missing.push("Vehicle type");
    if (!text(profile?.vehicleNumber)) missing.push("Vehicle number");
    if (!text(profile?.licenseNumber)) missing.push("License number");
    if (!text(address.address)) missing.push("Address");
    if (!text(address.city)) missing.push("City");
    if (!text(address.state)) missing.push("State");
    if (!text(address.pincode)) missing.push("Pincode");
    if (!text(bank.pan)) missing.push("PAN");
    if (!text(bank.aadhar)) missing.push("Aadhar");

    const hasUpi = !!text(bank.upi);
    const hasBank = !!text(bank.accountNumber) && !!text(bank.ifsc) && !!text(bank.bankName);
    if (!hasUpi && !hasBank) missing.push("UPI or bank account");

    return missing;
};

export const riderCanAcceptOffers = (profile?: any | null) =>
    !!profile
    && profile.status === "APPROVED"
    && !!profile.isVerified
    && riderProfileMissingFields(profile).length === 0;

export const riderOfferBlockMessage = (profile?: any | null) => {
    if (!profile) return "Complete your rider profile first, then wait for admin approval before accepting offers.";
    const missing = riderProfileMissingFields(profile);
    if (missing.length) return `Complete your rider profile first. Missing: ${missing.join(", ")}.`;
    if (profile.status !== "APPROVED" || !profile.isVerified) {
        return "Your rider profile is pending admin approval. You can accept offers after approval.";
    }
    return "Your rider profile is not eligible to accept offers yet.";
};

export function assertRiderCanAcceptOffers(profile?: any | null): asserts profile {
    if (!riderCanAcceptOffers(profile)) {
        throw new ApiError(403, riderOfferBlockMessage(profile));
    }
}

export const riderApprovalSnapshot = (profile?: any | null) => {
    const user = profile?.userId || {};
    const address = profile?.address || {};
    const bank = profile?.bankDetails || {};
    return {
        phone: text(user.phone || profile?.phone),
        vehicleType: text(profile?.vehicleType),
        vehicleNumber: text(profile?.vehicleNumber).toUpperCase(),
        licenseNumber: text(profile?.licenseNumber).toUpperCase(),
        address: text(address.address),
        city: text(address.city),
        state: text(address.state),
        pincode: text(address.pincode),
        accountNumber: text(bank.accountNumber),
        ifsc: text(bank.ifsc).toUpperCase(),
        bankName: text(bank.bankName),
        pan: text(bank.pan).toUpperCase(),
        upi: text(bank.upi).toLowerCase(),
        aadhar: text(bank.aadhar),
    };
};

export const riderApprovalSnapshotChanged = (before: any, after: any) =>
    Object.keys(after).some((key) => before?.[key] !== after?.[key]);
