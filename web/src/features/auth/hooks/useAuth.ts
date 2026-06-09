import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import type { AuthUser } from "../schemas/auth.schema";

type RoleName = Exclude<AuthUser["role"], object>;

const getRoleName = (user: AuthUser) => (typeof user.role === "string" ? user.role : user.role?.name);

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
    onSuccess: (response) => {
      const { user, accessToken } = response.data;
      const roleName = getRoleName(user);

      if (!allowedRoles.includes(roleName as RoleName)) {
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
