import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  sellerManagementApi,
  type SellerQueryParams,
} from "../api/sellerManagement.api";

const sellerKeys = {
  all: ["seller-management"] as const,
  dashboard: () => [...sellerKeys.all, "dashboard"] as const,
  setup: () => [...sellerKeys.all, "setup"] as const,
  store: () => [...sellerKeys.all, "store"] as const,
  products: (params: SellerQueryParams) => [...sellerKeys.all, "products", params] as const,
  categories: () => [...sellerKeys.all, "categories"] as const,
  refundPolicies: () => [...sellerKeys.all, "refund-policies"] as const,
  warehouses: () => [...sellerKeys.all, "warehouses"] as const,
  inventory: (params: SellerQueryParams) => [...sellerKeys.all, "inventory", params] as const,
  orders: (params: SellerQueryParams) => [...sellerKeys.all, "orders", params] as const,
  coupons: (params: SellerQueryParams) => [...sellerKeys.all, "coupons", params] as const,
  customers: (params: SellerQueryParams) => [...sellerKeys.all, "customers", params] as const,
  banners: (params: SellerQueryParams) => [...sellerKeys.all, "banners", params] as const,
  sizeCharts: (params: SellerQueryParams) => [...sellerKeys.all, "size-charts", params] as const,
  payouts: () => [...sellerKeys.all, "payouts"] as const,
  reports: (params: SellerQueryParams) => [...sellerKeys.all, "reports", params] as const,
  notifications: (params: SellerQueryParams) => [...sellerKeys.all, "notifications", params] as const,
};

const mutationError = (fallback: string) => (error: Error) => toast.error(error.message || fallback);

export const useSellerDashboard = () =>
  useQuery({ queryKey: sellerKeys.dashboard(), queryFn: sellerManagementApi.getDashboard });

export const useSellerSetupStatusV2 = () =>
  useQuery({ queryKey: sellerKeys.setup(), queryFn: sellerManagementApi.getSetupStatus });

export const useSellerStore = () =>
  useQuery({ queryKey: sellerKeys.store(), queryFn: sellerManagementApi.getStore });

export const useSaveSellerStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.saveStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.all });
      toast.success("Store saved");
    },
    onError: mutationError("Failed to save store"),
  });
};

export const useToggleSellerStoreOpen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.toggleStoreOpen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.all });
      toast.success("Store availability updated");
    },
    onError: mutationError("Failed to update store"),
  });
};

export const useSellerProducts = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.products(params), queryFn: () => sellerManagementApi.getProducts(params) });

export const useSellerCategories = () =>
  useQuery({ queryKey: sellerKeys.categories(), queryFn: sellerManagementApi.getCategories });

export const useSellerRefundPolicies = () =>
  useQuery({ queryKey: sellerKeys.refundPolicies(), queryFn: sellerManagementApi.getRefundPolicies });

export const useSellerPolicies = (type?: string) =>
  useQuery({
    queryKey: ["seller-policies", type],
    queryFn: () => sellerManagementApi.getPolicies(type),
  });

export const useSellerWarehouses = () =>
  useQuery({ queryKey: sellerKeys.warehouses(), queryFn: sellerManagementApi.getWarehouses });

export const useSellerInventory = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.inventory(params), queryFn: () => sellerManagementApi.getInventory(params) });

export const useSellerOrders = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.orders(params), queryFn: () => sellerManagementApi.getOrders(params) });

export const useSellerSubOrders = (params: SellerQueryParams) =>
  useQuery({ queryKey: [...sellerKeys.all, "sub-orders", params] as const, queryFn: () => sellerManagementApi.getSubOrders(params) });

export const useSellerSubOrderDetails = (id: string) =>
  useQuery({ queryKey: [...sellerKeys.all, "sub-order", id] as const, queryFn: () => sellerManagementApi.getSubOrder(id), enabled: !!id });

export const useSellerCoupons = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.coupons(params), queryFn: () => sellerManagementApi.getCoupons(params) });

export const useSellerCustomers = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.customers(params), queryFn: () => sellerManagementApi.getCustomers(params) });

export const useSellerBanners = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.banners(params), queryFn: () => sellerManagementApi.getBanners(params) });

export const useSellerSizeCharts = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.sizeCharts(params), queryFn: () => sellerManagementApi.getSizeCharts(params) });

export const useSellerPayouts = () =>
  useQuery({ queryKey: sellerKeys.payouts(), queryFn: sellerManagementApi.getPayouts });

export const useSellerReports = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.reports(params), queryFn: () => sellerManagementApi.getReports(params) });

export const useSellerNotifications = (params: SellerQueryParams) =>
  useQuery({ queryKey: sellerKeys.notifications(params), queryFn: () => sellerManagementApi.getNotifications(params) });

const invalidateSeller = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: sellerKeys.all });
};

export const useSellerProductMutations = () => {
  const queryClient = useQueryClient();
  return {
    create: useMutation({
      mutationFn: sellerManagementApi.createProduct,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Product draft saved");
      },
      onError: mutationError("Failed to save product"),
    }),
    update: useMutation({
      mutationFn: sellerManagementApi.updateProduct,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Product updated");
      },
      onError: mutationError("Failed to update product"),
    }),
    remove: useMutation({
      mutationFn: sellerManagementApi.deleteProduct,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Product deleted");
      },
      onError: mutationError("Failed to delete product"),
    }),
    submit: useMutation({
      mutationFn: sellerManagementApi.submitProduct,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Product submitted for review");
      },
      onError: mutationError("Failed to submit product"),
    }),
  };
};

export const useSellerCategoryRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.requestCategoryChange,
    onSuccess: () => {
      invalidateSeller(queryClient);
      toast.success("Category request submitted");
    },
    onError: mutationError("Failed to request category change"),
  });
};

export const useSellerStockMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.updateStock,
    onSuccess: () => {
      invalidateSeller(queryClient);
      toast.success("Stock updated");
    },
    onError: mutationError("Failed to update stock"),
  });
};

export const useSellerOrderStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.updateOrderStatus,
    onSuccess: () => {
      invalidateSeller(queryClient);
      toast.success("Order status updated");
    },
    onError: mutationError("Failed to update order"),
  });
};

export const useSellerSubOrderStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.updateSubOrderStatus,
    onSuccess: () => {
      invalidateSeller(queryClient);
      toast.success("Sub-order status updated");
    },
    onError: mutationError("Failed to update sub-order status"),
  });
};

export const useSellerSubOrderCancellationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.approveSubOrderCancellation,
    onSuccess: () => {
      invalidateSeller(queryClient);
      toast.success("Cancellation request processed");
    },
    onError: mutationError("Failed to process cancellation request"),
  });
};

export const useSellerCouponMutations = () => {
  const queryClient = useQueryClient();
  return {
    create: useMutation({
      mutationFn: sellerManagementApi.createCoupon,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Coupon draft saved");
      },
      onError: mutationError("Failed to save coupon"),
    }),
    update: useMutation({
      mutationFn: sellerManagementApi.updateCoupon,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Coupon updated");
      },
      onError: mutationError("Failed to update coupon"),
    }),
    remove: useMutation({
      mutationFn: sellerManagementApi.deleteCoupon,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Coupon deleted");
      },
      onError: mutationError("Failed to delete coupon"),
    }),
    submit: useMutation({
      mutationFn: sellerManagementApi.submitCoupon,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Coupon submitted for review");
      },
      onError: mutationError("Failed to submit coupon"),
    }),
  };
};

export const useSellerBannerMutations = () => {
  const queryClient = useQueryClient();
  return {
    create: useMutation({
      mutationFn: sellerManagementApi.createBanner,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Banner draft saved");
      },
      onError: mutationError("Failed to save banner"),
    }),
    update: useMutation({
      mutationFn: sellerManagementApi.updateBanner,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Banner updated");
      },
      onError: mutationError("Failed to update banner"),
    }),
    remove: useMutation({
      mutationFn: sellerManagementApi.deleteBanner,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Banner deleted");
      },
      onError: mutationError("Failed to delete banner"),
    }),
    submit: useMutation({
      mutationFn: sellerManagementApi.submitBanner,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Banner submitted for review");
      },
      onError: mutationError("Failed to submit banner"),
    }),
  };
};

export const useSellerSizeChartMutations = () => {
  const queryClient = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async () => { throw new Error("Sellers cannot create size charts. Size charts are admin-owned."); },
      onError: (err: Error) => toast.error(err.message),
    }),
    update: useMutation({
      mutationFn: async () => { throw new Error("Sellers cannot edit size charts. Size charts are admin-owned."); },
      onError: (err: Error) => toast.error(err.message),
    }),
    remove: useMutation({
      mutationFn: async () => { throw new Error("Sellers cannot delete size charts. Size charts are admin-owned."); },
      onError: (err: Error) => toast.error(err.message),
    }),
    submit: useMutation({
      mutationFn: async () => { throw new Error("Sellers cannot submit size charts. Size charts are admin-owned."); },
      onError: (err: Error) => toast.error(err.message),
    }),
    assign: useMutation({
      mutationFn: sellerManagementApi.assignSizeChartProducts,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Size chart assignments updated");
      },
      onError: mutationError("Failed to assign size chart"),
    }),
  };
};

export const useSellerPayoutMutations = () => {
  const queryClient = useQueryClient();
  return {
    addMethod: useMutation({
      mutationFn: sellerManagementApi.addPayoutMethod,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Payout method submitted");
      },
      onError: mutationError("Failed to save payout method"),
    }),
    setDefault: useMutation({
      mutationFn: sellerManagementApi.setDefaultPayoutMethod,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Default payout method updated");
      },
      onError: mutationError("Failed to update payout method"),
    }),
    request: useMutation({
      mutationFn: sellerManagementApi.requestPayout,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Payout request submitted");
      },
      onError: mutationError("Failed to request payout"),
    }),
  };
};

export const useSellerNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerManagementApi.markNotificationRead,
    onSuccess: () => {
      invalidateSeller(queryClient);
      toast.success("Notification marked as read");
    },
    onError: mutationError("Failed to update notification"),
  });
};

export const useSellerMallMutations = () => {
  const queryClient = useQueryClient();
  return {
    requestConnection: useMutation({
      mutationFn: sellerManagementApi.requestMallConnection,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Mall connection request submitted");
      },
      onError: mutationError("Failed to request mall connection"),
    }),
    requestCreation: useMutation({
      mutationFn: sellerManagementApi.requestMallCreation,
      onSuccess: () => {
        invalidateSeller(queryClient);
        toast.success("Mall creation request submitted");
      },
      onError: mutationError("Failed to request mall creation"),
    }),
  };
};
