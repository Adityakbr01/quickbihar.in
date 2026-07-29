import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfileRequest, updateProfileRequest, updateAvatarRequest } from "../api/profile.api";
import { ProfileFormValues } from "../schema/profile.schema";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

export const useProfile = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getProfileRequest,
    select: (response) => response.data,
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormValues) => updateProfileRequest(data),
    onSuccess: async (response) => {
      if (user && token && refreshToken) {
        // Sync with Auth Store
        await setAuth(response.data, token, refreshToken);
      }
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  const updateAvatar = useMutation({
    mutationFn: (formData: FormData) => updateAvatarRequest(formData),
    onSuccess: async (response) => {
      if (user && token && refreshToken) {
        // Sync with Auth Store
        await setAuth(response.data, token, refreshToken);
      }
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
    isUpdating: updateProfile.isPending || updateAvatar.isPending,
  };
};
