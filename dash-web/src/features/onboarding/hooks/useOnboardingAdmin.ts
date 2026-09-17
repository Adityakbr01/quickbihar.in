import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onboardingApi } from "../api/onboarding.api";
import { toast } from "@/lib/toast";

export const useAdminOnboardingApplications = (type?: string, status?: string) => {
  return useQuery({
    queryKey: ["admin-onboarding-applications", type, status],
    queryFn: () => onboardingApi.adminGetApplications(type, status),
  });
};

export const useReviewOnboardingApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "APPROVED" | "REJECTED"; reason?: string }) =>
      onboardingApi.adminReviewApplication(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-onboarding-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sellers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-people"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`Application ${variables.status.toLowerCase()} successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to review onboarding application");
    },
  });
};
