/**
 * Saved-address HTTP controllers.
 *
 * Validates the request body with Zod, pulls the authenticated user id off `req.user`,
 * and delegates to `savedAddressService`. Zod failures propagate to the global handler.
 */
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import * as savedAddressService from "./savedAddresses.service";
import { addressSchema, updateAddressSchema } from "./savedAddresses.validation";

interface OsmAddress {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
}

interface OsmResponse {
    display_name?: string;
    address?: OsmAddress;
}

interface BigDataCloudAdmin {
    name?: string;
    adminLevel?: number;
}

interface BigDataCloudResponse {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    postcode?: string;
    localityInfo?: {
        administrative?: BigDataCloudAdmin[];
    };
}

/** GET /reverse-geocode — reverse geocode coordinates into address components. */
export const reverseGeocode = asyncHandler(async (req, res) => {
    const latStr = req.query.lat as string | undefined;
    const lngStr = req.query.lng as string | undefined;
    const lat = latStr ? parseFloat(latStr) : NaN;
    const lng = lngStr ? parseFloat(lngStr) : NaN;

    if (isNaN(lat) || isNaN(lng)) {
        throw new ApiError(400, "Valid latitude (lat) and longitude (lng) query parameters are required");
    }

    // 1. Try OpenStreetMap Nominatim with timeout
    try {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
        const osmRes = await fetch(osmUrl, {
            headers: { "User-Agent": "QuickBihar/1.0 (contact@quickbihar.in)" },
            signal: AbortSignal.timeout(4000),
        });

        if (osmRes.ok) {
            const data = (await osmRes.json()) as OsmResponse;
            const addr = data.address || {};
            const streetParts = [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean);
            const street = streetParts.length > 0
                ? streetParts.join(", ")
                : (addr.village || addr.town || addr.county || "");
            const city = addr.city || addr.town || addr.village || addr.state_district || addr.county || "";
            const state = addr.state || "";
            const rawPostcode = addr.postcode ? addr.postcode.replace(/\D/g, "").slice(0, 6) : "";
            const pincode = rawPostcode.length === 6 ? rawPostcode : "";
            const district = addr.state_district || addr.county || "";

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        street,
                        city,
                        state,
                        pincode,
                        district,
                        formattedAddress: data.display_name || "",
                    },
                    "Reverse geocoding successful"
                )
            );
        }
    } catch (osmErr) {
        console.warn("OSM Nominatim reverse geocode failed, trying fallback:", osmErr);
    }

    // 2. Fallback to BigDataCloud
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
        const bdcRes = await fetch(bdcUrl, {
            signal: AbortSignal.timeout(4000),
        });

        if (bdcRes.ok) {
            const data = (await bdcRes.json()) as BigDataCloudResponse;
            const city = data.city || data.locality || "";
            const state = data.principalSubdivision || "";
            const rawPostcode = data.postcode ? data.postcode.replace(/\D/g, "").slice(0, 6) : "";
            const pincode = rawPostcode.length === 6 ? rawPostcode : "";
            const adminList = data.localityInfo?.administrative || [];
            const districtItem = adminList.find(
                (a) => a.adminLevel === 5 || (a.name && /district/i.test(a.name))
            );
            const district = districtItem?.name ? districtItem.name.replace(/\s*district/i, "").trim() : "";
            const localityItem = adminList.find((a) => a.adminLevel === 6);
            const street = localityItem?.name || city;

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        street,
                        city: city || district,
                        state,
                        pincode,
                        district,
                    },
                    "Reverse geocoding successful"
                )
            );
        }
    } catch (bdcErr) {
        console.warn("BigDataCloud reverse geocode fallback failed:", bdcErr);
    }

    return res.status(200).json(
        new ApiResponse(200, { street: "", city: "", state: "", pincode: "", district: "" }, "No address found")
    );
});

/** POST / — save a new address for the current user. */
export const createAddress = asyncHandler(async (req, res) => {
    const validatedData = addressSchema.parse(req.body);
    const result = await savedAddressService.createAddress((req as any).user._id, validatedData);
    return res.status(201).json(new ApiResponse(201, result, "Address saved successfully"));
});

/** GET / — list the current user's addresses. */
export const getMyAddresses = asyncHandler(async (req, res) => {
    const result = await savedAddressService.getUserAddresses((req as any).user._id);
    return res.status(200).json(new ApiResponse(200, result, "Addresses fetched successfully"));
});

/** PATCH /:id — update one of the current user's addresses. */
export const updateAddress = asyncHandler(async (req, res) => {
    const validatedData = updateAddressSchema.parse(req.body);
    const result = await savedAddressService.updateAddress(req.params.id as unknown as string, (req as any).user._id, validatedData);
    return res.status(200).json(new ApiResponse(200, result, "Address updated successfully"));
});

/** DELETE /:id — remove one of the current user's addresses. */
export const deleteAddress = asyncHandler(async (req, res) => {
    const result = await savedAddressService.deleteAddress(req.params.id as unknown as string, (req as any).user._id);
    return res.status(200).json(new ApiResponse(200, result, "Address deleted successfully"));
});

/** PATCH /:id/default — mark one of the current user's addresses as default. */
export const setDefaultAddress = asyncHandler(async (req, res) => {
    const result = await savedAddressService.setDefaultAddress(req.params.id as unknown as string, (req as any).user._id);
    return res.status(200).json(new ApiResponse(200, result, "Default address set successfully"));
});
