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
    // Scoped per user: a static key served the PREVIOUS account's cached
    // (persisted!) profile after switching accounts, so the 2nd login showed
    // the 1st account's avatar. `enabled` also stops the logged-out 401 noise.
    queryKey: ["userProfile", user?._id],
    queryFn: getProfileRequest,
    select: (response) => response.data,
    enabled: !!token && !!user?._id,
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
