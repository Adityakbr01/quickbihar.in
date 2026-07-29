import axiosInstance from "@/src/api/axiosInstance";

export const getAllRefundPoliciesRequest = async () => {
    const response = await axiosInstance.get("/refund-policies/all");
    return response.data;
};

export const getActiveRefundPolicyRequest = async () => {
    const response = await axiosInstance.get("/refund-policies/active");
    return response.data;
};

export const createRefundPolicyRequest = async (data: any) => {
    const response = await axiosInstance.post("/refund-policies", data);
    return response.data;
};

export const updateRefundPolicyRequest = async ({ id, data }: { id: string; data: any }) => {
    const response = await axiosInstance.patch(`/refund-policies/${id}`, data);
    return response.data;
};

export const deleteRefundPolicyRequest = async (id: string) => {
    const response = await axiosInstance.delete(`/refund-policies/${id}`);
    return response.data;
};
