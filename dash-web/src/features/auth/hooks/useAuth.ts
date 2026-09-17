import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  googleAuthRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  requestResetRequest,
  resetPasswordRequest,
  setPasswordRequest,
  linkGoogleRequest,
  updateProfileRequest,
} from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import type { AuthUser } from "../schemas/auth.schema";
import { onboardingApi, type ApplicationType } from "@/features/onboarding/api/onboarding.api";

import { getUserRoles, hasRole } from "@/lib/rbac";

type RoleName = string;

/**
 * Pull the "partner type" hint (SELLER / RIDER) from a list of allowed roles.
 * Used to send freshly-authenticated users to the right onboarding form.
 */
const partnerTypeFromAllowed = (allowedRoles: RoleName[]): "RIDER" | "SELLER" | null => {
  if (allowedRoles.includes("DELIVERY")) return "RIDER";
  if (allowedRoles.includes("SELLER")) return "SELLER";
  return null;
};

/**
 * If the signed-in user only has the base USER role, OR has the partner role
 * but their onboarding application isn't APPROVED, redirect them to the
 * partner register page with a status-aware toast. This is the single
 * authority on where a non-verified partner lands — the dashboards defer
 * to this same condition.
 */
const handleIncompletePartner = async (
  user: AuthUser,
  partnerType: "RIDER" | "SELLER",
  setAuth: (u: AuthUser, t: string) => void,
  accessToken: string,
  router: ReturnType<typeof useRouter>,
  fallbackMessage?: string,
) => {
  setAuth(user, accessToken);
  try {
    const status = await onboardingApi.status();
    const application = latestApplication(status.applications, partnerType);
    const partnerProfileOk =
      partnerType === "RIDER"
        ? Boolean(status.riderProfile)
        : Boolean(status.sellerProfile);
    const isApproved = partnerProfileOk || application?.status === "APPROVED";

    if (isApproved) {
      // The role is set AND the application/profile is in good standing — let
      // the caller proceed to the dashboard. This shouldn't normally happen
      // when this function is invoked, but the guard makes the behaviour
      // explicit and future-proof.
      return false;
    }

    if (application?.status === "PENDING") {
      toast.info(
        `Your ${partnerType === "RIDER" ? "delivery" : "seller"} application is pending admin approval.`,
      );
    } else if (application?.status === "REJECTED") {
      toast.error(
        application.rejectionReason ||
          `Your ${partnerType.toLowerCase()} application was rejected.`,
      );
    } else if (fallbackMessage) {
      toast.error(fallbackMessage);
    } else {
      toast.info(
        `Please complete your ${partnerType === "RIDER" ? "delivery" : "seller"} profile setup.`,
      );
    }
  } catch {
    if (fallbackMessage) toast.error(fallbackMessage);
    else
      toast.error(
        `Please complete ${partnerType === "RIDER" ? "delivery" : "seller"} registration first.`,
      );
  }
  router.replace(partnerType === "RIDER" ? "/delivery/register" : "/seller/register");
  return true;
};

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
      const userRoles = getUserRoles(user);
      const isAllowed = hasRole(user, ...allowedRoles);
      const partnerType = partnerTypeFromAllowed(allowedRoles);

      // Case 1: user is missing the partner role entirely → send them to
      // onboarding. Case 2: user has the role but their application is not
      // APPROVED (e.g. role/profile got out of sync, or admin reversed the
      // approval) → also send them to the register page so they can see
      // the current status instead of getting bounced by the dashboard gate.
      if (!isAllowed || partnerType) {
        if (userRoles.includes("USER") && partnerType) {
          const handled = await handleIncompletePartner(
            user,
            partnerType,
            setAuth,
            accessToken,
            router,
            !isAllowed ? undefined : accessDeniedMessage,
          );
          if (handled || !isAllowed) return;
          // handled=false means the partner profile IS approved, so the role
          // is in good standing — fall through to the dashboard redirect.
        } else if (!isAllowed) {
          toast.error(accessDeniedMessage);
          return;
        }
      }

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.fullName}!`);
      // Force a full page reload to the dashboard. router.replace alone can
      // race with the next route's hydration — the dashboard's auth guard
      // may see stale state and bounce the user back to login, and
      // router.refresh can collide with the in-flight replace transition.
      // A full reload guarantees: (1) the proxy runs with the new cookie,
      // (2) zustand re-hydrates from localStorage on the new page,
      // (3) React Query starts with a fresh cache.
      // Same pattern as axios.ts:141 for session-expiry redirects.
      // Small delay so the toast is visible before the page unloads.
      setTimeout(() => {
        window.location.assign(redirectTo);
      }, 250);
    },
    onError: (err: Error) => {
      const errorMessage =
        err.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    },
  });
};

const latestApplication = (
  applications: Array<{
    type: ApplicationType;
    status: string;
    rejectionReason?: string;
    createdAt?: string;
  }>,
  type: ApplicationType,
) =>
  applications
    .filter((application) => application.type === type)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )[0];

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

/**
 * Shared Google sign-in flow. Server decides whether the user is new, whether
 * they have a role, and whether they're a PENDING seller/rider.
 */
const useRoleGoogleAuth = ({
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
    mutationFn: googleAuthRequest,
    onSuccess: async (response) => {
      const { user, accessToken } = response.data;
      const userRoles = getUserRoles(user);
      const isAllowed = hasRole(user, ...allowedRoles);
      const partnerType = partnerTypeFromAllowed(allowedRoles);

      if (!isAllowed || partnerType) {
        if (userRoles.includes("USER") && partnerType) {
          const handled = await handleIncompletePartner(
            user,
            partnerType,
            setAuth,
            accessToken,
            router,
            !isAllowed ? undefined : accessDeniedMessage,
          );
          if (handled || !isAllowed) return;
        } else if (!isAllowed) {
          toast.error(accessDeniedMessage);
          return;
        }
      }

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.fullName}!`);
      // See useRoleLogin above for why we use a full reload here.
      setTimeout(() => {
        window.location.assign(redirectTo);
      }, 250);
    },
    onError: (err: Error) => {
      const errorMessage =
        err.message || "Google sign-in failed. Please try again.";
      toast.error(errorMessage);
    },
  });
};

export const useAdminGoogleAuth = () =>
  useRoleGoogleAuth({
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    redirectTo: "/admin/dashboard",
    accessDeniedMessage: "Access denied. Admin account required.",
  });

export const useSellerGoogleAuth = () =>
  useRoleGoogleAuth({
    allowedRoles: ["SELLER"],
    redirectTo: "/seller/dashboard",
    accessDeniedMessage: "Access denied. Seller account required.",
  });

export const useDeliveryGoogleAuth = () =>
  useRoleGoogleAuth({
    allowedRoles: ["DELIVERY"],
    redirectTo: "/delivery/dashboard",
    accessDeniedMessage: "Access denied. Delivery partner account required.",
  });

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: registerRequest,
    onSuccess: async (response) => {
      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      toast.success("Account created! Continue with your partner details.");
      const next =
        typeof window !== "undefined" &&
        window.location.pathname.includes("delivery")
          ? "/delivery/register"
          : "/seller/register";
      // Full reload — same rationale as useRoleLogin above.
      setTimeout(() => {
        window.location.assign(next);
      }, 250);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });
};

export const useSetPassword = () => {
  return useMutation({
    mutationFn: setPasswordRequest,
    onSuccess: () => {
      toast.success("Password set. You can now sign in with email + password.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not update password.");
    },
  });
};

export const useLinkGoogle = () => {
  return useMutation({
    mutationFn: linkGoogleRequest,
    onSuccess: () => {
      toast.success("Google account linked successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not link Google account.");
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: requestResetRequest,
    onSuccess: (response) => {
      toast.success(
        response?.data?.message ||
          "If an account exists for that email, a reset link has been sent.",
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not request a password reset.");
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: async () => {
      toast.success("Password reset. Please sign in with your new password.");
      // Full reload — same rationale as useRoleLogin above.
      setTimeout(() => {
        window.location.assign("/admin/login");
      }, 250);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not reset password.");
    },
  });
};

export const useUpdateProfile = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  return useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (response) => {
      if (response?.data?.user) {
        setAuth(response.data.user, token || response.data.accessToken || "");
      }
      toast.success("Profile updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not update profile.");
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return async (redirectTo = "/") => {
    try {
      await logoutRequest();
    } catch {}
    clearAuth();
    router.replace(redirectTo);
  };
};
