import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAvatarRequest, updateProfileRequest } from "../api/account.api";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

export const useAccount = () => {
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const refreshToken = useAuthStore((state) => state.refreshToken);

    // Mutation for updating profile text (name, phone)
    const updateProfile = useMutation({
        mutationFn: (data: any) => {
            console.log("[DEBUG_PROFILE] Starting profile update request with data:", data);
            return updateProfileRequest(data);
        },
        onSuccess: async (response) => {
            console.log("[DEBUG_PROFILE] Profile Update Success Response:", response);
            if (user && token && refreshToken) {
                // Manually update the store for instant UI feedback
                await setAuth(response.data, token, refreshToken);
            }
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        },
        onError: (error: any) => {
            console.error("[DEBUG_PROFILE] Profile Update Error:", error);
        }
    });

    // Mutation for updating avatar
    const updateAvatar = useMutation({
        mutationFn: (formData: FormData) => {
            console.log("[DEBUG_PROFILE] Starting avatar upload...");
            return updateAvatarRequest(formData);
        },
        onSuccess: async (response) => {
            console.log("[DEBUG_PROFILE] Avatar Upload Success Response:", response);
            if (user && token && refreshToken) {
                // Update store with new avatar data
                await setAuth(response.data, token, refreshToken);
            }
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        },
        onError: (error: any) => {
            console.error("[DEBUG_PROFILE] Avatar Update Error:", error);
        }
    });

    return {
        updateProfile,
        updateAvatar,
        isUpdating: updateProfile.isPending || updateAvatar.isPending,
    };
};
