import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deliveryApi, DeliveryStatus } from "../api/delivery.api";

export const useDeliveryProfile = () =>
  useQuery({
    queryKey: ["delivery-profile"],
    queryFn: deliveryApi.getProfile,
  });

export const useDeliveryDashboard = () =>
  useQuery({
    queryKey: ["delivery-dashboard"],
    queryFn: deliveryApi.getDashboard,
  });

export const useDeliveryOrders = (params: { status?: DeliveryStatus; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ["delivery-orders", params],
    queryFn: () => deliveryApi.getOrders(params),
  });

export const useDeliveryHistory = (params: { status?: DeliveryStatus; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ["delivery-history", params],
    queryFn: () => deliveryApi.getHistory(params),
  });

export const useDeliveryEarnings = (params: { dateFrom?: string; dateTo?: string } = {}) =>
  useQuery({
    queryKey: ["delivery-earnings", params],
    queryFn: () => deliveryApi.getEarnings(params),
  });

export const useDeliveryPayouts = () =>
  useQuery({
    queryKey: ["delivery-payouts"],
    queryFn: deliveryApi.getPayouts,
  });

const invalidateDelivery = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["delivery-profile"] });
  queryClient.invalidateQueries({ queryKey: ["delivery-dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
  queryClient.invalidateQueries({ queryKey: ["delivery-history"] });
  queryClient.invalidateQueries({ queryKey: ["delivery-earnings"] });
  queryClient.invalidateQueries({ queryKey: ["delivery-payouts"] });
};

export const useUpdateDeliveryAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryApi.updateAvailability,
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Availability updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update availability"),
  });
};

export const useUpdateDeliveryOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryApi.updateOrderStatus,
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Delivery status updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update delivery status"),
  });
};

export const useUpdateDeliveryLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryApi.updateOrderLocation,
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Location updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update location"),
  });
};

export const useDeliveryPayoutMutations = () => {
  const queryClient = useQueryClient();
  return {
    addMethod: useMutation({
      mutationFn: deliveryApi.addPayoutMethod,
      onSuccess: () => {
        invalidateDelivery(queryClient);
        toast.success("Payout method submitted for verification");
      },
      onError: (error: Error) => toast.error(error.message || "Failed to add payout method"),
    }),
    setDefault: useMutation({
      mutationFn: deliveryApi.setDefaultPayoutMethod,
      onSuccess: () => {
        invalidateDelivery(queryClient);
        toast.success("Default payout method updated");
      },
      onError: (error: Error) => toast.error(error.message || "Failed to update payout method"),
    }),
    request: useMutation({
      mutationFn: deliveryApi.requestPayout,
      onSuccess: () => {
        invalidateDelivery(queryClient);
        toast.success("Payout request submitted");
      },
      onError: (error: Error) => toast.error(error.message || "Failed to request payout"),
    }),
  };
};

export const useUpdateDeliveryProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryApi.updateProfile,
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update profile"),
  });
};

export const useAcceptSubOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryApi.acceptSubOrder,
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Delivery accepted successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to accept delivery"),
  });
};

export const useSubOrderArriving = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryApi.subOrderArriving,
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Status updated: Arriving at store");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update status"),
  });
};

export const useSubOrderReachedStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subOrderId, location }: { subOrderId: string; location: { latitude: number; longitude: number } }) =>
      deliveryApi.subOrderReachedStore(subOrderId, location),
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Status updated: Reached store");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to verify store checkpoint"),
  });
};

export const useSubOrderPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subOrderId, payload }: { subOrderId: string; payload: { pickupOtp: string; pickupPhoto?: string } }) =>
      deliveryApi.subOrderPickup(subOrderId, payload),
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Sub-order picked up successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to verify pickup OTP"),
  });
};

export const useSubOrderTransit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryApi.subOrderTransit,
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Status updated: Out for delivery");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update status"),
  });
};

export const useSubOrderNearCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subOrderId, location }: { subOrderId: string; location: { latitude: number; longitude: number } }) =>
      deliveryApi.subOrderNearCustomer(subOrderId, location),
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Status updated: Near customer");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to verify customer checkpoint"),
  });
};

export const useSubOrderDeliver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subOrderId, payload }: { subOrderId: string; payload: { deliveryOtp: string; deliveryPhoto?: string; deliverySignature?: string } }) =>
      deliveryApi.subOrderDeliver(subOrderId, payload),
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Delivery completed successfully. Payout credited.");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to complete delivery"),
  });
};

export const useSubOrderCancel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subOrderId, reason }: { subOrderId: string; reason: string }) =>
      deliveryApi.subOrderCancel(subOrderId, reason),
    onSuccess: () => {
      invalidateDelivery(queryClient);
      toast.success("Delivery job cancelled successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to cancel delivery"),
  });
};
