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
