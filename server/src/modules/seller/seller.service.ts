import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { AdminPayout } from "../admin/admin.model";
import { Mall } from "../mall/mall.model";
import { Store } from "../store/store.model";
import { buildStoreSetupStatus } from "../store/store.setup";
import { Seller } from "./seller.model";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const assertApprovedSeller = (seller: any) => {
    if (!seller) throw new ApiError(404, "Seller profile not found");
    if (seller.status !== "APPROVED" || !seller.isVerified) {
        throw new ApiError(403, "Seller approval is required for this action.");
    }
};

export class SellerService {
    static async getSetupStatus(userId: string) {
        const [seller, stores] = await Promise.all([
            Seller.findOne({ userId }).populate("mallId", "name slug address.city isActive").lean(),
            Store.find({ sellerId: userId }).sort({ createdAt: -1 }).lean(),
        ]);

        if (!seller) throw new ApiError(404, "Seller profile not found");

        const store = stores[0] || null;
        const storeSetup = store
            ? buildStoreSetupStatus(store)
            : { isComplete: false, missingFields: ["store.profile"] };
        const sellerApproved = seller.status === "APPROVED" && !!seller.isVerified;
        const hasVerifiedPayoutMethod = (seller.payoutMethods || []).some(
            (method: any) => method.status === "VERIFIED",
        );
        const storeActive = !!store?.isActive;

        return {
            seller: {
                _id: seller._id?.toString(),
                userId: seller.userId?.toString(),
                businessName: seller.businessName,
                status: seller.status,
                isVerified: !!seller.isVerified,
                sellerType: seller.sellerType,
                mallId: seller.mallId?._id?.toString() || seller.mallId?.toString(),
                mallName: (seller.mallId as any)?.name,
                mallUnit: seller.mallUnit,
                mallFloor: seller.mallFloor,
                wallet: seller.wallet || {
                    availableBalance: 0,
                    pendingPayoutBalance: 0,
                    lifetimeEarnings: 0,
                },
                payoutMethods: seller.payoutMethods || [],
            },
            store,
            setup: {
                sellerApproved,
                storeExists: !!store,
                storeConfigured: storeSetup.isComplete,
                storeMissingFields: storeSetup.missingFields,
                storeActive,
                hasVerifiedPayoutMethod,
                productsUnlocked: sellerApproved && !!store && storeSetup.isComplete && storeActive,
                payoutsUnlocked: sellerApproved && hasVerifiedPayoutMethod,
                mallLinked: !!seller.mallId,
                mallOptional: true,
            },
        };
    }

    static async requestMallConnection(userId: string, data: any) {
        const [seller, mall] = await Promise.all([
            Seller.findOne({ userId }),
            Mall.findOne({ _id: data.mallId, isActive: true }).lean(),
        ]);

        assertApprovedSeller(seller);
        if (!mall) throw new ApiError(404, "Active mall not found");

        if (seller.mallId?.toString() === data.mallId) {
            throw new ApiError(400, "Seller is already linked to this mall");
        }

        if (seller.mallRequest?.status === "PENDING") {
            throw new ApiError(400, "A mall connection request is already pending");
        }

        seller.mallRequest = {
            mallId: new Types.ObjectId(data.mallId),
            mallUnit: data.mallUnit,
            mallFloor: data.mallFloor,
            message: data.message,
            status: "PENDING",
            requestedAt: new Date(),
        };

        await seller.save();
        return await seller.populate("mallRequest.mallId", "name slug address.city isActive");
    }

    static async requestMallCreation(userId: string, data: any) {
        const seller = await Seller.findOne({ userId });
        assertApprovedSeller(seller);

        const pendingMall = await Mall.findOne({ requestedBy: userId, status: "PENDING" }).lean();
        if (pendingMall) {
            throw new ApiError(400, "A mall creation request is already pending");
        }

        const baseSlug = slugify(data.name);
        let slug = baseSlug;
        let suffix = 1;

        while (await Mall.exists({ slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        return await Mall.create({
            name: data.name,
            slug,
            description: data.description,
            address: data.address,
            contact: data.contact,
            isActive: false,
            status: "PENDING",
            requestedBy: new Types.ObjectId(userId),
            request: {
                mallUnit: data.mallUnit,
                mallFloor: data.mallFloor,
                message: data.message,
            },
        });
    }

    static async addPayoutMethod(userId: string, data: any) {
        const seller = await Seller.findOne({ userId });
        assertApprovedSeller(seller);

        const methods = seller.payoutMethods || [];
        const isFirstMethod = methods.length === 0;

        if (isFirstMethod) {
            data.isDefault = true;
        }

        seller.payoutMethods.push({
            ...data,
            status: "PENDING_VERIFICATION",
            createdAt: new Date(),
        });

        await seller.save();
        return seller.payoutMethods[seller.payoutMethods.length - 1];
    }

    static async setDefaultPayoutMethod(userId: string, methodId: string) {
        const seller = await Seller.findOne({ userId });
        assertApprovedSeller(seller);

        const method = seller.payoutMethods.id(methodId);
        if (!method) throw new ApiError(404, "Payout method not found");
        if (method.status !== "VERIFIED") {
            throw new ApiError(400, "Only verified payout methods can be set as default");
        }

        seller.payoutMethods.forEach((item: any) => {
            item.isDefault = item._id.toString() === methodId;
        });

        await seller.save();
        return seller.payoutMethods;
    }

    static async createPayoutRequest(userId: string, data: any) {
        const seller = await Seller.findOne({ userId });
        assertApprovedSeller(seller);

        const method = seller.payoutMethods.id(data.payoutMethodId);
        if (!method) throw new ApiError(404, "Payout method not found");
        if (method.status !== "VERIFIED") {
            throw new ApiError(400, "A verified payout method is required before requesting payout");
        }

        const wallet = seller.wallet || {
            availableBalance: 0,
            pendingPayoutBalance: 0,
            lifetimeEarnings: 0,
        };

        if ((wallet.availableBalance || 0) < data.amount) {
            throw new ApiError(400, "Insufficient available balance for this payout request");
        }

        wallet.availableBalance -= data.amount;
        wallet.pendingPayoutBalance = (wallet.pendingPayoutBalance || 0) + data.amount;
        seller.wallet = wallet;

        const payout = await AdminPayout.create({
            partnerId: new Types.ObjectId(userId),
            partnerType: "SELLER",
            amount: data.amount,
            method: method.type,
            payoutMethodId: method._id,
            note: data.note,
            status: "PENDING",
            requestedBy: new Types.ObjectId(userId),
        });

        await seller.save();
        return await payout.populate("partnerId", "fullName email");
    }
}
