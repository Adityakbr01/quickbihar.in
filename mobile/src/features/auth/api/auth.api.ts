import axiosInstance from "@/src/api/axiosInstance";

export const authenticateRequest = async (data: { email: string; password: string }) => {
  const response = await axiosInstance.post("/auth/authenticate", data);
  return response.data;
};

export const logoutRequest = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};
