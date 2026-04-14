import axiosInstance from "@/src/api/axiosInstance";

export const updateProfileRequest = async (data: { fullName?: string; phone?: string }) => {
    const response = await axiosInstance.patch("/users/profile", data);
    return response.data;
};

export const updateAvatarRequest = async (formData: FormData) => {
    const response = await axiosInstance.patch("/users/avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const getProfileRequest = async () => {
    const response = await axiosInstance.get("/users/profile");
    return response.data;
};
