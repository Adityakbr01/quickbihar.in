import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import {
  getUserNotificationsRequest,
  markAsReadRequest,
  markAllAsReadRequest,
} from "../api/notification.api";

export interface INotificationItem {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  channel: string;
  redirectType: "none" | "product" | "category" | "mall" | "external";
  redirectId?: string;
  externalUrl?: string;
  createdAt: string;
  isRead: boolean;
  notificationType?: "NORMAL" | "RICH";
  actionButtonText?: string;
  deliveryType?: "ALERT" | "SILENT" | "LIVE_ACTIVITY";
  status?: "PENDING" | "PROCESSING" | "SENT" | "DELIVERED" | "OPENED" | "FAILED";
  deepLink?: string;
}

export const useNotifications = () => {
  return useQuery<INotificationItem[], Error>({
    queryKey: ["user-notifications"],
    queryFn: async () => {
      const response = await getUserNotificationsRequest();
      return response.data || [];
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
    onError: (error: any) => {
      console.error("[useMarkAsRead] Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to mark notification as read",
      });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "All notifications marked as read",
      });
    },
    onError: (error: any) => {
      console.error("[useMarkAllAsRead] Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to mark all notifications as read",
      });
    },
  });
};
