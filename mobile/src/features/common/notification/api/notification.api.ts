import axiosInstance from "@/src/api/axiosInstance";

export const getUserNotificationsRequest = async () => {
  const response = await axiosInstance.get("/notifications/user");
  return response.data;
};

export const markAsReadRequest = async (id: string) => {
  const response = await axiosInstance.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsReadRequest = async () => {
  const response = await axiosInstance.patch("/notifications/read-all");
  return response.data;
};
