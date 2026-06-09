import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import type { AuthUser } from "../schemas/auth.schema";
import { onboardingApi, type ApplicationType } from "@/features/onboarding/api/onboarding.api";

type RoleName = Exclude<AuthUser["role"], object | null>;

const getRoleName = (user: AuthUser) => (typeof user.role === "string" ? user.role : user.role?.name || null);

const useRoleLogin = ({
  allowedRoles,
  redirectTo,
  accessDeniedMessage,
}: {
  allowedRoles: RoleName[];
  redirectTo: string;
  accessDeniedMessage: string;
}) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: async (response) => {
      const { user, accessToken } = response.data;
      const roleName = getRoleName(user);

      if (!allowedRoles.includes(roleName as RoleName)) {
        const partnerType = allowedRoles.includes("DELIVERY") ? "RIDER" : allowedRoles.includes("SELLER") ? "SELLER" : null;
        if (roleName === "USER" && partnerType) {
          setAuth(user, accessToken);
          try {
            const status = await onboardingApi.status();
            const application = latestApplication(status.applications, partnerType);
            if (application?.status === "PENDING") {
              toast.info(`Your ${partnerType === "RIDER" ? "delivery" : "seller"} application is pending admin approval.`);
            } else if (application?.status === "REJECTED") {
              toast.error(application.rejectionReason || `Your ${partnerType.toLowerCase()} application was rejected.`);
            } else {
              toast.error(`Please complete ${partnerType === "RIDER" ? "delivery" : "seller"} registration first.`);
            }
          } catch {
            toast.error(`Please complete ${partnerType === "RIDER" ? "delivery" : "seller"} registration first.`);
          }
          router.replace(partnerType === "RIDER" ? "/delivery/register" : "/seller/register");
          return;
        }

        toast.error(accessDeniedMessage);
        return;
      }

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.fullName}!`);
      router.replace(redirectTo);
    },
    onError: (err: Error) => {
      const errorMessage = err.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    },
  });
};

const latestApplication = (applications: Array<{ type: ApplicationType; status: string; rejectionReason?: string; createdAt?: string }>, type: ApplicationType) =>
  applications
    .filter((application) => application.type === type)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

export const useLogin = () =>
  useRoleLogin({
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    redirectTo: "/admin/dashboard",
    accessDeniedMessage: "Access denied. Admin account required.",
  });

export const useSellerLogin = () =>
  useRoleLogin({
    allowedRoles: ["SELLER"],
    redirectTo: "/seller/dashboard",
    accessDeniedMessage: "Access denied. Seller account required.",
  });

export const useDeliveryLogin = () =>
  useRoleLogin({
    allowedRoles: ["DELIVERY"],
    redirectTo: "/delivery/dashboard",
    accessDeniedMessage: "Access denied. Delivery partner account required.",
  });
