import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/store/authStore";
import { getProfileRequest, updateProfileRequest, updateAvatarRequest } from "../api/profile.api";
import { ProfileFormValues } from "../schema/profile.schema";

export const useProfile = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getProfileRequest,
    select: (response) => response.data,
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormValues) => updateProfileRequest(data),
    onSuccess: async (response) => {
      if (user && token) {
        // Sync with Auth Store
        await setAuth(response.data, token);
      }
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  const updateAvatar = useMutation({
    mutationFn: (formData: FormData) => updateAvatarRequest(formData),
    onSuccess: async (response) => {
      if (user && token) {
        // Sync with Auth Store
        await setAuth(response.data, token);
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
