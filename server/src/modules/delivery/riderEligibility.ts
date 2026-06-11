import { ApiError } from "../../utils/ApiError";

const text = (value: any) => String(value || "").trim();

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
