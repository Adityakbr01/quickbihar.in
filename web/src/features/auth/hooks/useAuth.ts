import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import { LoginValues } from "../schemas/auth.schema";

export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (response) => {
      const { user, accessToken } = response.data;

      if (user.role !== "admin") {
        toast.error("Access denied. Admin account required.");
        return;
      }

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.fullName}!`);
      router.replace("/admin/dashboard");
    },
    onError: (err: any) => {
      const errorMessage = err.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    },
  });
};
