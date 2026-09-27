import axiosInstance from "@/src/api/axiosInstance";
import { AddressFormValues } from "../schema/address.schema";

export const getAddressesRequest = async () => {
  const response = await axiosInstance.get("/addresses");
  return response.data;
};

export const createAddressRequest = async (data: AddressFormValues) => {
  const response = await axiosInstance.post("/addresses", data);
  return response.data;
};

export const updateAddressRequest = async (id: string, data: AddressFormValues) => {
  const response = await axiosInstance.patch(`/addresses/${id}`, data);
  return response.data;
};

export const deleteAddressRequest = async (id: string) => {
  const response = await axiosInstance.delete(`/addresses/${id}`);
  return response.data;
};

export const setDefaultAddressRequest = async (id: string) => {
  const response = await axiosInstance.patch(`/addresses/${id}/default`);
  return response.data;
};

// ── Phone OTP verification (hits auth routes) ─────────────────────

export const sendPhoneOtpRequest = async (phone: string) => {
  const response = await axiosInstance.post("/auth/verify-phone/send", { phone });
  return response.data;
};

export const verifyPhoneOtpRequest = async (phone: string, otp: string) => {
  const response = await axiosInstance.post("/auth/verify-phone/confirm", { phone, otp });
  return response.data;
};

// ── Reverse geocoding (server-proxied OSM + client BigDataCloud fallback) ──────

export interface ReverseGeocodeResult {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  district?: string;
  formattedAddress?: string;
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

export const reverseGeocodeRequest = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> => {
  // 1. Try server endpoint first
  try {
    const response = await axiosInstance.get("/addresses/reverse-geocode", {
      params: { lat: latitude, lng: longitude },
      timeout: 5000,
    });
    if (response.data?.data) {
      return response.data.data as ReverseGeocodeResult;
    }
  } catch (serverErr: unknown) {
    console.log("Server reverse geocode failed, trying client fallback:", serverErr);
  }

  // 2. Fallback to direct client-side reverse geocoder (CORS-friendly, works in browser & mobile)
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as BigDataCloudResponse;
      const city = data.city || data.locality || "";
      const state = data.principalSubdivision || "";
      const rawPostcode = data.postcode ? data.postcode.replace(/\D/g, "").slice(0, 6) : "";
      const pincode = rawPostcode.length === 6 ? rawPostcode : undefined;
      const adminList = data.localityInfo?.administrative || [];
      const districtItem = adminList.find(
        (a) => a.adminLevel === 5 || (Boolean(a.name) && /district/i.test(a.name || ""))
      );
      const district = districtItem?.name ? districtItem.name.replace(/\s*district/i, "").trim() : "";
      const localityItem = adminList.find((a) => a.adminLevel === 6);
      const street = localityItem?.name || city;

      return {
        street: street || undefined,
        city: city || district || undefined,
        state: state || undefined,
        pincode,
        district: district || undefined,
      };
    }
  } catch (clientErr: unknown) {
    console.warn("Client fallback reverse geocode failed:", clientErr);
  }

  return null;
};
